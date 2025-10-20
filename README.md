# 🚀 全栈微前端数据平台

[![Gitee star](https://gitee.com/sun-lixuejian/fullstack-platform/badge/star.svg)](https://gitee.com/sun-lixuejian/fullstack-platform/stargazers)

## 📖 项目简介

基于 Vue3 + NestJS 的微前端全栈数据平台，采用 Monorepo 架构，包含用户管理、实时通信、数据可视化、监控告警等功能。项目集成了完整的开发工具链和代码质量保障体系。

### ✨ 核心特性

- **🏗️ 微前端架构**: 基于模块联邦的微前端解决方案
- **🔐 完整认证体系**: JWT + 角色权限控制 (RBAC)
- **📊 实时数据通信**: WebSocket + Socket.IO
- **📈 监控可观测性**: OpenTelemetry + Prometheus + Jaeger
- **🎨 现代化 UI**: Vue 3 + Element Plus + Tailwind CSS
- **⚡ 高性能**: Vite 7 + TypeScript 5.8
- **🔧 开发体验**: 完整的代码质量保障 (ESLint + Prettier + Husky)
- **🐳 容器化部署**: Docker + Docker Compose
- **📦 Monorepo**: pnpm 工作空间管理

## 🛠️ 技术栈

### 前端技术

- **Vue 3** + TypeScript + Vite 7
- **微前端架构** + 模块联邦 (@originjs/vite-plugin-federation)
- **UI 框架**: Element Plus + Tailwind CSS
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP 客户端**: Axios
- **实时通信**: Socket.IO Client
- **性能监控**: Web Vitals

### 后端技术

- **NestJS 11** + TypeScript
- **ORM**: TypeORM + MySQL2
- **认证**: JWT + Passport (Local + JWT Strategy)
- **API 文档**: Swagger/OpenAPI
- **实时通信**: Socket.IO + WebSocket
- **密码加密**: bcrypt
- **数据验证**: class-validator + class-transformer
- **事件系统**: NestJS Event Emitter

### 数据库与缓存

- **关系型数据库**: MySQL 8.0
- **缓存**: Redis 7
- **连接池**: TypeORM Connection Pool

### 监控与可观测性

- **分布式追踪**: OpenTelemetry + Jaeger
- **指标收集**: Prometheus + prom-client
- **性能监控**: Web Vitals + 自定义指标
- **错误追踪**: 统一异常处理 + 错误监控服务

### 开发工具与代码质量

- **包管理**: pnpm 8+ (Monorepo 工作空间)
- **代码格式化**: Prettier 3.4
- **代码检查**: ESLint 9 + TypeScript ESLint
- **Git 钩子**: Husky 9 + lint-staged
- **提交规范**: Commitlint + Conventional Commits
- **测试框架**: Jest + Supertest
- **类型检查**: TypeScript 5.8

### 微前端架构

- **模块联邦**: Vite Plugin Federation
- **子应用**: 独立构建 + 动态加载
- **共享依赖**: 公共包管理
- **路由集成**: 主应用路由 + 子应用路由

### API 网关架构

- **统一入口**: API Gateway (端口 3000)
- **服务代理**: 智能路由到对应微服务
- **请求转发**: `/api/users/*`, `/api/auth/*` → user-service
- **设置管理**: `/api/settings/*` → settings-service
- **文档集成**: Swagger API 文档
- **错误处理**: 优雅降级和错误响应

### 容器化与部署

- **容器化**: Docker + Docker Compose
- **服务编排**: Docker Compose V3.8
- **健康检查**: MySQL + Redis 健康检查
- **数据持久化**: Docker Volumes

### 安全认证

- **身份认证**: JWT Token + Refresh Token
- **密码安全**: bcrypt 哈希 + 盐值
- **权限控制**: 基于角色的访问控制 (RBAC)
- **API 安全**: Passport 策略 + 守卫

## 🏗️ 项目结构

```
fullstack-platform/
├── apps/                    # 前端应用（微前端子应用）
│   ├── main-app/           # Vue 3 + Vite 主应用（模块联邦宿主）
│   ├── dashboard-app/      # 仪表板子应用（模块联邦远程）
│   ├── monitor-app/        # 监控子应用（预留）
│   ├── report-app/         # 报表子应用（预留）
│   └── user-app/           # 用户管理子应用（预留）
├── services/                # 后端微服务
│   ├── api-gateway/        # API 网关（统一入口）
│   ├── user-service/       # 用户服务（NestJS + MySQL + Redis）
│   ├── settings-service/   # 设置服务（系统配置管理）
│   ├── data-service/       # 数据服务（预留）
│   ├── file-service/       # 文件服务（预留）
│   └── realtime-service/   # 实时通信服务（预留）
├── packages/                # 公共包（Monorepo 共享库）
│   ├── common/             # 通用工具和装饰器
│   ├── monitoring/         # 监控和可观测性包
│   ├── ui-components/      # UI 组件库（预留）
│   ├── types/              # TypeScript 类型定义
│   └── eslint-config/      # ESLint 配置包
├── infra/                   # 基础设施配置
│   ├── docker-compose.yml  # Docker 服务编排
│   ├── mysql/              # MySQL 初始化脚本
│   └── redis/              # Redis 配置
├── docs/                    # 项目文档
│   ├── monitoring-*.md     # 监控相关文档
│   ├── git-commit-conventions.md  # Git 提交规范
│   └── prettier-setup-guide.md    # Prettier 配置指南
├── scripts/                 # 构建和部署脚本
├── .husky/                  # Git 钩子配置
├── .vscode/                 # VSCode 工作区配置
├── .prettierrc              # Prettier 配置
├── .prettierignore          # Prettier 忽略文件
├── eslint.config.mjs        # ESLint 配置
├── commitlint.config.cjs    # Commitlint 配置
└── pnpm-workspace.yaml      # pnpm 工作空间配置
```

### 📦 核心包说明

- **@fullstack-platform/common**: 通用工具包，包含装饰器、守卫、拦截器、异常处理等
- **@platform/monitoring**: 统一监控包，集成 OpenTelemetry、Prometheus、Jaeger
- **apps/main-app**: 微前端主应用，负责路由管理和子应用加载
- **apps/dashboard-app**: 仪表板子应用，独立构建和部署
- **services/user-service**: 用户管理微服务，包含认证、授权、用户 CRUD

## 🚀 快速开始

### 环境要求

- **Node.js**: 20.19.0+ (推荐使用 LTS 版本)
- **pnpm**: 8.15.0+ (包管理器)
- **Docker**: 20+ (用于基础设施服务)
- **Git**: 2.30+ (版本控制)

### 一键启动（推荐）

```bash
# 1. 克隆项目
git clone https://gitee.com/sun-lixuejian/fullstack-platform.git
cd fullstack-platform

# 2. 安装依赖
pnpm install

# 3. 环境配置初始化（重要）
bash scripts/setup-env.sh

# 4. 启动基础设施（MySQL + Redis）
pnpm run docker:up

# 5. 启动所有开发服务
pnpm run dev
```

### 分步启动

如果一键启动遇到问题，可以按以下步骤逐步排查：

#### 1. 检查环境

```bash
# 检查 Node.js 版本
node --version  # 应该 >= 20.19.0

# 检查 pnpm 版本
pnpm --version  # 应该 >= 8.15.0

# 检查 Docker 状态
docker --version
docker ps
```

#### 2. 环境配置初始化

```bash
# Linux/macOS
bash scripts/setup-env.sh

# Windows PowerShell
# 手动复制环境配置文件
copy .env.example .env
copy services\user-service\.env.example services\user-service\.env
```

**重要**: 环境配置是必需的，用于数据库连接和服务端口配置。

#### 3. 启动基础设施

```bash
# 启动 MySQL 和 Redis
pnpm run docker:up

# 检查服务状态
docker ps
```

#### 4. 配置环境变量

环境配置文件已通过 `setup-env.sh` 脚本自动创建，如需修改请编辑：

- **全局配置**: `.env`
- **用户服务配置**: `services/user-service/.env`

主要配置项：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3307
DB_USERNAME=app_user
DB_PASSWORD=userpassword
DB_DATABASE=user_db
DB_SYNCHRONIZE=true

# 应用配置
APP_PORT=3001
NODE_ENV=development

# JWT 配置
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### 5. 分别启动服务

```bash
# 启动所有后端服务（推荐）
pnpm run start:backend

# 或者分别启动各个服务
pnpm run dev:gateway    # API 网关
pnpm run dev:backend    # 用户服务
pnpm run dev:settings   # 设置服务

# 启动前端主应用
pnpm run dev:frontend

# 启动仪表板应用（可选）
pnpm run dev:dashboard
```

### 服务访问地址

启动成功后，可以通过以下地址访问服务：

- **前端主应用**: http://localhost:5173
- **仪表板应用**: http://localhost:3003 (如果启动)
- **API 网关**: http://localhost:3000 (统一入口)
- **API 文档**: http://localhost:3000/api/docs (Swagger)
- **用户服务**: http://localhost:3001 (内部服务)
- **设置服务**: http://localhost:3002 (内部服务)
- **MySQL**: localhost:3307
- **Redis**: localhost:6379

### 故障排除

#### 常见问题

1. **端口冲突**: 检查端口是否被占用
2. **Docker 服务未启动**: 确保 Docker Desktop 正在运行
3. **依赖安装失败**: 清除缓存后重新安装 `pnpm install --force`
4. **数据库连接失败**: 检查 MySQL 服务是否正常启动
5. **API 网关代理失败**: 确保所有后端服务都已启动
6. **服务间通信问题**: 检查服务端口配置是否正确
7. **环境配置缺失**: 运行 `bash scripts/setup-env.sh` 创建配置文件
8. **用户服务启动失败**: 检查 `.env` 文件中的数据库配置

#### 日志查看

```bash
# 查看 Docker 服务日志
docker logs platform-mysql
docker logs platform-redis

# 查看后端服务日志
pnpm run start:backend  # 启动所有后端服务
# 或者分别查看各个服务
cd services/api-gateway && pnpm run start:dev
cd services/user-service && pnpm run start:dev
cd services/settings-service && pnpm run start:dev
```

### 本地调试远程页面组件（模块联邦）

推荐方式：远程子应用用“生产构建 + 预览”，主应用继续 dev。

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
http://localhost:3001/dashboard-app
```

说明：当前 Vite 7 + @originjs/vite-plugin-federation 组合在 dev 模式不会产出物理 `remoteEntry.js`，因此通过 `preview` 提供构建产物更稳定。需要热更新可使用构建 watch + 预览的组合（刷新即可看到更新）。

## 📊 监控与可观测性

项目集成了完整的监控和可观测性解决方案，详细配置请参考：

- [`docs/monitoring-unified-architecture.md`](./docs/monitoring-unified-architecture.md) - 统一监控架构
- [`docs/monitoring-quick-start.md`](./docs/monitoring-quick-start.md) - 快速开始指南
- [`docs/monitoring-and-apm-guide.md`](./docs/monitoring-and-apm-guide.md) - APM 配置指南

## 📚 文档目录

项目包含完整的文档体系，详细文档请参考 [`docs/README-Monitoring.md`](./docs/README-Monitoring.md)：

- [`docs/git-commit-conventions.md`](./docs/git-commit-conventions.md) - Git 提交规范
- [`docs/prettier-setup-guide.md`](./docs/prettier-setup-guide.md) - Prettier 配置指南
- [`docs/jest-testing-guide.md`](./docs/jest-testing-guide.md) - 测试指南
- [`docs/README-Monitoring.md`](./docs/README-Monitoring.md) - 监控文档导航

## 🤝 贡献指南

### 开发流程

1. **Fork 项目** 并创建功能分支
2. **遵循代码规范** (ESLint + Prettier)
3. **编写测试** 确保代码质量
4. **提交代码** 使用 Conventional Commits 规范
5. **创建 Pull Request** 进行代码审查

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 规则和 Prettier 格式化
- 提交信息遵循 Conventional Commits 规范
- 编写单元测试和集成测试

## 📄 许可证

本项目用于技术方案示例，许可证请参考各子包声明或在根目录补充具体 LICENSE。
