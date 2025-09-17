# 📊 全栈微前端数据平台 - 统一监控与性能分析方案

## 🎯 架构优化目标

将监控方案从单一服务中提取出来，形成统一的公共监控解决方案，支持：

- **多服务复用**：所有微服务都可以使用相同的监控配置
- **统一配置**：集中管理监控配置和指标定义
- **灵活扩展**：支持不同服务的个性化监控需求
- **简化集成**：通过简单的导入和配置即可启用监控

## 🏗️ 新架构设计

### 公共监控包架构

```
packages/
├── monitoring/                    # 公共监控包
│   ├── src/
│   │   ├── core/                 # 核心监控功能
│   │   │   ├── telemetry.ts      # OpenTelemetry 配置
│   │   │   ├── metrics.ts        # Prometheus 指标定义
│   │   │   └── tracing.ts        # 链路追踪配置
│   │   ├── services/             # 监控服务
│   │   │   ├── monitoring.service.ts
│   │   │   ├── error-monitoring.service.ts
│   │   │   └── performance.service.ts
│   │   ├── decorators/           # 监控装饰器
│   │   │   ├── monitor-method.decorator.ts
│   │   │   ├── track-performance.decorator.ts
│   │   │   └── error-tracking.decorator.ts
│   │   ├── interceptors/          # 监控拦截器
│   │   │   ├── performance.interceptor.ts
│   │   │   ├── error-tracking.interceptor.ts
│   │   │   └── metrics.interceptor.ts
│   │   ├── filters/              # 异常过滤器
│   │   │   ├── global-exception.filter.ts
│   │   │   └── database-error.filter.ts
│   │   ├── config/               # 配置管理
│   │   │   ├── monitoring.config.ts
│   │   │   └── environment.config.ts
│   │   └── index.ts              # 统一导出
│   ├── package.json
│   └── README.md
```

### 服务集成方式

```typescript
// 各服务中的使用方式
import {
  MonitoringModule,
  MonitoringService,
  PerformanceInterceptor,
  GlobalExceptionFilter,
} from '@platform/monitoring';

@Module({
  imports: [
    MonitoringModule.forRoot({
      serviceName: 'user-service',
      serviceVersion: '1.0.0',
      jaegerEndpoint: process.env.JAEGER_ENDPOINT,
      prometheusPort: parseInt(process.env.PROMETHEUS_PORT) || 9090,
    }),
  ],
})
export class AppModule {}
```

## 📦 公共监控包实现

### 1. 核心监控配置

#### OpenTelemetry 统一配置

```typescript
// packages/monitoring/src/core/telemetry.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  jaegerEndpoint?: string;
  prometheusPort?: number;
  environment?: string;
}

export function createTelemetrySDK(config: TelemetryConfig): NodeSDK {
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment || 'development',
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter: config.jaegerEndpoint
      ? new JaegerExporter({ endpoint: config.jaegerEndpoint })
      : undefined,
    metricReader: config.prometheusPort
      ? new PrometheusExporter({ port: config.prometheusPort })
      : undefined,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  return sdk;
}
```

#### Prometheus 指标定义

```typescript
// packages/monitoring/src/core/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

export class MetricsRegistry {
  // HTTP 指标
  public readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  public readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  });

  // 业务指标
  public readonly businessOperationsTotal = new Counter({
    name: 'business_operations_total',
    help: 'Total number of business operations',
    labelNames: ['operation', 'service'],
  });

  // 系统指标
  public readonly memoryUsage = new Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['service'],
  });

  constructor() {
    register.registerMetric(this.httpRequestsTotal);
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.businessOperationsTotal);
    register.registerMetric(this.memoryUsage);
  }
}

export const metricsRegistry = new MetricsRegistry();
```

### 2. 监控服务

#### 统一监控服务

```typescript
// packages/monitoring/src/services/monitoring.service.ts
import { Injectable } from '@nestjs/common';
import { metricsRegistry } from '../core/metrics';

@Injectable()
export class MonitoringService {
  // HTTP 请求监控
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    metricsRegistry.httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
    metricsRegistry.httpRequestDuration.observe(
      { method, route, status_code: statusCode.toString() },
      duration,
    );
  }

  // 业务操作监控
  recordBusinessOperation(operation: string, service: string) {
    metricsRegistry.businessOperationsTotal.inc({ operation, service });
  }

  // 系统资源监控
  recordMemoryUsage(service: string, usage: number) {
    metricsRegistry.memoryUsage.set({ service }, usage);
  }

  // 获取所有指标
  async getMetrics(): Promise<string> {
    const register = require('prom-client').register;
    return register.metrics();
  }
}
```

