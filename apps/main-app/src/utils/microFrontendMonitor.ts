/**
 * 检查当前页面是否应该被监控
 * 根据配置的监控页面列表和环境变量判断
 *
 * @returns 是否应该监控当前页面
 */
function shouldMonitorCurrentPage(): boolean {
  // 获取监控配置
  const enabledPages = import.meta.env.VITE_MICRO_FRONTEND_PAGES;
  const isEnabled = import.meta.env.VITE_MICRO_FRONTEND_ENABLED === 'true';
  const isProd = import.meta.env.PROD;

  // 如果没有启用监控，直接返回 false
  if (!isEnabled && !isProd) {
    return false;
  }

  // 如果没有配置监控页面，则监控所有页面
  if (!enabledPages) {
    return true;
  }

  // 解析监控页面配置
  const pagesToMonitor = enabledPages.split(',').map(page => page.trim());
  const currentPath = window.location.pathname;

  // 检查当前页面是否在监控列表中
  const shouldMonitor = pagesToMonitor.some((page: string) => {
    // 支持精确匹配和通配符匹配
    if (page.includes('*')) {
      const pattern = page.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(currentPath);
    }
    return currentPath === page;
  });

  console.log(`[Micro Frontend] 页面监控检查:`, {
    currentPath,
    enabledPages: pagesToMonitor,
    shouldMonitor,
    isEnabled,
    isProd,
  });

  return shouldMonitor;
}

/**
 * 微前端性能监控模块
 * 用于监控远程组件的加载性能、渲染时间和错误情况
 */

/**
 * 微前端性能指标接口定义
 *
 * 单位说明：
 * - loadTime, renderTime, value: 毫秒 (ms)
 * - timestamp: 毫秒时间戳 (ms)
 */
export interface MicroFrontendMetric {
  /** 指标名称 */
  name: string;
  /** 指标数值（通常是时间，单位：毫秒ms） */
  value: number;
  /** 时间戳（毫秒ms） */
  timestamp: number;
  /** 当前页面URL */
  url: string;
  /** 组件名称 */
  componentName: string;
  /** 加载时间（毫秒ms，可选） */
  loadTime?: number;
  /** 渲染时间（毫秒ms，可选） */
  renderTime?: number;
}

/**
 * 微前端性能监控类
 * 负责收集、存储和发送微前端相关的性能指标
 */
export class MicroFrontendMonitor {
  /** 存储收集到的性能指标 */
  private metrics: MicroFrontendMetric[] = [];

  /**
   * 记录远程组件加载时间
   * 用于监控微前端组件的加载性能
   *
   * @param componentName - 组件名称
   * @param loadTime - 加载时间（毫秒ms）
   */
  recordLoadTime(componentName: string, loadTime: number): void {
    // 检查是否应该监控当前页面
    if (!shouldMonitorCurrentPage()) {
      return;
    }

    const metric: MicroFrontendMetric = {
      name: 'micro_frontend_load_time',
      value: loadTime,
      timestamp: Date.now(),
      url: window.location.href,
      componentName,
      loadTime,
    };

    this.metrics.push(metric);
    this.sendMetricToBackend(metric);

    if (import.meta.env.MODE === 'development') {
      console.log(`微前端组件 ${componentName} 加载时间: ${loadTime}ms`);
    }
  }

  /**
   * 记录远程组件渲染时间
   * 用于监控微前端组件的渲染性能
   *
   * @param componentName - 组件名称
   * @param renderTime - 渲染时间（毫秒ms）
   */
  recordRenderTime(componentName: string, renderTime: number): void {
    // 检查是否应该监控当前页面
    if (!shouldMonitorCurrentPage()) {
      return;
    }

    const metric: MicroFrontendMetric = {
      name: 'micro_frontend_render_time',
      value: renderTime,
      timestamp: Date.now(),
      url: window.location.href,
      componentName,
      renderTime,
    };

    this.metrics.push(metric);
    this.sendMetricToBackend(metric);

    if (import.meta.env.MODE === 'development') {
      console.log(`微前端组件 ${componentName} 渲染时间: ${renderTime}ms`);
    }
  }

  /**
   * 记录微前端错误
   * 用于监控微前端组件运行时的错误情况
   *
   * @param componentName - 组件名称
   * @param error - 错误对象
   */
  recordError(componentName: string, error: Error): void {
    // 检查是否应该监控当前页面
    if (!shouldMonitorCurrentPage()) {
      return;
    }

    const metric: MicroFrontendMetric = {
      name: 'micro_frontend_error',
      value: 1,
      timestamp: Date.now(),
      url: window.location.href,
      componentName,
    };

    this.metrics.push(metric);
    this.sendErrorToBackend(componentName, error);

    console.error(`微前端组件 ${componentName} 错误:`, error);
  }

  /**
   * 发送性能指标到后端
   * 私有方法，用于将收集到的指标发送到分析服务
   *
   * @param metric - 要发送的性能指标
   * @private
   */
  private async sendMetricToBackend(metric: MicroFrontendMetric): Promise<void> {
    const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    if (!analyticsEndpoint) return;

    try {
      await fetch(`${analyticsEndpoint}/micro-frontend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.warn('微前端指标 API 不可用（开发环境正常）:', error);
      } else {
        console.error('发送微前端指标失败:', error);
      }
    }
  }

  /**
   * 发送错误信息到后端
   * 私有方法，用于将微前端错误发送到分析服务
   *
   * @param componentName - 组件名称
   * @param error - 错误对象
   * @private
   */
  private async sendErrorToBackend(componentName: string, error: Error): Promise<void> {
    const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    if (!analyticsEndpoint) return;

    try {
      await fetch(`${analyticsEndpoint}/micro-frontend-errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          componentName,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.warn('微前端错误 API 不可用（开发环境正常）:', err);
      } else {
        console.error('发送微前端错误失败:', err);
      }
    }
  }

  /**
   * 获取所有收集到的性能指标
   * 返回指标数组的副本，避免外部修改
   *
   * @returns 性能指标数组的副本
   */
  getMetrics(): MicroFrontendMetric[] {
    return [...this.metrics];
  }

  /**
   * 清空所有性能指标
   * 用于重置监控数据
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

/**
 * 创建全局监控实例
 * 单例模式，确保整个应用只有一个监控实例
 */
export const microFrontendMonitor = new MicroFrontendMonitor();

/**
 * 微前端组件性能跟踪装饰器
 * 用于自动跟踪组件方法的执行时间
 *
 * @param componentName - 组件名称
 * @returns 装饰器函数
 */
export function trackRemoteComponent(componentName: string) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();

      try {
        const result = await originalMethod.apply(this, args);
        const endTime = performance.now();

        // 记录加载时间
        microFrontendMonitor.recordLoadTime(componentName, endTime - startTime);

        return result;
      } catch (error) {
        // 记录错误
        microFrontendMonitor.recordError(componentName, error as Error);
        throw error;
      }
    };

    return descriptor;
  };
}
