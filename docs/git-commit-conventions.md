# Git 提交规范

本项目采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范，用于规范 Git 提交信息的格式和类型。

## 📝 提交格式

```bash
git commit -m "类型(范围): 描述"

# 示例
git commit -m "feat(user): 添加用户登录功能"
git commit -m "fix(auth): 修复 JWT token 过期处理"
```

## 🏷️ 提交类型

### 主要类型

| 类型       | 说明           | 示例                         |
| ---------- | -------------- | ---------------------------- |
| `feat`     | 新功能         | `feat: 添加用户注册功能`     |
| `fix`      | 修复 bug       | `fix: 修复登录验证问题`      |
| `docs`     | 文档更新       | `docs: 更新 README 安装说明` |
| `style`    | 代码格式调整   | `style: 统一代码缩进格式`    |
| `refactor` | 代码重构       | `refactor: 重构用户服务模块` |
| `perf`     | 性能优化       | `perf: 优化数据库查询性能`   |
| `test`     | 测试相关       | `test: 添加用户登录单元测试` |
| `chore`    | 构建/工具/配置 | `chore: 更新依赖包版本`      |

### 其他类型

| 类型     | 说明       | 示例                             |
| -------- | ---------- | -------------------------------- |
| `build`  | 构建系统   | `build: 更新 webpack 配置`       |
| `ci`     | CI/CD 相关 | `ci: 添加 GitHub Actions 工作流` |
| `revert` | 回滚提交   | `revert: 回滚到上一个稳定版本`   |

## 🎯 范围说明

范围用于指定提交影响的模块或功能区域：

```bash
# 前端应用
feat(main-app): 添加用户管理页面
fix(dashboard-app): 修复图表显示问题

# 后端服务
feat(user-service): 添加用户认证接口
fix(auth-service): 修复权限验证逻辑

# 公共包
feat(ui-components): 添加通用按钮组件
fix(eslint-config): 修复 TypeScript 规则

# 基础设施
chore(infra): 更新 Docker 配置
docs(infra): 添加部署说明
```

## 📋 项目特定示例

### 前端应用 (apps/)

```bash
# 主应用
feat(main-app): 添加用户登录页面
fix(main-app): 修复路由跳转问题
style(main-app): 统一组件样式

# 仪表板应用
feat(dashboard-app): 添加数据可视化图表
perf(dashboard-app): 优化图表渲染性能
```

### 后端服务 (services/)

```bash
# 用户服务
feat(user-service): 添加用户注册接口
fix(user-service): 修复邮箱验证逻辑
refactor(user-service): 重构用户实体设计

# 认证服务
feat(auth-service): 实现 JWT 认证策略
fix(auth-service): 修复 token 刷新问题
test(auth-service): 添加认证单元测试
```

### 公共包 (packages/)

```bash
# UI 组件
feat(ui-components): 添加通用表格组件
fix(ui-components): 修复按钮点击事件
docs(ui-components): 更新组件使用文档

# 配置包
chore(eslint-config): 更新代码规范配置
chore(ts-config): 统一 TypeScript 配置
```

### 基础设施 (infra/)

```bash
# Docker 配置
chore(infra): 更新 Docker Compose 配置
docs(infra): 添加容器化部署指南

# 数据库配置
feat(infra): 添加 MySQL 初始化脚本
fix(infra): 修复 Redis 连接配置
```

## 🚀 常用提交命令

### 新功能开发

```bash
git commit -m "feat(user-service): 添加用户登录功能"
git commit -m "feat(auth): 实现 JWT 认证策略"
```

### Bug 修复

```bash
git commit -m "fix(user): 修复用户注册验证问题"
git commit -m "fix(api): 修复分页参数处理"
```

### 代码重构

```bash
git commit -m "refactor: 将 user-service 从子模块转换为普通目录"
git commit -m "refactor(app): 优化模块导入结构"
```

### 文档更新

```bash
git commit -m "docs: 更新 README 安装指南"
git commit -m "docs: 添加 API 接口文档"
```

### 代码格式

```bash
git commit -m "style: 统一代码缩进格式"
git commit -m "style: 移除测试注释"
```

### 配置更新

```bash
git commit -m "chore: 更新 pnpm 工作区配置"
git commit -m "chore: 添加 Docker 构建配置"
```

## ⚠️ 注意事项

1. **描述要简洁明了**：用中文描述，避免过长
2. **范围要准确**：指定具体影响的模块或功能
3. **类型要恰当**：根据实际变更选择合适的类型
4. **保持一致性**：团队内统一使用相同的规范

## 🔗 相关链接

- [Conventional Commits 官网](https://www.conventionalcommits.org/)
- [Angular 提交规范](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#-commit-message-format)
- [Vue.js 提交规范](https://github.com/vuejs/vue/blob/main/.github/COMMIT_CONVENTION.md)
