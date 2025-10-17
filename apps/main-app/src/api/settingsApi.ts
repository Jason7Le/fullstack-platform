import httpClient from '@/utils/httpClient';

// 系统设置接口定义
export interface SystemSettings {
  autoRefreshInterval: number;
  dataRetentionDays: number;
  errorThreshold: number;
  performanceThreshold: number;
}

export interface MonitoringSettings {
  webVitalsEnabled: boolean;
  webVitalsPages: string;
  microFrontendEnabled: boolean;
  microFrontendPages: string;
  errorMonitoringEnabled: boolean;
  errorMonitoringPages: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  emailAddress: string;
  webhookEnabled: boolean;
  webhookUrl: string;
  notificationLevel: 'all' | 'error' | 'warning' | 'none';
}

export interface AllSettings {
  system: SystemSettings;
  monitoring: MonitoringSettings;
  notification: NotificationSettings;
}

// 临时直接调用设置服务，绕过 API 网关
const settingsHttpClient = {
  get: (url: string) => httpClient.get(url, { baseURL: 'http://localhost:3002' }),
  post: (url: string, data?: any) =>
    httpClient.post(url, data, { baseURL: 'http://localhost:3002' }),
};

/**
 * 系统设置 API 服务
 */
export const settingsApi = {
  /**
   * 获取所有设置
   */
  getSettings: (): Promise<{
    success: boolean;
    data: AllSettings;
  }> => {
    return settingsHttpClient.get('/api/settings');
  },

  /**
   * 保存系统配置
   */
  saveSystemSettings: (
    settings: SystemSettings,
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    return settingsHttpClient.post('/api/settings/system', settings);
  },

  /**
   * 保存监控配置
   */
  saveMonitoringSettings: (
    settings: MonitoringSettings,
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    return settingsHttpClient.post('/api/settings/monitoring', settings);
  },

  /**
   * 保存通知配置
   */
  saveNotificationSettings: (
    settings: NotificationSettings,
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    return settingsHttpClient.post('/api/settings/notification', settings);
  },

  /**
   * 保存所有设置
   */
  saveAllSettings: (
    settings: AllSettings,
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    return settingsHttpClient.post('/api/settings', settings);
  },

  /**
   * 重置设置到默认值
   */
  resetSettings: (): Promise<{
    success: boolean;
    message: string;
  }> => {
    return settingsHttpClient.post('/api/settings/reset');
  },
};
