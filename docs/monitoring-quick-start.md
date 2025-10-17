# 📊 监控系统快速配置指南

## 🚀 5分钟快速启动监控系统

### 1. 启动监控基础设施

```bash
# 启动所有监控服务
docker-compose -f infra/docker-compose.yml up -d

# 检查服务状态
docker-compose -f infra/docker-compose.yml ps
```

### 2. 配置环境变量

#### 后端环境变量

```bash
# services/user-service/.env
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
```

### 3. 安装监控依赖

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

### 4. 启动应用服务

```bash
# 启动后端服务
cd services/user-service
pnpm run start:dev

# 启动前端应用
cd apps/main-app
pnpm run dev
```

### 5. 访问监控界面

| 服务       | 地址                   | 用户名/密码 | 说明         |
| ---------- | ---------------------- | ----------- | ------------ |
| Grafana    | http://localhost:3000  | admin/admin | 可视化仪表板 |
| Prometheus | http://localhost:9090  | -           | 指标查询     |
| Jaeger     | http://localhost:16686 | -           | 链路追踪     |

## 📋 监控指标说明

### 后端指标

- `http_request_duration_seconds` - HTTP 请求响应时间
- `http_requests_total` - HTTP 请求总数
- `http_request_errors_total` - HTTP 错误总数
- `database_query_duration_seconds` - 数据库查询时间
- `application_errors_total` - 应用错误总数

### 前端指标

- `web_vitals_cls` - 累积布局偏移
- `web_vitals_lcp` - 最大内容绘制
- `web_vitals_fid` - 首次输入延迟
- `micro_frontend_load_time` - 微前端加载时间

## 🔧 常用 Prometheus 查询

```promql
# HTTP 请求响应时间 (95th percentile)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 错误率
rate(http_request_errors_total[5m])

# 活跃用户数
active_users_current

# 内存使用量
memory_usage_bytes
```

## 🚨 告警配置示例

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

## 🛠️ 故障排除

### 常见问题

1. **OpenTelemetry 初始化失败**
   - 检查环境变量配置
   - 确认 Jaeger 服务运行正常

2. **Prometheus 无法抓取指标**
   - 检查网络连接
   - 确认指标端点可访问

3. **Grafana 仪表板无数据**
   - 检查数据源配置
   - 确认 Prometheus 有数据

### 日志查看

```bash
# 查看 Docker 服务日志
docker-compose -f infra/docker-compose.yml logs prometheus
docker-compose -f infra/docker-compose.yml logs grafana
docker-compose -f infra/docker-compose.yml logs jaeger

# 查看应用日志
cd services/user-service
pnpm run start:dev
```

## 📚 详细文档

- **[完整监控指南](./monitoring-and-apm-guide.md)** - 详细的配置和使用说明
- **[监控文档索引](./README-Monitoring.md)** - 监控相关文档导航

## 🎯 下一步

1. 查看 Grafana 仪表板了解系统状态
2. 配置告警规则
3. 设置自定义指标
4. 优化监控配置
5. 建立监控最佳实践
