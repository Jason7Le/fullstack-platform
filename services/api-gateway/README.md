# API Gateway

微服务 API 网关，统一前端调用入口。

## 功能特性

- 🔀 **请求代理**: 将前端请求路由到对应的微服务
- 📚 **API 文档**: 集成 Swagger 文档
- 🛡️ **CORS 支持**: 跨域请求处理
- 📊 **请求日志**: 代理请求日志记录
- ⚡ **错误处理**: 服务不可用时的优雅降级

## 服务路由

| 路径前缀               | 目标服务         | 端口 | 说明     |
| ---------------------- | ---------------- | ---- | -------- |
| `/api/users/*`         | user-service     | 3001 | 用户管理 |
| `/api/auth/*`          | user-service     | 3001 | 认证授权 |
| `/api/analytics/*`     | user-service     | 3001 | 数据分析 |
| `/api/rooms/*`         | user-service     | 3001 | 房间管理 |
| `/api/notifications/*` | user-service     | 3001 | 通知服务 |
| `/api/settings/*`      | settings-service | 3002 | 系统设置 |

## 启动服务

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run start:dev

# 生产模式
pnpm run build
pnpm run start:prod
```

## API 文档

启动后访问: http://localhost:3000/api/docs

## 端口配置

- **API Gateway**: 3000 (统一入口)
- **User Service**: 3001 (内部服务)
- **Settings Service**: 3002 (内部服务)
