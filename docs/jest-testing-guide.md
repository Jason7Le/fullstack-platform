# Jest 单元测试方法详解

## 📋 目录

- [测试结构方法](#测试结构方法)
- [模拟和监听方法](#模拟和监听方法)
- [断言方法](#断言方法)
- [NestJS 测试方法](#nestjs-测试方法)
- [测试流程](#测试流程)
- [实际示例](#实际示例)
- [最佳实践](#最佳实践)

## 🏗️ 测试结构方法

### `describe()`

**作用**: 定义测试套件，用于组织相关的测试用例

```typescript
describe('UsersService', () => {
  // 测试用例
});

describe('UsersService - findOne', () => {
  // 嵌套的测试套件
});
```

**特点**:

- 可以嵌套使用
- 用于逻辑分组
- 提供清晰的测试结构

### `it()` / `test()`

**作用**: 定义具体的测试用例

```typescript
it('应该成功找到用户', async () => {
  // 测试逻辑
});

test('应该抛出用户不存在异常', async () => {
  // 测试逻辑
});
```

**参数**:

- 第一个参数: 测试描述
- 第二个参数: 测试函数

### `beforeEach()` / `afterEach()`

**作用**: 测试钩子函数

```typescript
beforeEach(async () => {
  // 每个测试前执行
});

afterEach(() => {
  // 每个测试后执行
});
```

**其他钩子**:

- `beforeAll()` - 所有测试前执行一次
- `afterAll()` - 所有测试后执行一次

## 🎭 模拟和监听方法

### `jest.fn()`

**作用**: 创建模拟函数

```typescript
const mockFunction = jest.fn();
const mockFunctionWithReturn = jest.fn(() => 'return value');
const mockAsyncFunction = jest.fn().mockResolvedValue('async value');
```

### `jest.spyOn()`

**作用**: 监听对象方法的调用

```typescript
// 监听方法调用
const spy = jest.spyOn(repository, 'findOne');

// 设置返回值
spy.mockResolvedValue(mockUser);

// 验证调用
expect(spy).toHaveBeenCalledWith(1);
expect(spy).toHaveBeenCalledTimes(1);
```

### `jest.mock()`

**作用**: 模拟整个模块

```typescript
jest.mock('@nestjs/typeorm', () => ({
  getRepositoryToken: jest.fn(),
}));
```

### 模拟方法返回值

```typescript
// 同步返回值
mockFunction.mockReturnValue('value');

// 异步返回值
mockFunction.mockResolvedValue('async value');
mockFunction.mockRejectedValue(new Error('error'));

// 多次调用返回不同值
mockFunction.mockReturnValueOnce('first').mockReturnValueOnce('second');
```

## ✅ 断言方法

### 基础断言

```typescript
// 验证值
expect(value).toBe(expected); // 严格相等
expect(value).toEqual(expected); // 深度相等
expect(value).toBeDefined(); // 已定义
expect(value).toBeUndefined(); // 未定义
expect(value).toBeNull(); // 为 null
expect(value).toBeTruthy(); // 为真值
expect(value).toBeFalsy(); // 为假值
```

### 数字断言

```typescript
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3);
expect(value).toBeLessThan(5);
expect(value).toBeLessThanOrEqual(5);
expect(value).toBeCloseTo(0.3); // 浮点数比较
```

### 字符串断言

```typescript
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');
expect(string).toHaveLength(10);
```

### 数组断言

```typescript
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(array).toContainEqual({ id: 1 });
```

### 对象断言

```typescript
expect(object).toHaveProperty('key');
expect(object).toHaveProperty('key', 'value');
expect(object).toEqual(
  expect.objectContaining({
    id: expect.any(Number),
    name: expect.any(String),
  }),
);
```

### 异常断言

```typescript
// 同步异常
expect(() => {
  throw new Error('error');
}).toThrow('error');

// 异步异常
await expect(asyncFunction()).rejects.toThrow('error');
await expect(asyncFunction()).rejects.toThrow(ErrorClass);
```

### 函数调用断言

```typescript
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledWith(arg1, arg2);
expect(mockFunction).toHaveBeenCalledTimes(2);
expect(mockFunction).toHaveBeenLastCalledWith(arg1);
```

## 🔧 NestJS 测试方法

### `Test.createTestingModule()`

**作用**: 创建 NestJS 测试模块

```typescript
const module: TestingModule = await Test.createTestingModule({
  providers: [UsersService],
  controllers: [UsersController],
  imports: [TypeOrmModule.forRoot()],
}).compile();
```

### `getRepositoryToken()`

**作用**: 获取 TypeORM 实体的仓库令牌

```typescript
import { getRepositoryToken } from '@nestjs/typeorm';

const token = getRepositoryToken(User);
```

### 依赖注入测试

```typescript
// 模拟依赖
const module: TestingModule = await Test.createTestingModule({
  providers: [
    UsersService,
    {
      provide: getRepositoryToken(User),
      useValue: {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
      },
    },
  ],
}).compile();

// 获取实例
const service = module.get<UsersService>(UsersService);
const repository = module.get<Repository<User>>(getRepositoryToken(User));
```

## 📝 测试流程

### 1. 准备阶段 (Arrange)

```typescript
beforeEach(async () => {
  // 创建测试模块
  const module = await Test.createTestingModule({
    providers: [Service],
  }).compile();

  // 获取实例
  service = module.get<Service>(Service);
});
```

### 2. 执行阶段 (Act)

```typescript
it('should return user', async () => {
  // 准备数据
  const mockUser = { id: 1, name: 'Test' };
  jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

  // 执行测试
  const result = await service.findOne(1);

  // 验证结果
  expect(result).toEqual(mockUser);
});
```

### 3. 验证阶段 (Assert)

```typescript
// 验证返回值
expect(result).toBeDefined();
expect(result.id).toBe(1);

// 验证方法调用
expect(repository.findOne).toHaveBeenCalledWith(1);
```

## 💡 实际示例

### 完整的服务测试示例

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('findOne', () => {
    it('应该成功找到用户', async () => {
      // 准备
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      // 执行
      const result = await service.findOne(1);

      // 验证
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith(1);
    });

    it('应该抛出用户不存在异常', async () => {
      // 准备
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // 执行和验证
      await expect(service.findOne(999)).rejects.toThrow('User not found');
    });
  });
});
```

## 🎯 最佳实践

### 1. 测试命名

```typescript
// ✅ 好的命名
it('should return user when valid id is provided', () => {});
it('should throw error when user is not found', () => {});

// ❌ 不好的命名
it('test1', () => {});
it('should work', () => {});
```

### 2. 测试结构

```typescript
describe('UsersService', () => {
  describe('findOne', () => {
    it('should return user when found', () => {});
    it('should throw error when not found', () => {});
  });

  describe('create', () => {
    it('should create user successfully', () => {});
    it('should throw error when email exists', () => {});
  });
});
```

### 3. 模拟数据

```typescript
// ✅ 使用工厂函数
const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});

// ✅ 使用 beforeEach 重置模拟
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 4. 异步测试

```typescript
// ✅ 使用 async/await
it('should handle async operation', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});

// ✅ 测试异常
it('should throw error', async () => {
  await expect(service.errorMethod()).rejects.toThrow('Error message');
});
```

### 5. 测试覆盖率

```typescript
// 确保测试覆盖所有场景
describe('complete test coverage', () => {
  it('should handle success case', () => {});
  it('should handle error case', () => {});
  it('should handle edge case', () => {});
  it('should handle null/undefined', () => {});
});
```

## 🔍 调试技巧

### 1. 使用 `console.log`

```typescript
it('should debug test', () => {
  console.log('Debug info:', result);
  expect(result).toBeDefined();
});
```

### 2. 使用 `expect.any()`

```typescript
expect(result).toEqual({
  id: expect.any(Number),
  name: expect.any(String),
  createdAt: expect.any(Date),
});
```

### 3. 使用 `expect.objectContaining()`

```typescript
expect(result).toEqual(
  expect.objectContaining({
    id: 1,
    name: 'Test User',
  }),
);
```

## 📚 常用断言速查表

| 断言                     | 用途     | 示例                                    |
| ------------------------ | -------- | --------------------------------------- |
| `toBe()`                 | 严格相等 | `expect(1).toBe(1)`                     |
| `toEqual()`              | 深度相等 | `expect({a: 1}).toEqual({a: 1})`        |
| `toBeDefined()`          | 已定义   | `expect(value).toBeDefined()`           |
| `toBeNull()`             | 为 null  | `expect(value).toBeNull()`              |
| `toBeTruthy()`           | 为真值   | `expect(1).toBeTruthy()`                |
| `toContain()`            | 包含元素 | `expect(['a', 'b']).toContain('a')`     |
| `toHaveLength()`         | 长度     | `expect('abc').toHaveLength(3)`         |
| `toThrow()`              | 抛出异常 | `expect(() => throw Error()).toThrow()` |
| `toHaveBeenCalled()`     | 被调用   | `expect(mock).toHaveBeenCalled()`       |
| `toHaveBeenCalledWith()` | 调用参数 | `expect(mock).toHaveBeenCalledWith(1)`  |

---

## 测试框架核心概念

1. **测试结构（Describe + It）**

```typescript
describe('UsersService', () => {
  // 测试套件：描述要测试的类
  describe('findOne', () => {
    // 测试分组：描述要测试的方法
    it('应该成功找到用户', async () => {
      // 测试用例：描述具体场景
      // 测试逻辑
    });
  });
});
```

2. **测试生命周期（BeforeEach + AfterEach）**

```typescript
beforeEach(async () => {
  // 每个测试前执行：准备测试环境
});

afterEach(() => {
  // 每个测试后执行：清理工作
});
```

## 🚀 快速开始

1. **安装依赖**

```bash
npm install --save-dev @nestjs/testing jest
```

2. **创建测试文件**

```bash
touch src/users/users.service.spec.ts
```

3. **编写测试**

```typescript
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

4. **运行测试**

```bash
npm test
```

---

_最后更新: 2025-09-07_
_版本: 1.0.0_
