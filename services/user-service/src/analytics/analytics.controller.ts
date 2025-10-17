import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Web Vitals 数据接口定义
 *
 * 单位说明：
 * - TTFB, FCP, LCP, INP: 毫秒 (ms)
 * - CLS: 无单位 (0-1 之间的数值)
 * - timestamp: 毫秒时间戳 (ms)
 */
interface WebVitalsData {
  /** 指标名称 (TTFB, FCP, LCP, INP, CLS) */
  name: string;
  /** 指标数值 - TTFB/FCP/LCP/INP: 毫秒(ms), CLS: 无单位(0-1) */
  value: number;
  /** 指标单位 - 'ms' 或 'unitless' */
  unit: string;
  /** 指标评级 (good, needs-improvement, poor) */
  rating: string;
  /** 指标变化量 - 单位同 value */
  delta: number;
  /** 指标唯一标识符 */
  id: string;
  /** 导航类型 (navigate, reload, back-forward, prerender) */
  navigationType: string;
  /** 时间戳（毫秒ms） */
  timestamp: number;
  /** 页面URL */
  url: string;
  /** 用户代理信息 */
  userAgent: string;
}

/**
 * 微前端性能数据接口定义
 *
 * 单位说明：
 * - loadTime, renderTime, value: 毫秒 (ms)
 * - timestamp: 毫秒时间戳 (ms)
 */
interface MicroFrontendData {
  /** 指标名称 */
  name: string;
  /** 指标数值（毫秒ms） */
  value: number;
  /** 时间戳（毫秒ms） */
  timestamp: number;
  /** 页面URL */
  url: string;
  /** 组件名称 */
  componentName: string;
  /** 加载时间（毫秒ms，可选） */
  loadTime?: number;
  /** 渲染时间（毫秒ms，可选） */
  renderTime?: number;
}

/**
 * 微前端错误数据接口定义
 *
 * 单位说明：
 * - timestamp: 毫秒时间戳 (ms)
 */
interface MicroFrontendErrorData {
  /** 组件名称 */
  componentName: string;
  /** 错误信息 */
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  /** 时间戳（毫秒ms） */
  timestamp: number;
  /** 页面URL */
  url: string;
  /** 用户代理信息 */
  userAgent: string;
}

/**
 * 前端错误数据接口定义
 *
 * 单位说明：
 * - timestamp: 毫秒时间戳 (ms)
 * - severity: 错误严重程度等级 (low, medium, high, critical)
 */
interface FrontendErrorData {
  /** 错误消息 */
  message: string;
  /** 错误名称 */
  name: string;
  /** 错误严重程度 (low, medium, high, critical) */
  severity: string;
  /** 页面URL */
  url: string;
  /** 会话ID */
  sessionId: string;
  /** 时间戳（毫秒ms） */
  timestamp: number;
  /** 用户代理信息 */
  userAgent: string;
  /** 错误堆栈信息（可选） */
  stack?: string;
  /** 组件名称（可选） */
  componentName?: string;
}

/**
 * 分析控制器
 * 负责接收和处理前端发送的各种监控数据
 * 包括 Web Vitals、微前端性能指标、错误信息等
 */
@ApiTags('Analytics')
@Controller('api/analytics')
export class AnalyticsController {
  /**
   * 构造函数
   */
  constructor() {}

