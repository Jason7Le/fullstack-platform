# 用户数据修复说明

## 问题描述

用户注册时间（createdAt）在前端用户管理页面中没有显示出来，这是因为后端接口返回的用户数据中缺少 `createdAt` 和 `updatedAt` 字段。

## 修复内容

### 1. 更新 LoginResponseDto 类型定义

**文件**: `services/user-service/src/auth/dto/login-response.dto.ts`

**修改内容**:

- 在 `user` 对象类型中添加了 `createdAt: Date` 和 `updatedAt: Date` 字段
- 更新了 API 文档示例，包含时间字段

**修改前**:

```typescript
user: {
  id: number;
  email: string;
  name: string;
  role: string;
}
```

**修改后**:

```typescript
user: {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. 更新 AuthService 中的用户数据返回

**文件**: `services/user-service/src/auth/auth.service.ts`

**修改内容**:

- 在 `generateToken` 方法中添加了 `createdAt` 和 `updatedAt` 字段
- 在 `refreshAccessToken` 方法中添加了 `createdAt` 和 `updatedAt` 字段

**修改前**:

```typescript
user: {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
},
```

**修改后**:

```typescript
user: {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
},
```

## 影响的接口

### 1. 登录接口 (`POST /auth/login`)

- 现在返回的用户信息包含 `createdAt` 和 `updatedAt`
- 前端可以获取用户的注册时间

### 2. 刷新令牌接口 (`POST /auth/refresh`)

- 现在返回的用户信息包含 `createdAt` 和 `updatedAt`
- 确保刷新令牌时也能获取完整用户信息

### 3. 注册接口 (`POST /auth/register`)

- 通过 `generateToken` 方法间接影响
- 注册成功后返回的用户信息包含时间字段

## 前端影响

### 用户管理页面

- 用户列表现在可以正确显示创建时间和更新时间
- `formatDate` 函数会正确格式化这些时间字段
- 表格支持按创建时间排序

### 仪表板页面

- 用户信息展示区域可以显示注册时间
- 用户统计信息更加完整

## 验证方法

### 1. 后端验证

```bash
# 启动后端服务
npm run -w user-service start:dev

# 测试登录接口
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. 前端验证

```bash
# 启动前端服务
npm run -w main-app dev

# 访问用户管理页面
# 检查用户列表是否显示创建时间和更新时间
```

## 注意事项

1. **数据库字段**: 确保数据库中的 `users` 表包含 `created_at` 和 `updated_at` 字段
2. **类型安全**: TypeScript 类型定义已更新，确保类型安全
3. **API 文档**: Swagger 文档已更新，包含时间字段示例
4. **向后兼容**: 此修改是向后兼容的，不会破坏现有功能

## 相关文件

- `services/user-service/src/auth/dto/login-response.dto.ts`
- `services/user-service/src/auth/auth.service.ts`
- `services/user-service/src/users/dto/user-response.dto.ts`
- `apps/main-app/src/views/UserManagementView.vue`
- `apps/main-app/src/views/DashboardView.vue`
