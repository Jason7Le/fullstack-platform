# @fullstack-platform/common

全栈微前端数据平台通用工具包，提供统一的错误处理、装饰器、工具类等功能。

## 📦 功能特性

- ✅ **统一错误处理**: 基于 `ErrorCodes` 和 `ErrorResponse` 的统一异常处理
- ✅ **自定义异常**: 预定义的业务异常类
- ✅ **装饰器**: 角色权限装饰器
- ✅ **工具类**: 密码处理、响应格式化等工具

## 🚀 快速开始

### 安装

```bash
pnpm add @fullstack-platform/common
```

### 基本使用

#### 1. 错误处理

```typescript
import {
  ErrorCodes,
  CustomException,
  HttpStatus,
  UserNotFoundException,
  UserAlreadyExistsException,
} from '@fullstack-platform/common';

// 使用预定义异常
throw new UserNotFoundException(123);
throw new UserAlreadyExistsException('user@example.com');

// 使用自定义异常
throw new CustomException(ErrorCodes.VALIDATION_ERROR, '参数验证失败', HttpStatus.BAD_REQUEST, {
  field: 'email',
  value: 'invalid-email',
});
```

#### 2. 角色装饰器

```typescript
import { Roles } from '@fullstack-platform/common';

@Controller('users')
@Roles('admin') // 控制器级别
export class UsersController {
  @Get()
  @Roles('admin', 'user') // 方法级别
  findAll() {
    // 业务逻辑
  }
}
```

#### 3. 工具类

```typescript
import { PasswordUtil, ResponseUtil } from '@fullstack-platform/common';

// 密码处理
const hashedPassword = await PasswordUtil.hashPassword('password123');
const isValid = await PasswordUtil.comparePassword('password123', hashedPassword);
const isStrong = PasswordUtil.validatePasswordStrength('password123');

// 响应格式化
const successResponse = ResponseUtil.success(data, '操作成功');
const errorResponse = ResponseUtil.error('操作失败', error);
const paginatedResponse = ResponseUtil.paginate(data, total, page, limit);
```

## 📋 API 文档

### 异常类

#### CustomException

基础自定义异常类，提供统一的错误处理格式。

```typescript
class CustomException extends HttpException {
  constructor(
    code: ErrorCodes,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: any,
  );
}
```

#### 预定义异常

- `UserNotFoundException`: 用户不存在异常
- `UserAlreadyExistsException`: 用户已存在异常
- `AuthenticationFailedException`: 认证失败异常
- `TokenExpiredException`: 令牌过期异常

### HTTP状态码 (HttpStatus)

```typescript
enum HttpStatus {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}
```

### 错误码 (ErrorCodes)

```typescript
enum ErrorCodes {
  // 认证错误
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  AUTH_USER_ALREADY_EXISTS = 'AUTH_USER_ALREADY_EXISTS',
  AUTH_USER_NOT_AUTHORIZED = 'AUTH_USER_NOT_AUTHORIZED',
  AUTH_USER_NOT_AUTHENTICATED = 'AUTH_USER_NOT_AUTHENTICATED',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',

  // 用户错误
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  USER_NOT_AUTHORIZED = 'USER_NOT_AUTHORIZED',
  USER_NOT_AUTHENTICATED = 'USER_NOT_AUTHENTICATED',

  // 系统错误
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYSTEM_UNAVAILABLE = 'SYSTEM_UNAVAILABLE',
  SYSTEM_TIMEOUT = 'SYSTEM_TIMEOUT',

  // 数据库错误
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_TRANSACTION_ERROR = 'DATABASE_TRANSACTION_ERROR',

  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  VALIDATION_REQUIRED = 'VALIDATION_REQUIRED',
  VALIDATION_INVALID = 'VALIDATION_INVALID',
  VALIDATION_UNIQUE = 'VALIDATION_UNIQUE',
  VALIDATION_MIN_LENGTH = 'VALIDATION_MIN_LENGTH',
  VALIDATION_MAX_LENGTH = 'VALIDATION_MAX_LENGTH',
  VALIDATION_PATTERN = 'VALIDATION_PATTERN',
  VALIDATION_MIN = 'VALIDATION_MIN',
  VALIDATION_MAX = 'VALIDATION_MAX',
}
```

### 响应接口

#### ErrorResponse

```typescript
interface ErrorResponse {
  success: false;
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path?: string;
}
```

#### SuccessResponse

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}
```

## 🔧 配置

### 在 NestJS 中使用

1. 导入异常过滤器：

```typescript
import { HttpExceptionFilter, AllExceptionsFilter } from '@fullstack-platform/common';

app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
```

2. 使用装饰器：

```typescript
import { Roles } from '@fullstack-platform/common';

@Controller('api')
@Roles('admin')
export class ApiController {
  @Get('users')
  @Roles('admin', 'user')
  getUsers() {
    // 业务逻辑
  }
}
```

## 📝 迁移指南

### 从原有异常处理迁移

#### 原有代码：

```typescript
throw new ConflictException('用户邮箱已存在');
```

#### 新代码：

```typescript
import { UserAlreadyExistsException } from '@fullstack-platform/common';
throw new UserAlreadyExistsException('user@example.com');
```

#### 响应格式对比：

**原有格式：**

```json
{
  "success": false,
  "statusCode": 409,
  "timestamp": "2025-01-06T10:00:00.000Z",
  "path": "/users",
  "message": "用户邮箱已存在",
  "error": "Conflict"
}
```

**新格式：**

```json
{
  "success": false,
  "code": "USER_ALREADY_EXISTS",
  "message": "邮箱 user@example.com 已被注册",
  "details": { "email": "user@example.com" },
  "timestamp": "2025-01-06T10:00:00.000Z",
  "path": "/users"
}
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个包。

## 📄 许可证

MIT License