  /**
   * 接收前端 Web Vitals 数据
   * 用于收集和分析页面性能指标
   *
   * @param data - Web Vitals 数据对象
   * @returns 响应结果
   */
  @Post('web-vitals')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '接收前端 Web Vitals 数据（单个）' })
  @ApiResponse({ status: 200, description: '数据接收成功' })
  async receiveWebVitals(@Body() data: WebVitalsData) {
    console.log('📊 [Analytics] 收到 Web Vitals 数据:', {
      name: data.name,
      value: data.value,
      unit: data.unit,
      rating: data.rating,
      url: data.url,
      timestamp: new Date(data.timestamp).toISOString(),
      navigationType: data.navigationType,
    });

    // 这里可以集成到监控服务
    // await this.monitoringService.recordWebVital(data);

    return { success: true, message: 'Web Vitals 数据已接收' };
  }

  @Post('web-vitals/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '接收前端 Web Vitals 数据（批量）' })
  @ApiResponse({ status: 200, description: '批量数据接收成功' })
  async receiveWebVitalsBatch(
    @Body() data: { metrics: WebVitalsData[]; batchInfo: any },
  ) {
    console.log('📊 [Analytics] 收到 Web Vitals 批量数据:', {
      totalCount: data.batchInfo.totalCount,
      submittedAt: new Date(data.batchInfo.submittedAt).toISOString(),
      pageUrl: data.batchInfo.pageUrl,
      metrics: data.metrics.map((metric) => ({
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        rating: metric.rating,
      })),
    });

    // 批量处理每个指标
    for (const metric of data.metrics) {
      // 这里可以集成到监控服务
      // await this.monitoringService.recordWebVital(metric);
    }

    return {
      success: true,
      message: `批量 Web Vitals 数据已接收，共 ${data.metrics.length} 个指标`,
      processedCount: data.metrics.length,
    };
  }

  /**
   * 接收微前端性能数据
   * 用于收集和分析微前端组件的性能指标
   *
   * @param data - 微前端性能数据对象
   * @returns 响应结果
   */
  @Post('micro-frontend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '接收微前端性能数据' })
  @ApiResponse({ status: 200, description: '数据接收成功' })
  async receiveMicroFrontendMetrics(@Body() data: MicroFrontendData) {
    console.log('收到微前端性能数据:', {
      name: data.name,
      componentName: data.componentName,
      value: data.value,
      url: data.url,
      timestamp: new Date(data.timestamp).toISOString(),
    });

    // 这里可以集成到监控服务
    // await this.monitoringService.recordMicroFrontendMetric(data);

    return { success: true, message: '微前端性能数据已接收' };
  }

  /**
   * 接收微前端错误数据
   * 用于收集和分析微前端组件的错误信息
   *
   * @param data - 微前端错误数据对象
   * @returns 响应结果
   */
  @Post('micro-frontend-errors')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '接收微前端错误数据' })
  @ApiResponse({ status: 200, description: '数据接收成功' })
  async receiveMicroFrontendErrors(@Body() data: MicroFrontendErrorData) {
    console.log('收到微前端错误数据:', {
      componentName: data.componentName,
      error: data.error,
      url: data.url,
      timestamp: new Date(data.timestamp).toISOString(),
    });

    // 这里可以集成到错误监控服务
    // await this.errorMonitoringService.recordMicroFrontendError(data);

    return { success: true, message: '微前端错误数据已接收' };
  }

  /**
   * 接收前端错误数据
   * 用于收集和分析前端应用的错误信息
   *
   * @param data - 前端错误数据对象
   * @returns 响应结果
   */
  @Post('errors')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '接收前端错误数据' })
  @ApiResponse({ status: 200, description: '数据接收成功' })
  async receiveErrors(@Body() data: FrontendErrorData) {
    console.log('收到前端错误数据:', {
      message: data.message,
      name: data.name,
      severity: data.severity,
      url: data.url,
      sessionId: data.sessionId,
      timestamp: new Date(data.timestamp).toISOString(),
    });

    // 这里可以集成到错误监控服务
    // await this.errorMonitoringService.recordFrontendError(data);

    return { success: true, message: '前端错误数据已接收' };
  }

  /**
   * 获取监控指标
   * 返回当前的监控指标数据
   *
   * @returns 监控指标数据
   */
  @Get('metrics')
  @ApiOperation({ summary: '获取监控指标' })
  @ApiResponse({ status: 200, description: '返回监控指标数据' })
  async getMetrics() {
    // 模拟监控数据，实际项目中应该从数据库或监控系统获取
    const mockMetrics = {
      webVitals: {
        TTFB: { value: 120, rating: 'good', unit: 'ms' },
        FCP: { value: 800, rating: 'good', unit: 'ms' },
        LCP: { value: 1200, rating: 'good', unit: 'ms' },
        INP: { value: 100, rating: 'good', unit: 'ms' },
        CLS: { value: 0.05, rating: 'good', unit: '' },
      },
      microFrontend: {
        totalLoads: 156,
        averageLoadTime: 180,
        errorRate: 0.02,
        components: ['DashboardRemote', 'UserManagement', 'PermissionMatrix'],
      },
      errors: {
        totalErrors: 12,
        criticalErrors: 1,
        warningErrors: 3,
        infoErrors: 8,
        errorRate: 0.05,
      },
      system: {
        uptime: '99.9%',
        responseTime: 150,
        throughput: 1200,
        activeUsers: 45,
      },
    };

    return {
      success: true,
      data: {
        message: '监控指标数据',
        timestamp: new Date().toISOString(),
        metrics: mockMetrics,
      },
    };
  }

  /**
   * 获取 Web Vitals 历史数据
   * 返回指定时间范围内的 Web Vitals 数据
   *
   * @param startTime - 开始时间（可选）
   * @param endTime - 结束时间（可选）
   * @returns Web Vitals 历史数据
   */
  @Get('web-vitals/history')
  @ApiOperation({ summary: '获取 Web Vitals 历史数据' })
  @ApiResponse({ status: 200, description: '返回 Web Vitals 历史数据' })
  async getWebVitalsHistory(
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    // 模拟历史数据
    const mockHistoryData = [
      {
        timestamp: Date.now() - 3600000,
        TTFB: 120,
        FCP: 800,
        LCP: 1200,
        INP: 100,
        CLS: 0.05,
        page: '/dashboard',
      },
      {
        timestamp: Date.now() - 1800000,
        TTFB: 110,
        FCP: 750,
        LCP: 1150,
        INP: 95,
        CLS: 0.03,
        page: '/dashboard',
      },
      {
        timestamp: Date.now() - 900000,
        TTFB: 130,
        FCP: 850,
        LCP: 1250,
        INP: 105,
        CLS: 0.07,
        page: '/user-management',
      },
    ];

    return {
      success: true,
      data: {
        message: 'Web Vitals 历史数据',
        startTime:
          startTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endTime: endTime || new Date().toISOString(),
        history: mockHistoryData,
      },
    };
  }

  /**
   * 获取微前端性能数据
   * 返回微前端组件的性能统计
   *
   * @returns 微前端性能数据
   */
  @Get('micro-frontend/performance')
  @ApiOperation({ summary: '获取微前端性能数据' })
  @ApiResponse({ status: 200, description: '返回微前端性能数据' })
  async getMicroFrontendPerformance() {
    // 模拟微前端性能数据
    const mockPerformanceData = [
      {
        componentName: 'DashboardRemote',
        loadTime: 150,
        renderTime: 80,
        errorCount: 0,
        loadCount: 45,
        averageLoadTime: 145,
        lastLoadTime: Date.now() - 300000,
      },
      {
        componentName: 'UserManagement',
        loadTime: 200,
        renderTime: 120,
        errorCount: 1,
        loadCount: 23,
        averageLoadTime: 195,
        lastLoadTime: Date.now() - 600000,
      },
      {
        componentName: 'PermissionMatrix',
        loadTime: 180,
        renderTime: 100,
        errorCount: 0,
        loadCount: 12,
        averageLoadTime: 175,
        lastLoadTime: Date.now() - 900000,
      },
    ];

    return {
      success: true,
      data: {
        message: '微前端性能数据',
        timestamp: new Date().toISOString(),
        performance: mockPerformanceData,
      },
    };
  }

  /**
   * 获取错误统计
   * 返回系统错误统计信息
   *
   * @returns 错误统计数据
   */
  @Get('errors/statistics')
  @ApiOperation({ summary: '获取错误统计' })
  @ApiResponse({ status: 200, description: '返回错误统计数据' })
  async getErrorStatistics() {
    // 模拟错误统计数据
    const mockErrorStats = {
      totalErrors: 12,
      errorsByType: {
        TypeError: 5,
        ReferenceError: 3,
        NetworkError: 2,
        ValidationError: 2,
      },
      errorsBySeverity: {
        critical: 1,
        high: 2,
        medium: 4,
        low: 5,
      },
      errorsByComponent: {
        DashboardRemote: 3,
        UserManagement: 4,
        PermissionMatrix: 2,
        MainApp: 3,
      },
      recentErrors: [
        {
          id: 'error-001',
          type: 'TypeError',
          message: 'Cannot read property of undefined',
          component: 'DashboardRemote',
          severity: 'medium',
          timestamp: Date.now() - 300000,
          url: '/dashboard-remote',
        },
        {
          id: 'error-002',
          type: 'NetworkError',
          message: 'Failed to fetch user data',
          component: 'UserManagement',
          severity: 'high',
          timestamp: Date.now() - 600000,
          url: '/user-management',
        },
      ],
    };

    return {
      success: true,
      data: {
        message: '错误统计数据',
        timestamp: new Date().toISOString(),
        statistics: mockErrorStats,
      },
    };
  }

  /**
   * 健康检查
   * 用于检查分析服务的健康状态
   *
   * @returns 健康状态信息
   */
  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  @ApiResponse({ status: 200, description: '服务健康状态' })
  async healthCheck() {
    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'analytics',
    };
  }
}
