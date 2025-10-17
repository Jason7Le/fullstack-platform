import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsEntity } from './entities/settings.entity';

/**
 * 系统设置接口
 * 定义系统级别的配置参数
 */
export interface SystemSettings {
  /** 自动刷新间隔（秒） */
  autoRefreshInterval: number;
  /** 数据保留天数 */
  dataRetentionDays: number;
  /** 错误阈值 */
  errorThreshold: number;
  /** 性能阈值（毫秒） */
  performanceThreshold: number;
}

/**
 * 监控设置接口
 * 定义各种监控功能的配置参数
 */
export interface MonitoringSettings {
  /** Web Vitals 监控是否启用 */
  webVitalsEnabled: boolean;
  /** Web Vitals 监控的页面范围（逗号分隔） */
  webVitalsPages: string;
  /** 微前端监控是否启用 */
  microFrontendEnabled: boolean;
  /** 微前端监控的页面范围（逗号分隔） */
  microFrontendPages: string;
  /** 错误监控是否启用 */
  errorMonitoringEnabled: boolean;
  /** 错误监控的页面范围（逗号分隔） */
  errorMonitoringPages: string;
}

/**
 * 通知设置接口
 * 定义各种通知方式的配置参数
 */
export interface NotificationSettings {
  /** 邮件通知是否启用 */
  emailEnabled: boolean;
  /** 邮件地址 */
  emailAddress: string;
  /** Webhook 通知是否启用 */
  webhookEnabled: boolean;
  /** Webhook URL */
  webhookUrl: string;
  /** 通知级别：all(全部)、error(仅错误)、warning(警告及以上)、none(无) */
  notificationLevel: 'all' | 'error' | 'warning' | 'none';
}

/**
 * 所有设置接口
 * 包含系统、监控、通知三个模块的完整配置
 */
export interface AllSettings {
  /** 系统配置 */
  system: SystemSettings;
  /** 监控配置 */
  monitoring: MonitoringSettings;
  /** 通知配置 */
  notification: NotificationSettings;
}

/**
 * 系统设置服务
 * 负责管理系统配置、监控配置、通知配置的存储和检索
 *
 * @description
 * - 提供统一的配置管理接口
 * - 支持配置的持久化存储
 * - 提供默认配置值
 * - 支持配置的批量操作
 */
@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingsEntity)
    private settingsRepository: Repository<SettingsEntity>,
  ) {}

  /**
   * 获取所有系统设置
   * @returns 包含系统、监控、通知三个模块的完整配置
   * @description 从数据库中读取配置，如果不存在则返回默认值
   */
  async getSettings(): Promise<AllSettings> {
    const settings = await this.settingsRepository.find();
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));

    return {
      system: {
        autoRefreshInterval: this.parseValue(settingsMap.get('system.autoRefreshInterval'), 30),
        dataRetentionDays: this.parseValue(settingsMap.get('system.dataRetentionDays'), 30),
        errorThreshold: this.parseValue(settingsMap.get('system.errorThreshold'), 10),
        performanceThreshold: this.parseValue(settingsMap.get('system.performanceThreshold'), 2000),
      },
      monitoring: {
        webVitalsEnabled: this.parseValue(settingsMap.get('monitoring.webVitalsEnabled'), true),
        webVitalsPages: this.parseValue(
          settingsMap.get('monitoring.webVitalsPages'),
          '/dashboard,/dashboard-remote,/login',
        ),
        microFrontendEnabled: this.parseValue(
          settingsMap.get('monitoring.microFrontendEnabled'),
          true,
        ),
        microFrontendPages: this.parseValue(
          settingsMap.get('monitoring.microFrontendPages'),
          '/dashboard-remote,/admin/*',
        ),
        errorMonitoringEnabled: this.parseValue(
          settingsMap.get('monitoring.errorMonitoringEnabled'),
          true,
        ),
        errorMonitoringPages: this.parseValue(
          settingsMap.get('monitoring.errorMonitoringPages'),
          '/*',
        ),
      },
      notification: {
        emailEnabled: this.parseValue(settingsMap.get('notification.emailEnabled'), false),
        emailAddress: this.parseValue(settingsMap.get('notification.emailAddress'), ''),
        webhookEnabled: this.parseValue(settingsMap.get('notification.webhookEnabled'), false),
        webhookUrl: this.parseValue(settingsMap.get('notification.webhookUrl'), ''),
        notificationLevel: this.parseValue(
          settingsMap.get('notification.notificationLevel'),
          'error',
        ),
      },
    };
  }

  /**
   * 保存系统配置
   * @param settings 系统配置参数
   * @description 将系统配置保存到数据库，使用 system. 前缀
   */
  async saveSystemSettings(settings: SystemSettings): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.saveSetting(`system.${key}`, value, `系统配置: ${key}`);
    }
  }

  /**
   * 保存监控配置
   * @param settings 监控配置参数
   * @description 将监控配置保存到数据库，使用 monitoring. 前缀
   */
  async saveMonitoringSettings(settings: MonitoringSettings): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.saveSetting(`monitoring.${key}`, value, `监控配置: ${key}`);
    }
  }

  /**
   * 保存通知配置
   * @param settings 通知配置参数
   * @description 将通知配置保存到数据库，使用 notification. 前缀
   */
  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.saveSetting(`notification.${key}`, value, `通知配置: ${key}`);
    }
  }

  /**
   * 保存所有设置
   * @param settings 包含系统、监控、通知三个模块的完整配置
   * @description 并行保存所有配置模块
   */
  async saveAllSettings(settings: AllSettings): Promise<void> {
    await Promise.all([
      this.saveSystemSettings(settings.system),
      this.saveMonitoringSettings(settings.monitoring),
      this.saveNotificationSettings(settings.notification),
    ]);
  }

  /**
   * 重置设置为默认值
   * @description 清空数据库中的所有配置，下次获取时将使用默认值
   */
  async resetSettings(): Promise<void> {
    await this.settingsRepository.clear();
  }

  /**
   * 解析配置值
   * @param value 数据库中的字符串值
   * @param defaultValue 默认值
   * @returns 解析后的值
   * @description 将数据库中的字符串值转换为对应的数据类型
   */
  private parseValue(value: string | undefined, defaultValue: any): any {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }

    // 尝试解析为 JSON
    try {
      return JSON.parse(value);
    } catch {
      // 如果解析失败，返回原始字符串
      return value;
    }
  }

  /**
   * 序列化配置值
   * @param value 配置值
   * @returns 序列化后的字符串
   * @description 将配置值转换为字符串存储到数据库
   */
  private serializeValue(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }

  /**
   * 保存单个设置项
   * @param key 设置键名
   * @param value 设置值
   * @param description 设置描述（可选）
   * @description 内部方法，用于保存单个配置项到数据库
   */
  private async saveSetting(key: string, value: any, description?: string): Promise<void> {
    const existing = await this.settingsRepository.findOne({ where: { key } });
    const serializedValue = this.serializeValue(value);

    if (existing) {
      existing.value = serializedValue;
      existing.description = description;
      await this.settingsRepository.save(existing);
    } else {
      const newSetting = this.settingsRepository.create({
        key,
        value: serializedValue,
        description,
      });
      await this.settingsRepository.save(newSetting);
    }
  }
}
