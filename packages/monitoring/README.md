# 📊 @platform/monitoring

统一监控与性能分析包，为全栈微前端数据平台提供完整的可观测性解决方案。

## 🚀 特性

- **统一配置**：OpenTelemetry + Prometheus + Jaeger 统一配置
- **多服务支持**：支持所有微服务使用相同的监控方案
- **装饰器支持**：通过装饰器简化监控代码
- **自动指标收集**：HTTP、数据库、业务指标自动收集
- **错误监控**：全栈错误捕获和分析
- **微前端监控**：微前端性能监控
- **前端监控**：Web Vitals + 用户体验监控

## 📦 安装

```bash
pnpm add @platform/monitoring
```

## 🔧 后端使用

### 1. 模块导入

```typescript
import { MonitoringModule } from '@platform/monitoring';

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

### 2. 服务中使用

```typescript
import { Injectable } from '@nestjs/common';
import { MonitoringService, MonitorMethod } from '@platform/monitoring';

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
}
```

### 3. 全局拦截器

```typescript
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { PerformanceInterceptor, GlobalExceptionFilter } from '@platform/monitoring';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
```

## 🎨 前端使用

### 1. 初始化监控

```typescript
import { initMonitoring } from '@platform/monitoring/frontend';

// 初始化监控
initMonitoring({
  serviceName: 'main-app',
  analyticsEndpoint: process.env.VITE_ANALYTICS_ENDPOINT,
  webVitalsEnabled: process.env.VITE_WEB_VITALS_ENABLED === 'true',
});
```

### 2. 微前端监控

```typescript
import { trackRemoteComponent } from '@platform/monitoring/frontend';

const routes = [
  {
    path: '/dashboard-remote',
    component: () =>
      trackRemoteComponent('dashboard-app', () => import('dashboard-app/RemotePage')),
  },
];
```

## 📊 监控指标

### HTTP 指标

- `http_requests_total` - HTTP 请求总数
- `http_request_duration_seconds` - HTTP 请求响应时间

### 业务指标

- `business_operations_total` - 业务操作总数
- `user_registrations_total` - 用户注册数
- `user_logins_total` - 用户登录数

### 系统指标

- `memory_usage_bytes` - 内存使用量
- `cpu_usage_percent` - CPU 使用率

### 错误指标

- `application_errors_total` - 应用错误总数
- `database_errors_total` - 数据库错误总数

## 🔍 访问监控界面

| 服务       | 地址                   | 说明         |
| ---------- | ---------------------- | ------------ |
| Grafana    | http://localhost:3000  | 可视化仪表板 |
| Prometheus | http://localhost:9090  | 指标查询     |
| Jaeger     | http://localhost:16686 | 链路追踪     |

## 📚 文档

- [统一监控架构](./docs/monitoring-unified-architecture.md)
- [监控与性能分析指南](./docs/monitoring-and-apm-guide.md)
- [快速配置指南](./docs/monitoring-quick-start.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个监控包。

## 📄 许可证

MIT License