#### 错误监控服务

```typescript
// packages/monitoring/src/services/error-monitoring.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Counter } from 'prom-client';

@Injectable()
export class ErrorMonitoringService {
  private readonly logger = new Logger(ErrorMonitoringService.name);
  private readonly errorCounter = new Counter({
    name: 'application_errors_total',
    help: 'Total number of application errors',
    labelNames: ['error_type', 'service', 'severity'],
  });

  constructor() {
    require('prom-client').register.registerMetric(this.errorCounter);
  }

  recordError(error: Error, service: string, severity: 'low' | 'medium' | 'high' = 'medium') {
    const errorType = error.constructor.name;

    this.errorCounter.inc({
      error_type: errorType,
      service,
      severity,
    });

    this.logger.error(`Error recorded: ${errorType}`, {
      message: error.message,
      stack: error.stack,
      service,
      severity,
    });
  }

  recordDatabaseError(error: Error, operation: string, service: string) {
    this.recordError(error, service, 'high');
    this.logger.error(`Database error in ${operation}`, {
      error: error.message,
      operation,
      service,
    });
  }
}
```

### 3. 监控装饰器

#### 方法监控装饰器

```typescript
// packages/monitoring/src/decorators/monitor-method.decorator.ts
import { MonitoringService } from '../services/monitoring.service';

export function MonitorMethod(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const serviceName = target.constructor.name;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await method.apply(this, args);
        const duration = (Date.now() - startTime) / 1000;

        // 记录成功操作
        const monitoringService = this.monitoringService as MonitoringService;
        if (monitoringService) {
          monitoringService.recordBusinessOperation(operation, serviceName);
        }

        return result;
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000;

        // 记录错误
        const errorMonitoringService = this.errorMonitoringService;
        if (errorMonitoringService) {
          errorMonitoringService.recordError(error, serviceName);
        }

        throw error;
      }
    };
  };
}
```

#### 性能追踪装饰器

```typescript
// packages/monitoring/src/decorators/track-performance.decorator.ts
import { Histogram } from 'prom-client';

export function TrackPerformance(metricName: string, labels?: Record<string, string>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const histogram = new Histogram({
      name: metricName,
      help: `Performance metric for ${metricName}`,
      labelNames: Object.keys(labels || {}),
    });

    descriptor.value = async function (...args: any[]) {
      const timer = histogram.startTimer(labels);

      try {
        const result = await method.apply(this, args);
        timer({ success: 'true' });
        return result;
      } catch (error) {
        timer({ success: 'false' });
        throw error;
      }
    };
  };
}
```

### 4. 监控拦截器

#### 性能拦截器

```typescript
// packages/monitoring/src/interceptors/performance.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MonitoringService } from '../services/monitoring.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = (Date.now() - startTime) / 1000;
        const method = request.method;
        const route = request.route?.path || request.url;
        const statusCode = response.statusCode;

        this.monitoringService.recordHttpRequest(method, route, statusCode, duration);
      }),
    );
  }
}
```

### 5. NestJS 模块

#### 监控模块

```typescript
// packages/monitoring/src/monitoring.module.ts
import { Module, DynamicModule } from '@nestjs/common';
import { MonitoringService } from './services/monitoring.service';
import { ErrorMonitoringService } from './services/error-monitoring.service';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

export interface MonitoringModuleOptions {
  serviceName: string;
  serviceVersion: string;
  jaegerEndpoint?: string;
  prometheusPort?: number;
  environment?: string;
}

@Module({})
export class MonitoringModule {
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
        GlobalExceptionFilter,
      ],
      exports: [
        MonitoringService,
        ErrorMonitoringService,
        PerformanceInterceptor,
        GlobalExceptionFilter,
      ],
      global: true,
    };
  }
}
```

## 🔧 服务集成示例

### User Service 集成

```typescript
// services/user-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { MonitoringModule } from '@platform/monitoring';
import { UserModule } from './users/user.module';

@Module({
  imports: [
    MonitoringModule.forRoot({
      serviceName: 'user-service',
      serviceVersion: '1.0.0',
      jaegerEndpoint: process.env.JAEGER_ENDPOINT,
      prometheusPort: parseInt(process.env.PROMETHEUS_PORT) || 9090,
      environment: process.env.NODE_ENV || 'development',
    }),
    UserModule,
  ],
})
export class AppModule {}
```

