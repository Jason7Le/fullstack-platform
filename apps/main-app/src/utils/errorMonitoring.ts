/**
 * 检查当前页面是否应该被监控
 * 根据配置的监控页面列表和环境变量判断
 *
 * @returns 是否应该监控当前页面
 */
function shouldMonitorCurrentPage(): boolean {
  // 获取监控配置
  const enabledPages = import.meta.env.VITE_ERROR_MONITORING_PAGES;
  const isEnabled = import.meta.env.VITE_ERROR_MONITORING_ENABLED === 'true';
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
  const pagesToMonitor = enabledPages.split(',').map((page: string) => page.trim());
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

  console.log(`[Error Monitoring] 页面监控检查:`, {
    currentPath,
    enabledPages: pagesToMonitor,
    shouldMonitor,
    isEnabled,
    isProd,
  });

  return shouldMonitor;
}

/**
 * 前端错误监控服务
 * 用于捕获、记录和发送前端应用中的各种错误
 */

/**
 * 错误信息接口定义
 *
 * 单位说明：
 * - timestamp: 毫秒时间戳 (ms)
 * - severity: 错误严重程度等级 (low, medium, high, critical)
 */
export interface ErrorInfo {
  /** 错误消息 */
  message: string;
  /** 错误堆栈信息（可选） */
  stack?: string;
  /** 错误名称 */
  name: string;
  /** 时间戳（毫秒ms） */
  timestamp: number;
  /** 发生错误的页面URL */
  url: string;
  /** 用户代理信息 */
  userAgent: string;
  /** 组件名称（可选） */
  componentName?: string;
  /** 错误严重程度 (low, medium, high, critical) */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 错误监控服务类
 * 负责捕获、存储和发送前端错误信息
 */
export class ErrorMonitoringService {
  /** 存储收集到的错误信息 */
  private errors: ErrorInfo[] = [];
  /** 会话ID，用于关联同一会话中的错误 */
  private sessionId: string;

  /**
   * 构造函数
   * 初始化会话ID
   */
  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * 初始化错误监控
   * 设置全局错误监听器
   *
   * @returns 错误监控服务实例
   */
  static init(): ErrorMonitoringService {
    const service = new ErrorMonitoringService();

    // 监听全局 JavaScript 错误
    window.addEventListener('error', event => {
      service.handleGlobalError(event);
    });

    // 监听未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', event => {
      service.handleUnhandledRejection(event);
    });

    return service;
  }

  /**
   * 处理全局 JavaScript 错误
   * 私有方法，用于处理 window.onerror 事件
   *
   * @param event - 错误事件对象
   * @private
   */
  private handleGlobalError(event: ErrorEvent): void {
    const errorInfo: ErrorInfo = {
      message: event.message,
      stack: event.error?.stack,
      name: event.error?.name || 'Error',
      timestamp: Date.now(),
      url: event.filename || window.location.href,
      userAgent: navigator.userAgent,
      severity: this.determineSeverity(event.error),
    };

    this.recordError(errorInfo);
  }

  /**
   * 处理未处理的 Promise 拒绝
   * 私有方法，用于处理 unhandledrejection 事件
   *
   * @param event - Promise 拒绝事件对象
   * @private
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const error = event.reason;
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error?.message || 'Unhandled Promise Rejection',
      stack: error?.stack,
      name: error?.name || 'PromiseRejection',
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      severity: this.determineSeverity(error),
    };

    this.recordError(errorInfo);
  }

  /**
   * 记录错误信息
   * 将错误信息存储到本地并发送到后端
   *
   * @param errorInfo - 错误信息对象
   */
  recordError(errorInfo: ErrorInfo): void {
    // 检查是否应该监控当前页面
    if (!shouldMonitorCurrentPage()) {
      return;
    }

    this.errors.push(errorInfo);
    this.sendErrorToBackend(errorInfo);

    if (import.meta.env.MODE === 'development') {
      console.error('记录错误:', errorInfo);
    }
  }

  /**
   * 发送错误信息到后端
   * 私有方法，用于将错误信息发送到分析服务
   *
   * @param errorInfo - 要发送的错误信息
   * @private
   */
  private async sendErrorToBackend(errorInfo: ErrorInfo): Promise<void> {
    const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    if (!analyticsEndpoint) return;

    try {
      await fetch(`${analyticsEndpoint}/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...errorInfo,
          sessionId: this.sessionId,
        }),
      });
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.warn('错误监控 API 不可用（开发环境正常）:', error);
      } else {
        console.error('发送错误到后端失败:', error);
      }
    }
  }

  /**
   * 确定错误严重程度
   * 根据错误类型和内容判断严重程度
   *
   * @param error - 错误对象
   * @returns 错误严重程度
   * @private
   */
  private determineSeverity(error: any): ErrorInfo['severity'] {
    // 代码块加载错误 - 中等严重程度
    if (error?.name === 'ChunkLoadError' || error?.message?.includes('Loading chunk')) {
      return 'medium';
    }

    // 网络相关错误 - 中等严重程度
    if (error?.message?.includes('Network') || error?.message?.includes('fetch')) {
      return 'medium';
    }

    // 类型错误和引用错误 - 高严重程度
    if (error?.name === 'TypeError' || error?.name === 'ReferenceError') {
      return 'high';
    }

    // 其他错误 - 低严重程度
    return 'low';
  }

  /**
   * 生成会话ID
   * 用于关联同一会话中的错误
   *
   * @returns 唯一的会话ID
   * @private
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取所有错误信息
   * 返回错误数组的副本，避免外部修改
   *
   * @returns 错误信息数组的副本
   */
  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  /**
   * 清空错误记录
   * 用于重置错误监控数据
   */
  clearErrors(): void {
    this.errors = [];
  }
}
