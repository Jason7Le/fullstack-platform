import httpClient from '@/utils/httpClient';

// 监控指标接口
export interface MonitoringMetrics {
  webVitals: {
    TTFB: { value: number; unit: string; rating: string };
    FCP: { value: number; unit: string; rating: string };
    LCP: { value: number; unit: string; rating: string };
    INP: { value: number; unit: string; rating: string };
    CLS: { value: number; unit: string; rating: string };
  };
  microFrontend: {
    totalLoads: number;
    averageLoadTime: number;
    errorRate: number;
    components: string[];
  };
  errors: {
    totalErrors: number;
    criticalErrors: number;
    warningErrors: number;
    infoErrors: number;
    errorRate: number;
  };
  system: {
    uptime: string;
    responseTime: number;
    throughput: number;
    activeUsers: number;
  };
}

// Web Vitals 历史数据接口
export interface WebVitalsHistory {
  startTime: string;
  endTime: string;
  history: Array<{
    timestamp: number;
    ttfb: number;
    fcp: number;
    lcp: number;
    inp: number;
    cls: number;
  }>;
}

// 微前端性能数据接口
export interface MicroFrontendPerformance {
  performance: Array<{
    componentName: string;
    loadTime: number;
    renderTime: number;
    timestamp: number;
    url: string;
  }>;
}

// 错误统计接口
export interface ErrorStatistics {
  statistics: Array<{
    component: string;
    error: { name: string; message: string };
    severity: string;
    timestamp: number;
    url: string;
  }>;
}

/**
 * 监控数据 API 服务
 */
export const monitoringApi = {
  /**
   * 获取监控指标
   */
  getMetrics: (): Promise<{
    success: boolean;
    data: { message: string; timestamp: string; metrics: MonitoringMetrics };
  }> => {
    return httpClient.get('/api/analytics/metrics');
  },

  /**
   * 获取 Web Vitals 历史数据
   */
  getWebVitalsHistory: (
    startTime?: string,
    endTime?: string,
  ): Promise<{
    success: boolean;
    data: {
      message: string;
      startTime: string;
      endTime: string;
      history: WebVitalsHistory['history'];
    };
  }> => {
    const params = new URLSearchParams();
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);

    const queryString = params.toString();
    const url = queryString
      ? `/api/analytics/web-vitals/history?${queryString}`
      : '/api/analytics/web-vitals/history';

    return httpClient.get(url);
  },

  /**
   * 获取微前端性能数据
   */
  getMicroFrontendPerformance: (): Promise<{
    success: boolean;
    data: {
      message: string;
      timestamp: string;
      performance: MicroFrontendPerformance['performance'];
    };
  }> => {
    return httpClient.get('/api/analytics/micro-frontend/performance');
  },

  /**
   * 获取错误统计
   */
  getErrorStatistics: (): Promise<{
    success: boolean;
    data: { message: string; timestamp: string; statistics: ErrorStatistics['statistics'] };
  }> => {
    return httpClient.get('/api/analytics/errors/statistics');
  },
};
