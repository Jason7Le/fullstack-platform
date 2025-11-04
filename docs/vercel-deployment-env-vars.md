# Vercel 部署环境变量配置指南

## 概述

本文档说明在 Vercel 部署时需要的环境变量配置。虽然我们已经在 GitHub Actions 中构建应用，但如果 Vercel 尝试构建，这些环境变量可以确保构建过程正常进行。

## 必需的环境变量

### 基础配置

| 变量名                      | 说明                    | 默认值                    | 必需 |
| --------------------------- | ----------------------- | ------------------------- | ---- |
| `VITE_APP_TITLE`            | 应用标题                | `全栈微前端数据平台`      | 否   |
| `VITE_API_BASE_URL`         | API 基础 URL            | `https://api.example.com` | 是   |
| `VITE_APP_VERSION`          | 应用版本                | `1.0.0`                   | 否   |
| `VITE_REMOTE_DASHBOARD_URL` | 远程 Dashboard 应用 URL | 空                        | 否   |

### 监控配置

| 变量名                          | 说明                     | 默认值                             | 必需 |
| ------------------------------- | ------------------------ | ---------------------------------- | ---- |
| `VITE_WEB_VITALS_ENABLED`       | 是否启用 Web Vitals 监控 | `true`                             | 否   |
| `VITE_WEB_VITALS_PAGES`         | 监控的页面列表           | `/dashboard,/dashboard-app,/login` | 否   |
| `VITE_MICRO_FRONTEND_ENABLED`   | 是否启用微前端监控       | `true`                             | 否   |
| `VITE_MICRO_FRONTEND_PAGES`     | 监控的页面列表           | `/dashboard-app`                   | 否   |
| `VITE_ERROR_MONITORING_ENABLED` | 是否启用错误监控         | `true`                             | 否   |
| `VITE_ERROR_MONITORING_PAGES`   | 监控的页面列表           | `/*`                               | 否   |

### 可选配置

| 变量名                    | 说明                     | 默认值                                  | 必需 |
| ------------------------- | ------------------------ | --------------------------------------- | ---- |
| `VITE_GA_MEASUREMENT_ID`  | Google Analytics 测量 ID | 空                                      | 否   |
| `VITE_ANALYTICS_ENDPOINT` | 分析服务端点             | `https://api.example.com/api/analytics` | 否   |
| `VITE_WEBSOCKET_URL`      | WebSocket URL            | `wss://api.example.com`                 | 否   |

## 在 Vercel 控制台配置环境变量

### 步骤

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目：`fullstack-platform-main-app`
3. 进入 **Settings** → **Environment Variables**
4. 添加以下环境变量（根据你的实际需求修改值）：

```bash
# 必需配置
VITE_API_BASE_URL=https://your-api-domain.com
VITE_REMOTE_DASHBOARD_URL=https://dashboard-app.vercel.app/assets/remoteEntry.js

# 可选配置（使用默认值或自定义）
VITE_APP_TITLE=全栈微前端数据平台
VITE_APP_VERSION=1.0.0
VITE_WEB_VITALS_ENABLED=true
VITE_WEB_VITALS_PAGES=/dashboard,/dashboard-app,/login
VITE_MICRO_FRONTEND_ENABLED=true
VITE_MICRO_FRONTEND_PAGES=/dashboard-app
VITE_ERROR_MONITORING_ENABLED=true
VITE_ERROR_MONITORING_PAGES=/*
```

5. 为每个环境变量选择应用范围：
   - **Production** - 生产环境
   - **Preview** - 预览环境
   - **Development** - 开发环境

6. 点击 **Save** 保存

## 在 GitHub Actions Secrets 中配置（推荐）

如果你使用 GitHub Actions 部署，可以在 GitHub Secrets 中配置这些变量：

1. 进入 GitHub 仓库
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 添加以下 Secrets（如果需要覆盖默认值）：

```bash
VITE_API_BASE_URL
VITE_REMOTE_DASHBOARD_URL
VITE_APP_TITLE
# ... 其他变量
```

## 注意事项

1. **环境变量前缀**：所有前端环境变量必须以 `VITE_` 开头，Vite 才会在构建时注入到代码中。

2. **敏感信息**：不要在环境变量中存储敏感信息（如 API 密钥），这些信息会被打包到前端代码中。

3. **默认值**：GitHub Actions 工作流中已经设置了默认值，如果 Vercel 尝试构建，这些默认值会确保构建不会失败。

4. **禁用 Vercel 构建**：最佳实践是在 Vercel 控制台禁用自动构建，只使用 GitHub Actions 构建，这样可以避免环境变量配置问题。

## 验证配置

部署后，检查构建日志：

1. 如果看到环境变量未定义的警告，说明需要配置相应的环境变量
2. 如果构建失败，检查环境变量是否正确设置
3. 访问部署后的应用，检查浏览器控制台是否有环境变量相关的错误

## 参考

- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel 环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
