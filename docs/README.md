# 🚀 全栈微前端数据平台 - 技术架构方案

## 📖 项目简介

基于 Vue3 + NestJS 的微前端全栈项目，包含用户管理、数据可视化、监控分析等功能。

## 🛠️ 技术栈

### 前端技术

- **Vue 3** + TypeScript + Vite
- **微前端架构** + 模块联邦
- Element Plus + Tailwind CSS
- **监控系统**：Web Vitals + 微前端性能监控

### 后端技术

- **NestJS** + TypeORM
- MySQL + Redis + JWT
- Docker + Docker Compose
- **APM 监控**：OpenTelemetry + Prometheus + Jaeger

## 🏗️ 项目结构

```
fullstack-platform/
  apps/                 # 前端应用（微前端子应用）
    main-app/          # Vue + Vite 主应用
    dashboard-app/     # 微前端远程应用
    monitor-app/       # 预留
    report-app/        # 预留
    user-app/          # 预留
  services/            # 后端服务
    user-service/      # NestJS 用户服务
    api-gateway/       # 预留
    data-service/      # 预留
    file-service/      # 预留
    realtime-service/  # 预留
  packages/            # 公共包（如 UI 组件、配置等）
  infra/               # 基础设施（数据库、缓存、监控等）
  docs/                # 文档
    monitoring-and-apm-guide.md  # 监控与性能分析指南
    README-Monitoring.md         # 监控文档索引
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- Docker 20+

### 一键启动（推荐）

```bash
# 克隆项目
git clone https://gitee.com/sun-lixuejian/fullstack-platform.git

# 安装依赖
pnpm install

# 启动基础设施
pnpm run docker:up

# 环境配置初始化
bash scripts/setup-env.sh

# 启动开发服务
pnpm run dev
```

### 分步启动

如果一键启动遇到问题，可以按以下步骤逐步排查：

1. **检查 Docker 状态**：`docker ps`
2. **检查环境变量**：确认 `.env` 文件存在且配置正确
3. **单独启动服务**：`pnpm run dev:backend` 或 `pnpm run dev:frontend`

## 📊 监控系统

### 监控架构

本平台集成了完整的 APM（Application Performance Monitoring）监控系统：

- **后端监控**：OpenTelemetry 链路追踪 + Prometheus 指标收集
- **前端监控**：Web Vitals + 微前端性能监控
- **错误监控**：全栈错误捕获与分析
- **可视化**：Grafana 仪表板 + 实时监控

### 监控服务访问

| 服务       | 地址                                         | 用户名/密码 | 说明         |
| ---------- | -------------------------------------------- | ----------- | ------------ |
| Grafana    | http://localhost:3000                        | admin/admin | 可视化仪表板 |
| Prometheus | http://localhost:9090                        | -           | 指标查询     |
| Jaeger     | http://localhost:16686                       | -           | 链路追踪     |
| API 文档   | http://localhost:3000/api/docs/apiSwaggerDoc | -           | Swagger 文档 |

### 监控文档

- **[监控与性能分析完整指南](./docs/monitoring-and-apm-guide.md)** - 详细的监控配置和使用指南
- **[监控文档索引](./docs/README-Monitoring.md)** - 监控相关文档快速导航

## 🔧 本地调试远程页面组件（模块联邦）

推荐方式：远程子应用用"生产构建 + 预览"，主应用继续 dev。

1. 在 `apps/dashboard-app`：

```bash
pnpm build
pnpm preview --port 3003 --strictPort
```

2. 在 `apps/main-app/.env.development` 设置远程入口：

```env
VITE_REMOTE_DASHBOARD_URL=http://localhost:3003/assets/remoteEntry.js
VITE_APP_PORT=3001
```

3. 在 `apps/main-app` 启动主应用：

```bash
pnpm dev
```

4. 访问远程页面路由：

```
http://localhost:3001/dashboard-remote
```

说明：当前 Vite 7 + @originjs/vite-plugin-federation 组合在 dev 模式不会产出物理 `remoteEntry.js`，因此通过 `preview` 提供构建产物更稳定。需要热更新可使用构建 watch + 预览的组合（刷新即可看到更新）。

## 🎯 服务访问地址

- 后端 API：http://localhost:3000
- API 文档：http://localhost:3000/api/docs/apiSwaggerDoc
- 前端应用：http://localhost:3001
- 微前端远程页面：http://localhost:3001/dashboard-remote
- 监控面板：http://localhost:3000 (Grafana)

## 📚 文档目录

- **[监控与性能分析指南](./docs/monitoring-and-apm-guide.md)** - 完整的 APM 监控系统配置和使用指南
- **[监控文档索引](./docs/README-Monitoring.md)** - 监控相关文档快速导航
- **[Git 提交规范](./docs/git-commit-conventions.md)** - 项目提交规范说明
- **[Jest 测试指南](./docs/jest-testing-guide.md)** - 单元测试配置和使用指南
- **[权限矩阵说明](./docs/README-PermissionMatrix.md)** - 用户权限管理说明
- **[密码验证故障排除](./docs/password-verification-troubleshooting.md)** - 密码相关问题解决方案

## 🔍 功能特性

### 已实现功能

- ✅ **用户管理**：注册、登录、权限管理
- ✅ **微前端架构**：模块联邦、远程组件加载
- ✅ **监控系统**：APM 监控、错误追踪、性能分析
- ✅ **WebSocket**：实时通信、聊天室功能
- ✅ **API 文档**：Swagger 自动生成文档

### 计划功能

- 🔄 **数据可视化**：图表展示、数据分析
- 🔄 **文件管理**：文件上传、下载、管理
- 🔄 **报表系统**：数据报表生成和导出
- 🔄 **系统监控**：服务器监控、告警机制

## 🛡️ 安全特性

- JWT 身份验证
- 密码加密存储
- CORS 跨域配置
- 输入验证和过滤
- SQL 注入防护

## 📈 性能优化

- 微前端代码分割
- 懒加载和预加载
- 数据库查询优化
- Redis 缓存策略
- CDN 资源优化

## 🔧 开发工具

- **代码质量**：ESLint + Prettier
- **类型检查**：TypeScript
- **测试框架**：Jest
- **构建工具**：Vite + NestJS CLI
- **容器化**：Docker + Docker Compose

## 📝 提交规范

本项目采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范，详细说明请参考 [`docs/git-commit-conventions.md`](./docs/git-commit-conventions.md)

## 🐛 故障排除

### 常见问题

1. **端口冲突**：检查端口占用情况
2. **依赖安装失败**：清除缓存后重新安装
3. **数据库连接失败**：检查 Docker 服务状态
4. **微前端加载失败**：确认远程应用已启动

### 获取帮助

- 查看项目文档
- 检查 Issues 列表
- 提交新的 Issue

## 📄 许可证

本项目用于技术方案示例，许可证请参考各子包声明或在根目录补充具体 LICENSE。

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 技术交流群

---

**注意**：本项目为技术架构方案示例，请根据实际需求进行调整和优化。
