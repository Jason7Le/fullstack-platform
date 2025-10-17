import { DynamicModule, Module, OnModuleInit } from '@nestjs/common';
import { createTelemetrySDK } from './core/telemetry';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { ErrorTrackingInterceptor } from './interceptors/error-tracking.interceptor';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { ErrorMonitoringService } from './services/error-monitoring.service';
import { MonitoringService } from './services/monitoring.service';

export interface MonitoringModuleOptions {
  serviceName: string;
  serviceVersion: string;
  jaegerEndpoint?: string;
  prometheusPort?: number;
  environment?: string;
}

@Module({})
export class MonitoringModule implements OnModuleInit {
  private sdk: any;

  static forRoot(options: MonitoringModuleOptions): DynamicModule {
    return {
      module: MonitoringModule,
      providers: [
        {
          provide: 'MONITORING_CONFIG',
          useValue: options,
        },
        MonitoringService,
        ErrorMonitoringService,
        PerformanceInterceptor,
        ErrorTrackingInterceptor,
        GlobalExceptionFilter,
      ],
      exports: [
        MonitoringService,
        ErrorMonitoringService,
        PerformanceInterceptor,
        ErrorTrackingInterceptor,
        GlobalExceptionFilter,
      ],
      global: true,
    };
  }

  async onModuleInit() {
    try {
      // 延迟初始化 OpenTelemetry，避免模块加载时的问题
      const config = this.getConfig();
      if (config) {
        this.sdk = createTelemetrySDK(config);
        this.sdk.start();
        console.log('OpenTelemetry SDK initialized successfully');
      }
    } catch (error) {
      console.warn(
        'Failed to initialize OpenTelemetry SDK:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private getConfig() {
    // 这里需要从依赖注入中获取配置，暂时返回 null
    return null;
  }
}
