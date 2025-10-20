# 📊 监控与性能分析完整指南

## 📋 目录

- [概述](#概述)
- [架构设计](#架构设计)
- [后端监控配置](#后端监控配置)
- [前端监控配置](#前端监控配置)
- [微前端监控](#微前端监控)
- [错误监控](#错误监控)
- [基础设施配置](#基础设施配置)
- [部署指南](#部署指南)
- [使用说明](#使用说明)
- [故障排除](#故障排除)

## 概述

本指南详细介绍了全栈微前端数据平台的监控与性能分析（APM）系统。该系统提供了完整的可观测性解决方案，包括：

- **性能监控**：Web Vitals、API 响应时间、数据库查询性能
- **错误监控**：全栈错误捕获、异常分析、告警机制
- **业务监控**：用户行为、业务指标、自定义指标
- **链路追踪**：分布式请求追踪、性能瓶颈分析
- **可视化**：Grafana 仪表板、实时监控面板

## 架构设计

### 监控数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                        监控数据流                                │
├─────────────────────────────────────────────────────────────────┤
│  前端应用 (Vue3)          │  后端服务 (NestJS)                   │
│  ├─ Web Vitals           │  ├─ OpenTelemetry                   │
│  ├─ 微前端监控            │  ├─ Prometheus 指标                  │
│  ├─ 错误监控              │  ├─ 错误监控                        │
│  └─ 用户体验指标          │  └─ 业务指标                        │
├─────────────────────────────────────────────────────────────────┤
│  数据收集层                                                      │
│  ├─ Jaeger (链路追踪)     │  ├─ Prometheus (指标)                │
│  ├─ Grafana (可视化)      │  └─ 自定义 API (业务数据)            │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈

- **后端监控**：OpenTelemetry + Prometheus + Jaeger
- **前端监控**：Web Vitals + 自定义指标收集
- **可视化**：Grafana + Prometheus
- **告警**：Prometheus AlertManager
- **存储**：Prometheus TSDB + Jaeger Storage

## 后端监控配置

### OpenTelemetry 配置

OpenTelemetry 提供了分布式追踪和指标收集功能。

#### 配置文件位置

```
services/user-service/src/config/telemetry.config.ts
```

#### 主要功能

- 自动检测 HTTP 请求、数据库查询、Redis 操作
- 分布式链路追踪
- 性能指标收集
- 错误追踪

#### 环境变量配置

```bash
# OpenTelemetry 配置
JAEGER_ENDPOINT=http://localhost:14268/api/traces
PROMETHEUS_PORT=9090
OTEL_SERVICE_NAME=user-service
OTEL_SERVICE_VERSION=1.0.0
```

### Prometheus 指标

#### 核心指标类型

1. **HTTP 指标**
   - `http_request_duration_seconds`：请求响应时间
   - `http_requests_total`：请求总数
   - `http_request_errors_total`：错误总数

2. **数据库指标**
   - `database_query_duration_seconds`：查询时间
   - `database_connections_active`：活跃连接数

3. **业务指标**
   - `user_registrations_total`：用户注册数
   - `user_logins_total`：用户登录数
   - `active_users_current`：当前活跃用户

4. **系统指标**
   - `memory_usage_bytes`：内存使用量
   - `cpu_usage_percent`：CPU 使用率

#### 指标访问

```bash
# 查看所有指标
curl http://localhost:3000/metrics

# 查看特定指标
curl http://localhost:3000/metrics | grep http_request_duration
```

## 前端监控配置

### Web Vitals 监控

Web Vitals 是 Google 定义的核心用户体验指标。

#### 监控指标

1. **Core Web Vitals**
   - **LCP (Largest Contentful Paint)**：最大内容绘制
   - **FID (First Input Delay)**：首次输入延迟
   - **CLS (Cumulative Layout Shift)**：累积布局偏移

2. **其他重要指标**
   - **FCP (First Contentful Paint)**：首次内容绘制
   - **TTFB (Time to First Byte)**：首字节时间

#### 阈值配置

```typescript
const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FID: { good: 100, needsImprovement: 300 },
  LCP: { good: 2500, needsImprovement: 4000 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
};
```

#### 配置文件位置

```
apps/main-app/src/utils/webVitalsAdvanced.ts
```

### 微前端监控

#### 监控内容

- 远程模块加载时间
- 远程模块渲染时间
- 远程模块错误统计
- 性能报告生成

#### 配置文件位置

```
apps/main-app/src/utils/microFrontendMonitor.ts
```

#### 使用方法

```typescript
// 在路由中使用
import { trackRemoteComponent } from '@/utils/microFrontendMonitor';

const routes = [
  {
    path: '/dashboard-app',
    component: () =>
      trackRemoteComponent('dashboard-app', () => import('dashboard-app/RemotePage')),
  },
];
```

## 错误监控

### 后端错误监控

#### 全局异常过滤器

- 自动捕获所有未处理的异常
- 记录错误详情到监控系统
- 根据错误类型设置严重程度
- 生成错误报告

#### 数据库错误监控

- 监控数据库连接问题
- 记录查询失败
- 追踪性能问题

#### 配置文件位置

```
services/user-service/src/common/filters/enhanced-exception.filter.ts
services/user-service/src/common/interceptors/database-error.interceptor.ts
```

### 前端错误监控

#### 全局错误处理

- JavaScript 运行时错误
- Promise 拒绝错误
- Vue 组件错误
- 网络请求错误

#### 错误边界组件

- 组件级错误捕获
- 用户友好的错误页面
- 错误报告功能

#### 配置文件位置

```
apps/main-app/src/utils/errorMonitoring.ts
apps/main-app/src/components/ErrorBoundary.vue
```

## 基础设施配置

### Docker Compose 配置

#### 监控服务

```yaml
# infra/docker-compose.yml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3000:3000'
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - '16686:16686'
      - '14268:14268'
```

#### 启动命令

```bash
# 启动所有监控服务
docker-compose -f infra/docker-compose.yml up -d

# 查看服务状态
docker-compose -f infra/docker-compose.yml ps
```

### Prometheus 配置

#### 配置文件位置

```
infra/prometheus/prometheus.yml
```

#### 主要配置

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'user-service'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s
```

### Grafana 仪表板

#### 预配置仪表板

- HTTP 请求监控
- 数据库性能监控
- 系统资源监控
- Web Vitals 监控
- 错误率监控

#### 配置文件位置

```
infra/grafana/dashboards/
infra/grafana/provisioning/
```

## 部署指南

### 环境要求

- Node.js 18+
- Docker 20+
- pnpm 8+

### 依赖安装

#### 后端依赖

```bash
cd services/user-service
pnpm add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-jaeger @opentelemetry/exporter-prometheus prom-client
```

#### 前端依赖

```bash
cd apps/main-app
pnpm add web-vitals
```

### 环境变量配置

#### 后端环境变量

```bash
# .env
JAEGER_ENDPOINT=http://localhost:14268/api/traces
PROMETHEUS_PORT=9090
OTEL_SERVICE_NAME=user-service
OTEL_SERVICE_VERSION=1.0.0
```

#### 前端环境变量

```bash
# apps/main-app/.env.development
VITE_WEB_VITALS_ENABLED=true
VITE_ANALYTICS_ENDPOINT=http://localhost:3000/api/analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 启动顺序

1. **启动基础设施**

   ```bash
   docker-compose -f infra/docker-compose.yml up -d
   ```

2. **启动后端服务**

   ```bash
   cd services/user-service
   pnpm run start:dev
   ```

3. **启动前端应用**
   ```bash
   cd apps/main-app
   pnpm run dev
   ```

## 使用说明

### 访问监控界面

| 服务       | 地址                                         | 用户名/密码 | 说明         |
| ---------- | -------------------------------------------- | ----------- | ------------ |
| Grafana    | http://localhost:3000                        | admin/admin | 可视化仪表板 |
| Prometheus | http://localhost:9090                        | -           | 指标查询     |
| Jaeger     | http://localhost:16686                       | -           | 链路追踪     |
| API 文档   | http://localhost:3000/api/docs/apiSwaggerDoc | -           | Swagger 文档 |

### 查看指标

#### Prometheus 查询示例

```promql
# HTTP 请求响应时间
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 错误率
rate(http_request_errors_total[5m])

# 活跃用户数
active_users_current

# 内存使用量
memory_usage_bytes
```

#### Grafana 仪表板

1. 登录 Grafana
2. 导入预配置仪表板
3. 查看实时监控数据
4. 设置告警规则

### API 端点

#### 监控相关 API

```bash
# 健康检查
GET /api/analytics/health

# 获取指标
GET /api/analytics/metrics

# 接收 Web Vitals 数据
POST /api/analytics/web-vitals

# 接收错误数据
POST /api/analytics/errors

# 接收微前端数据
POST /api/analytics/micro-frontend
```

## 故障排除

### 常见问题

#### 1. OpenTelemetry 初始化失败

**问题**：OpenTelemetry SDK 启动失败
**解决方案**：

- 检查环境变量配置
- 确认 Jaeger 服务运行正常
- 查看控制台错误日志

#### 2. Prometheus 无法抓取指标

**问题**：Prometheus 无法访问应用指标
**解决方案**：

- 检查网络连接
- 确认指标端点可访问
- 验证 Prometheus 配置

#### 3. Grafana 仪表板无数据

**问题**：Grafana 显示无数据
**解决方案**：

- 检查数据源配置
- 确认 Prometheus 有数据
- 验证查询语句

#### 4. 前端监控数据未发送

**问题**：前端监控数据未到达后端
**解决方案**：

- 检查网络请求
- 确认 API 端点正确
- 查看浏览器控制台错误

### 日志查看

#### 后端日志

```bash
# 查看应用日志
cd services/user-service
pnpm run start:dev

# 查看 Docker 日志
docker-compose -f infra/docker-compose.yml logs prometheus
docker-compose -f infra/docker-compose.yml logs grafana
docker-compose -f infra/docker-compose.yml logs jaeger
```

#### 前端日志

- 打开浏览器开发者工具
- 查看 Console 面板
- 检查 Network 面板的请求状态

### 性能优化建议

#### 后端优化

1. **数据库查询优化**
   - 添加索引
   - 优化查询语句
   - 使用连接池

2. **缓存策略**
   - Redis 缓存
   - 应用级缓存
   - CDN 缓存

3. **监控优化**
   - 减少指标收集频率
   - 使用采样策略
   - 优化存储配置

#### 前端优化

1. **资源优化**
   - 代码分割
   - 懒加载
   - 图片优化

2. **性能监控**
   - 定期检查 Web Vitals
   - 监控微前端加载时间
   - 分析用户行为

### 告警配置

#### Prometheus 告警规则

```yaml
# infra/prometheus/rules/alerts.yml
groups:
  - name: application_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_request_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'High error rate detected'
          description: 'Error rate is {{ $value }} errors per second'
```

#### 告警通知

- 邮件通知
- Slack 通知
- 钉钉通知
- 短信通知

## 最佳实践

### 监控策略

1. **分层监控**：基础设施 → 应用 → 业务
2. **关键指标**：选择最重要的指标进行监控
3. **告警阈值**：设置合理的告警阈值
4. **定期审查**：定期审查监控配置和告警规则

### 性能优化

1. **持续监控**：建立持续监控机制
2. **性能基线**：建立性能基线
3. **定期优化**：定期进行性能优化
4. **用户反馈**：结合用户反馈进行优化

### 错误处理

1. **快速响应**：建立快速响应机制
2. **根因分析**：进行根因分析
3. **预防措施**：制定预防措施
4. **知识积累**：积累错误处理经验

## 总结

本监控系统提供了完整的可观测性解决方案，帮助开发团队：

- **实时监控**：实时了解应用状态
- **性能分析**：分析性能瓶颈
- **错误追踪**：快速定位和解决问题
- **业务洞察**：了解业务运行情况
- **运维支持**：提供运维决策支持

通过持续监控和优化，可以显著提升应用性能和用户体验。
