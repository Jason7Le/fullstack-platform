import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { SettingsService } from './settings.service';

/**
 * 系统设置数据传输对象
 * 用于接收和验证系统配置参数
 */
export class SystemSettingsDto {
  /** 自动刷新间隔（秒） */
  @IsNumber()
  autoRefreshInterval: number;

  /** 数据保留天数 */
  @IsNumber()
  dataRetentionDays: number;

  /** 错误阈值 */
  @IsNumber()
  errorThreshold: number;

  /** 性能阈值（毫秒） */
  @IsNumber()
  performanceThreshold: number;
}

/**
 * 监控设置数据传输对象
 * 用于配置各种监控功能的开关和页面范围
 */
export class MonitoringSettingsDto {
  /** Web Vitals 监控是否启用 */
  @IsBoolean()
  webVitalsEnabled: boolean;

  /** Web Vitals 监控的页面范围（逗号分隔） */
  @IsString()
  webVitalsPages: string;

  /** 微前端监控是否启用 */
  @IsBoolean()
  microFrontendEnabled: boolean;

  /** 微前端监控的页面范围（逗号分隔） */
  @IsString()
  microFrontendPages: string;

  /** 错误监控是否启用 */
  @IsBoolean()
  errorMonitoringEnabled: boolean;

  /** 错误监控的页面范围（逗号分隔） */
  @IsString()
  errorMonitoringPages: string;
}

/**
 * 通知设置数据传输对象
 * 用于配置各种通知方式和级别
 */
export class NotificationSettingsDto {
  /** 邮件通知是否启用 */
  @IsBoolean()
  emailEnabled: boolean;

  /** 邮件地址（可选） */
  @IsString()
  @IsOptional()
  emailAddress: string;

  /** Webhook 通知是否启用 */
  @IsBoolean()
  webhookEnabled: boolean;

  /** Webhook URL（可选） */
  @IsString()
  @IsOptional()
  webhookUrl: string;

  /** 通知级别：all(全部)、error(仅错误)、warning(警告及以上)、none(无) */
  @IsIn(['all', 'error', 'warning', 'none'])
  notificationLevel: 'all' | 'error' | 'warning' | 'none';
}

/**
 * 所有设置数据传输对象
 * 包含系统、监控、通知三个模块的完整配置
 */
export class AllSettingsDto {
  /** 系统配置 */
  system: SystemSettingsDto;
  /** 监控配置 */
  monitoring: MonitoringSettingsDto;
  /** 通知配置 */
  notification: NotificationSettingsDto;
}

/**
 * 系统设置控制器
 * 提供系统配置、监控配置、通知配置的 CRUD 操作
 *
 * @description
 * - 支持分别保存和获取系统、监控、通知三个模块的配置
 * - 支持一次性保存和获取所有配置
 * - 提供配置重置功能
 * - 所有接口都支持 Swagger 文档
 */
@ApiTags('Settings')
@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * 获取所有系统设置
   * @returns 包含系统、监控、通知三个模块的完整配置
   */
  @Get()
  @ApiOperation({ summary: '获取所有系统设置' })
  @ApiResponse({ status: 200, description: '返回所有设置数据' })
  async getSettings() {
    const settings = await this.settingsService.getSettings();
    return {
      success: true,
      data: settings,
    };
  }

  /**
   * 保存系统配置
   * @param settings 系统配置参数（自动刷新间隔、数据保留天数、错误阈值、性能阈值）
   * @returns 保存结果
   */
  @Post('system')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '保存系统配置' })
  @ApiResponse({ status: 200, description: '系统配置保存成功' })
  async saveSystemSettings(@Body() settings: SystemSettingsDto) {
    await this.settingsService.saveSystemSettings(settings);
    return {
      success: true,
      message: '系统配置已保存',
    };
  }

  /**
   * 保存监控配置
   * @param settings 监控配置参数（Web Vitals、微前端、错误监控的开关和页面范围）
   * @returns 保存结果
   */
  @Post('monitoring')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '保存监控配置' })
  @ApiResponse({ status: 200, description: '监控配置保存成功' })
  async saveMonitoringSettings(@Body() settings: MonitoringSettingsDto) {
    await this.settingsService.saveMonitoringSettings(settings);
    return {
      success: true,
      message: '监控配置已保存',
    };
  }

  /**
   * 保存通知配置
   * @param settings 通知配置参数（邮件、Webhook 通知的开关和级别）
   * @returns 保存结果
   */
  @Post('notification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '保存通知配置' })
  @ApiResponse({ status: 200, description: '通知配置保存成功' })
  async saveNotificationSettings(@Body() settings: NotificationSettingsDto) {
    await this.settingsService.saveNotificationSettings(settings);
    return {
      success: true,
      message: '通知配置已保存',
    };
  }

  /**
   * 保存所有设置
   * @param settings 包含系统、监控、通知三个模块的完整配置
   * @returns 保存结果
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '保存所有设置' })
  @ApiResponse({ status: 200, description: '所有设置保存成功' })
  async saveAllSettings(@Body() settings: AllSettingsDto) {
    await this.settingsService.saveAllSettings(settings);
    return {
      success: true,
      message: '所有设置已保存',
    };
  }

  /**
   * 重置设置为默认值
   * @returns 重置结果
   * @description 将所有配置恢复为系统默认值，用于故障恢复或初始化
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重置设置为默认值' })
  @ApiResponse({ status: 200, description: '设置已重置为默认值' })
  async resetSettings() {
    await this.settingsService.resetSettings();
    return {
      success: true,
      message: '设置已重置为默认值',
    };
  }
}