### Data Service 集成

```typescript
// services/data-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { MonitoringModule } from '@platform/monitoring';
import { DataModule } from './data/data.module';

@Module({
  imports: [
    MonitoringModule.forRoot({
      serviceName: 'data-service',
      serviceVersion: '1.0.0',
      jaegerEndpoint: process.env.JAEGER_ENDPOINT,
      prometheusPort: parseInt(process.env.PROMETHEUS_PORT) || 9091,
      environment: process.env.NODE_ENV || 'development',
    }),
    DataModule,
  ],
})
export class AppModule {}
```

### 业务服务中使用监控

```typescript
// services/user-service/src/users/user.service.ts
import { Injectable } from '@nestjs/common';
import { MonitoringService } from '@platform/monitoring';
import { MonitorMethod } from '@platform/monitoring';

@Injectable()
export class UserService {
  constructor(private readonly monitoringService: MonitoringService) {}

  @MonitorMethod('user_registration')
  async createUser(userData: CreateUserDto) {
    // 业务逻辑
    const user = await this.userRepository.save(userData);

    // 记录业务指标
    this.monitoringService.recordBusinessOperation('user_registration', 'user-service');

    return user;
  }

  @MonitorMethod('user_login')
  async loginUser(credentials: LoginDto) {
    // 业务逻辑
    const user = await this.validateUser(credentials);

    // 记录业务指标
    this.monitoringService.recordBusinessOperation('user_login', 'user-service');

    return user;
  }
}
```

## 📊 前端监控集成

### 公共前端监控包

```typescript
// packages/monitoring/src/frontend/
├── web-vitals.ts              # Web Vitals 监控
├── micro-frontend.ts          # 微前端监控
├── error-monitoring.ts        # 前端错误监控
├── performance.ts             # 性能监控
└── analytics.ts               # 分析数据发送
```

### 前端使用方式

```typescript
// apps/main-app/src/main.ts
import { initMonitoring } from '@platform/monitoring/frontend';

// 初始化监控
initMonitoring({
  serviceName: 'main-app',
  analyticsEndpoint: process.env.VITE_ANALYTICS_ENDPOINT,
  webVitalsEnabled: process.env.VITE_WEB_VITALS_ENABLED === 'true',
});

// 微前端监控
import { trackRemoteComponent } from '@platform/monitoring/frontend';

const routes = [
  {
    path: '/dashboard-remote',
    component: () =>
      trackRemoteComponent('dashboard-app', () => import('dashboard-app/RemotePage')),
  },
];
```

## 🚀 部署和配置

### 环境变量统一配置

```bash
# 全局监控配置
JAEGER_ENDPOINT=http://localhost:14268/api/traces
PROMETHEUS_PORT=9090
NODE_ENV=development

# 服务特定配置
USER_SERVICE_PORT=3000
DATA_SERVICE_PORT=3001
FILE_SERVICE_PORT=3002
```

### Docker Compose 更新

```yaml
# infra/docker-compose.yml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3000:3000'
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - '16686:16686'
      - '14268:14268'
    environment:
      - COLLECTOR_OTLP_ENABLED=true

volumes:
  grafana-storage:
```

## 📈 优势总结

### 1. **统一性**

- 所有服务使用相同的监控配置和指标定义
- 统一的监控界面和告警规则
- 一致的数据格式和命名规范

### 2. **可维护性**

- 监控逻辑集中管理，易于更新和维护
- 减少重复代码，降低维护成本
- 统一的版本管理和发布流程

### 3. **可扩展性**

- 支持新服务快速集成监控
- 支持自定义指标和监控逻辑
- 支持不同环境的灵活配置

### 4. **开发效率**

- 通过装饰器简化监控代码
- 自动化的指标收集和错误追踪
- 丰富的监控工具和可视化界面

## 🎯 实施步骤

1. **创建公共监控包**：在 `packages/monitoring` 中实现核心功能
2. **重构现有服务**：将 `user-service` 中的监控代码迁移到公共包
3. **更新服务集成**：各服务使用新的监控模块
4. **前端监控集成**：统一前端监控方案
5. **文档更新**：更新监控文档和最佳实践

这个优化方案将监控从单一服务中提取出来，形成了真正的公共监控解决方案，支持多服务复用，提高了系统的可维护性和扩展性。
