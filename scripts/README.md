# 服务启动指南

## 🚀 快速启动

### 启动所有服务（推荐）

```bash
# 启动所有服务（前端 + 后端）
pnpm run dev

# 或者使用别名
pnpm run dev:all
```

### 只启动后端服务

```bash
# 启动所有后端服务
pnpm run start:backend
```

### 单独启动服务

```bash
# 前端应用
pnpm run dev:frontend

# 仪表板应用
pnpm run dev:dashboard

# API 网关
pnpm run dev:gateway

# 用户服务
pnpm run dev:backend

# 设置服务
pnpm run dev:settings
```

## 🛑 停止服务

使用 `Ctrl+C` 停止所有服务，`concurrently` 会自动停止所有子进程。

## 📋 服务端口

| 服务       | 端口 | 说明         |
| ---------- | ---- | ------------ |
| 前端应用   | 5173 | Vue3 主应用  |
| 仪表板应用 | 3003 | Vue3 仪表板  |
| API 网关   | 3000 | 统一服务入口 |
| 用户服务   | 3001 | 用户管理服务 |
| 设置服务   | 3002 | 系统设置服务 |

## 🔧 高级选项

### 自定义启动

```bash
# 只启动特定服务
pnpm run dev:frontend
pnpm run dev:backend
```

### 重启服务

```bash
# 重启后端服务
pnpm run restart:backend
```

## ⚠️ 注意事项

1. **端口冲突**：确保端口 3000-3003、5173 未被占用
2. **数据库依赖**：启动前请确保 MySQL 和 Redis 服务已运行
3. **环境配置**：首次运行请执行 `pnpm run setup:env` 配置环境变量
4. **依赖安装**：首次运行请执行 `pnpm install` 安装依赖

## 🐛 故障排除

### 端口被占用

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000
kill -9 <PID>
```

### 服务启动失败

1. 检查数据库连接配置
2. 确认环境变量设置正确
3. 查看服务日志输出
4. 重启数据库服务

## 🔗 相关命令

```bash
# 安装依赖
pnpm install

# 配置环境
pnpm run setup:env

# 构建项目
pnpm run build

# 运行测试
pnpm run test
```
