# 📊 监控与性能分析文档

## 📚 文档索引

本目录包含全栈微前端数据平台的监控与性能分析相关文档：

### 核心文档

- **[监控与性能分析完整指南](./monitoring-and-apm-guide.md)** - 完整的 APM 监控系统配置和使用指南
- **[监控系统快速配置指南](./monitoring-quick-start.md)** - 5分钟快速启动监控系统
- **[统一监控架构方案](./monitoring-unified-architecture.md)** - 公共监控包架构和使用说明

### 快速开始

1. **快速启动**：查看 [monitoring-quick-start.md](./monitoring-quick-start.md) 5分钟快速启动监控系统
2. **统一架构**：查看 [monitoring-unified-architecture.md](./monitoring-unified-architecture.md) 了解公共监控包的使用
3. **完整指南**：查看 [monitoring-and-apm-guide.md](./monitoring-and-apm-guide.md) 了解完整的监控方案
4. **配置环境**：按照指南配置监控环境
5. **启动服务**：启动监控基础设施和应用服务
6. **查看数据**：访问 Grafana 仪表板查看监控数据

### 监控系统概览

```
┌─────────────────────────────────────────────────────────────────┐
│                    统一监控系统架构                              │
├─────────────────────────────────────────────────────────────────┤
│  公共监控包 (@platform/monitoring)                              │
│  ├─ 核心配置 (OpenTelemetry + Prometheus)                      │
│  ├─ 监控服务 (MonitoringService + ErrorMonitoringService)     │
│  ├─ 拦截器 (PerformanceInterceptor + ErrorTrackingInterceptor) │
│  ├─ 过滤器 (GlobalExceptionFilter)                             │
│  └─ 装饰器 (MonitorMethod + TrackPerformance)                  │
├─────────────────────────────────────────────────────────────────┤
│  服务集成                                                       │
│  ├─ user-service    │  ├─ data-service    │  ├─ file-service    │
│  ├─ api-gateway    │  ├─ realtime-service│  └─ 其他微服务      │
├─────────────────────────────────────────────────────────────────┤
│  数据收集与可视化                                               │
│  ├─ Jaeger (链路追踪)    │  ├─ Prometheus (指标)                │
│  ├─ Grafana (可视化)     │  └─ 自定义 API (业务数据)            │
└─────────────────────────────────────────────────────────────────┘
```

### 主要功能

- ✅ **统一监控包**：公共监控包，支持所有微服务复用
- ✅ **性能监控**：Web Vitals、API 响应时间、数据库性能
- ✅ **错误监控**：全栈错误捕获、异常分析、告警机制
- ✅ **业务监控**：用户行为、业务指标、自定义指标
- ✅ **链路追踪**：分布式请求追踪、性能瓶颈分析
- ✅ **可视化**：Grafana 仪表板、实时监控面板
- ✅ **装饰器支持**：通过装饰器简化监控代码
- ✅ **自动指标收集**：HTTP、数据库、业务指标自动收集

### 访问地址

| 服务       | 地址                                         | 说明         |
| ---------- | -------------------------------------------- | ------------ |
| Grafana    | http://localhost:3000                        | 可视化仪表板 |
| Prometheus | http://localhost:9090                        | 指标查询     |
| Jaeger     | http://localhost:16686                       | 链路追踪     |
| API 文档   | http://localhost:3000/api/docs/apiSwaggerDoc | Swagger 文档 |

### 快速启动

```bash
# 1. 构建监控包
pnpm run build:monitoring

# 2. 启动监控基础设施
docker-compose -f infra/docker-compose.yml up -d

# 3. 启动后端服务
cd services/user-service
pnpm run start:dev

# 4. 启动前端应用
cd apps/main-app
pnpm run dev
```

**更详细的步骤请查看 [快速配置指南](./monitoring-quick-start.md)**

### 环境变量配置

```bash
# 后端环境变量
JAEGER_ENDPOINT=http://localhost:14268/api/traces
PROMETHEUS_PORT=9090
OTEL_SERVICE_NAME=user-service
OTEL_SERVICE_VERSION=1.0.0

# 前端环境变量
VITE_WEB_VITALS_ENABLED=true
VITE_ANALYTICS_ENDPOINT=http://localhost:3000/api/analytics
```

### 依赖包

#### 公共监控包

```bash
# 监控包已内置所有依赖，无需额外安装
# 各服务只需添加对监控包的引用
```

#### 服务集成

```bash
# 在服务的 package.json 中添加
"@platform/monitoring": "workspace:*"
```

#### 前端依赖

```bash
pnpm add web-vitals
```

### 故障排除

如果遇到问题，请查看：

1. **[统一架构方案](./monitoring-unified-architecture.md)** - 公共监控包的使用和配置
2. **[快速配置指南](./monitoring-quick-start.md)** - 常见问题和解决方案
3. **[完整指南](./monitoring-and-apm-guide.md)** - 详细的故障排除部分

或检查：

- **监控包构建**：确认 `pnpm run build:monitoring` 成功
- **服务状态**：确认所有服务正常运行
- **网络连接**：检查服务间网络连接
- **配置正确性**：验证配置文件和环境变量
- **日志信息**：查看应用和容器日志

### 贡献指南

如需改进监控系统或添加新功能：

1. 阅读统一架构方案了解公共监控包结构
2. 在 `packages/monitoring` 中添加新功能
3. 更新相关文档
4. 测试新功能
5. 提交 Pull Request

---

**注意**：本监控系统为生产环境设计，请根据实际需求调整配置参数。
