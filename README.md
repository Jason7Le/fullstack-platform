## 全栈微前端数据平台

一个采用 Monorepo 管理的全栈微前端数据平台示例工程，包含前端应用与后端服务，以及基础设施编排示例。

### 技术栈
- 前端：Vue 3、Vite、TypeScript（示例应用：`apps/main-app`）
- 后端：NestJS、TypeORM、MySQL（示例服务：`services/user-service`）
- Monorepo：npm workspaces
- 基础设施：Docker（`infra/`）

### 目录结构
```
fullstack-platform/
  apps/                 # 前端应用（微前端子应用）
    main-app/          # Vue + Vite 主应用示例
    dashboard-app/     # 预留
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
  infra/               # 基础设施（数据库、缓存、中间件等）
  docs/                # 文档
```

### 环境要求
- Node.js ≥ 18
- npm ≥ 8（已使用 npm workspaces）
- 可选：Docker Desktop（运行 `infra/` 依赖）

### 安装依赖
在仓库根目录执行：

```bash
npm install
```

### 本地开发
- 运行前端主应用（`apps/main-app`）：

```bash
npm run -w main-app dev
```

- 运行后端用户服务（`services/user-service`）：

```bash
npm run -w user-service start:dev
```

如需分别在各子包目录下运行，也可进入对应目录执行 `npm run dev` / `npm run start:dev`。

### 构建与预览
- 构建前端主应用：

```bash
npm run -w main-app build
```

- 预览前端构建产物：

```bash
npm run -w main-app preview
```

- 构建后端用户服务（产物位于 `services/user-service/dist`）：

```bash
npm run -w user-service build
```

### 基础设施（可选）
仓库提供 `infra/` 目录用于编排 MySQL、Redis、MongoDB 等依赖。若本地安装了 Docker，可在仓库根目录执行：

```bash
# Docker Compose V2（推荐）
docker compose -f infra/docker-compose.yml up -d

# 或 Docker Compose V1
docker-compose -f infra/docker-compose.yml up -d
```

启动完成后，请根据实际服务配置（如数据库连接、账号密码）在各服务的环境变量中进行设置（例如在 `services/user-service` 下创建 `.env`）。

### 提交规范与代码质量
- 统一使用 TypeScript
- 建议在各子包内使用对应的 `lint` / `test` 脚本（如 `services/user-service` 已内置 `eslint`、`jest` 脚本）

### 许可证
本项目用于技术方案示例，许可证请参考各子包声明或在根目录补充具体 LICENSE。


