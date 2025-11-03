# 本地后端部署指南

本文档介绍如何在本地电脑上部署后端服务，包括仅本地访问和外网访问两种场景。

## 📋 目录

- [方案 1: 本地直接运行（仅本地访问）](#方案-1-本地直接运行仅本地访问)
- [方案 2: 本地运行 + 内网穿透（外网访问）](#方案-2-本地运行--内网穿透外网访问)
- [方案 3: Docker 容器化部署](#方案-3-docker-容器化部署)
- [常见问题](#常见问题)

---

## 方案 1: 本地直接运行（仅本地访问）

### 适用场景

- ✅ 本地开发和测试
- ✅ 与本地前端应用联调
- ✅ 不需要外网访问

### 前置要求

- Node.js 20.19.0+
- pnpm 8.15.0+
- Docker Desktop（用于 MySQL 和 Redis）

### 部署步骤

#### 1. 启动基础设施（MySQL + Redis）

```bash
# 进入项目目录
cd fullstack-platform

# 启动 Docker 容器
pnpm run docker:up

# 验证服务状态
docker ps
```

应该看到 `platform-mysql` 和 `platform-redis` 容器在运行。

#### 2. 配置环境变量

如果还没有配置环境变量，先运行：

```bash
# Linux/macOS
bash scripts/setup-env.sh

# Windows PowerShell
# 手动复制环境配置文件
copy .env.example .env
copy services\user-service\.env.example services\user-service\.env
```

主要环境变量配置（`services/user-service/.env`）：

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

#### 3. 启动后端服务

```bash
# 启动所有后端服务
pnpm run start:backend

# 或者分别启动各个服务
pnpm run dev:gateway    # API 网关 (端口 3000)
pnpm run dev:user-service  # 用户服务 (端口 3001)
pnpm run dev:settings   # 设置服务 (端口 3002)
```

#### 4. 验证服务

访问以下地址验证服务是否正常：

- **API 网关**: http://localhost:3000
- **API 文档 (Swagger)**: http://localhost:3000/api/docs
- **用户服务**: http://localhost:3001
- **设置服务**: http://localhost:3002

### 停止服务

```bash
# 停止后端服务：按 Ctrl+C

# 停止 Docker 服务
pnpm run docker:down
# 或
docker-compose -f infra/docker-compose.yml down
```

---

## 方案 2: 本地运行 + 内网穿透（外网访问）

### 适用场景

- ✅ 需要外网访问（如手机、其他设备访问）
- ✅ 与部署在 Vercel 的前端应用联调
- ✅ 演示和测试需要外网环境

### 内网穿透工具推荐

#### 选项 A: ngrok（最简单，推荐新手）

**安装**:

```bash
# 访问 https://ngrok.com/ 注册账号并下载
# Windows: 下载 ngrok.exe 并添加到 PATH
# macOS: brew install ngrok
```

**使用**:

```bash
# 暴露 API 网关（端口 3000）
ngrok http 3000

# 或暴露用户服务（端口 3001）
ngrok http 3001
```

ngrok 会生成一个公网 URL，例如：`https://abc123.ngrok.io`

**配置前端**:
将 Vercel 部署的前端应用的 API 地址改为 ngrok 生成的 URL。

#### 选项 B: frp（免费，需要服务器）

适合有云服务器的用户，可以自己搭建内网穿透服务。

**服务端配置**（在云服务器上）:

```ini
# frps.ini
[common]
bind_port = 7000
vhost_http_port = 8080
```

**客户端配置**（在本地电脑）:

```ini
# frpc.ini
[common]
server_addr = 你的服务器IP
server_port = 7000

[api-gateway]
type = http
local_port = 3000
custom_domains = api.yourdomain.com
```

#### 选项 C: 花生壳（国内，有免费版）

适合国内用户，中文界面，使用简单。

1. 访问 https://hsk.oray.com/ 注册账号
2. 下载花生壳客户端
3. 添加映射：本地端口 3000 → 公网域名

### 完整部署流程

1. **启动本地后端服务**（参考方案 1）
2. **启动内网穿透工具**（选择上述任一工具）
3. **配置前端 API 地址**（指向内网穿透生成的公网 URL）
4. **验证连接**（访问公网 URL 测试）

### 注意事项

⚠️ **安全提醒**:

- 内网穿透会将本地服务暴露到公网，请确保：
  - 使用 HTTPS（如果可能）
  - 设置强密码
  - 定期更换密钥
  - 不要在生产环境长期使用

⚠️ **性能限制**:

- 免费版内网穿透工具通常有带宽限制
- 可能有连接数限制
- 适合测试，不适合生产环境

---

## 方案 3: Docker 容器化部署

### 适用场景

- ✅ 模拟生产环境
- ✅ 需要隔离的运行环境
- ✅ 希望后端服务随电脑启动自动运行

### 前置要求

- Docker Desktop 已安装并运行
- 已构建 Docker 镜像

### 构建 Docker 镜像

```bash
# 构建用户服务镜像
cd services/user-service
docker build -t user-service:latest .

# 构建 API 网关镜像
cd ../api-gateway
docker build -t api-gateway:latest .

# 构建设置服务镜像
cd ../settings-service
docker build -t settings-service:latest .
```

### 创建 Docker Compose 配置

创建 `docker-compose-backend.yml`:

```yaml
version: '3.8'

services:
  # MySQL 数据库
  mysql:
    image: mysql:8.0
    container_name: platform-mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: user_db
      MYSQL_USER: app_user
      MYSQL_PASSWORD: userpassword
    ports:
      - '3307:3306'
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost']
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: platform-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  # API 网关
  api-gateway:
    image: api-gateway:latest
    container_name: api-gateway
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
    depends_on:
      - user-service
      - settings-service

  # 用户服务
  user-service:
    image: user-service:latest
    container_name: user-service
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USERNAME=app_user
      - DB_PASSWORD=userpassword
      - DB_DATABASE=user_db
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started

  # 设置服务
  settings-service:
    image: settings-service:latest
    container_name: settings-service
    ports:
      - '3002:3002'
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USERNAME=app_user
      - DB_PASSWORD=userpassword
      - DB_DATABASE=settings_db
    depends_on:
      mysql:
        condition: service_healthy

volumes:
  mysql_data:
  redis_data:
```

### 启动所有服务

```bash
# 启动所有服务
docker-compose -f docker-compose-backend.yml up -d

# 查看服务状态
docker-compose -f docker-compose-backend.yml ps

# 查看日志
docker-compose -f docker-compose-backend.yml logs -f
```

### 停止服务

```bash
# 停止所有服务
docker-compose -f docker-compose-backend.yml down

# 停止服务并删除数据卷（谨慎使用）
docker-compose -f docker-compose-backend.yml down -v
```

---

## 常见问题

### Q1: 端口被占用怎么办？

**Windows**:

```bash
# 查看占用端口的进程
netstat -ano | findstr :3000

# 结束进程（替换 PID）
taskkill /PID <PID> /F
```

**Linux/macOS**:

```bash
# 查看占用端口的进程
lsof -ti:3000

# 结束进程
kill -9 <PID>
```

### Q2: Docker 服务无法启动？

1. 检查 Docker Desktop 是否正在运行
2. 检查端口是否被占用
3. 检查 Docker 资源分配（设置 → Resources）
4. 查看 Docker 日志：`docker logs <container_name>`

### Q3: 数据库连接失败？

1. 确认 MySQL 容器正在运行：`docker ps`
2. 检查环境变量配置（DB_HOST、DB_PORT、用户名、密码）
3. 确认 MySQL 健康检查通过：`docker inspect platform-mysql`
4. 测试数据库连接：

```bash
docker exec -it platform-mysql mysql -uapp_user -puserpassword -D user_db
```

### Q4: 如何查看服务日志？

**本地运行**:

```bash
# 查看所有后端服务日志（启动时已经输出到控制台）
pnpm run start:backend
```

**Docker 运行**:

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker logs -f api-gateway
docker logs -f user-service
```

### Q5: 如何让服务开机自动启动？

**Windows**:

1. 创建批处理文件 `start-backend.bat`
2. 使用任务计划程序设置为开机启动

**Linux/macOS**:

1. 创建 systemd 服务文件
2. 或使用 Docker Compose 的 `restart: unless-stopped` 策略

### Q6: 内存占用过高怎么办？

1. **关闭不需要的服务**：只启动必要的服务
2. **限制 Docker 资源**：在 Docker Desktop 设置中限制内存
3. **使用轻量级镜像**：使用 Alpine Linux 基础镜像
4. **优化代码**：检查是否有内存泄漏

---

## 总结

| 方案   | 适用场景       | 难度        | 外网访问 | 推荐度     |
| ------ | -------------- | ----------- | -------- | ---------- |
| 方案 1 | 本地开发测试   | ⭐ 简单     | ❌       | ⭐⭐⭐⭐⭐ |
| 方案 2 | 外网访问、演示 | ⭐⭐ 中等   | ✅       | ⭐⭐⭐     |
| 方案 3 | 生产环境模拟   | ⭐⭐⭐ 复杂 | ✅       | ⭐⭐⭐⭐   |

**推荐**:

- **日常开发**: 使用方案 1
- **外网演示**: 使用方案 2（ngrok 或花生壳）
- **生产准备**: 使用方案 3（Docker）

---

## 相关资源

- [项目 README](./README.md) - 完整项目文档
- [快速开始指南](./README.md#快速开始) - 项目启动指南
- [故障排除](./README.md#故障排除) - 常见问题解决
