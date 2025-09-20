# 系统设置服务

基于 NestJS 的系统设置服务，提供系统配置、监控配置、通知配置的管理功能。

## 功能特性

- **系统配置管理**: 自动刷新间隔、数据保留天数、告警阈值等
- **监控配置管理**: Web Vitals、微前端、错误监控的开关和页面配置
- **通知配置管理**: 邮件通知、Webhook 通知、通知级别设置
- **数据持久化**: 基于 TypeORM + MySQL 的配置存储
- **API 文档**: 完整的 Swagger 文档

## 技术栈

- **NestJS 10**: 后端框架
- **TypeORM**: ORM 框架
- **MySQL**: 数据库
- **Swagger**: API 文档
- **TypeScript**: 类型安全

## 快速开始

### 环境要求

- Node.js 20+
- MySQL 8.0+
- pnpm 8+

### 安装依赖

```bash
cd services/settings-service
pnpm install
```

### 环境配置

创建 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3307
DB_USERNAME=app_user
DB_PASSWORD=userpassword
DB_DATABASE=settings_db
DB_SYNCHRONIZE=true

# 服务配置
PORT=3002
NODE_ENV=development
```

### 启动服务

```bash
# 开发模式
pnpm run start:dev

# 生产模式
pnpm run build
pnpm run start:prod
```

## API 接口

服务启动后访问：

- **服务地址**: http://localhost:3002
- **API 文档**: http://localhost:3002/api

### 主要接口

- `GET /api/settings` - 获取所有设置
- `POST /api/settings/system` - 保存系统配置
- `POST /api/settings/monitoring` - 保存监控配置
- `POST /api/settings/notification` - 保存通知配置
- `POST /api/settings` - 保存所有设置
- `POST /api/settings/reset` - 重置设置为默认值

## 数据库表结构

### settings 表

| 字段        | 类型         | 说明     |
| ----------- | ------------ | -------- |
| id          | int          | 主键     |
| key         | varchar(100) | 配置键   |
| value       | json         | 配置值   |
| description | varchar(500) | 配置描述 |
| createdAt   | datetime     | 创建时间 |
| updatedAt   | datetime     | 更新时间 |

## 开发

### 代码规范

```bash
# 格式化代码
pnpm run format

# 代码检查
pnpm run lint

# 运行测试
pnpm run test
```

### 提交规范

使用 Conventional Commits 规范：

```bash
git commit -m "feat: add new setting type"
git commit -m "fix: resolve settings validation issue"
git commit -m "docs: update API documentation"
```
