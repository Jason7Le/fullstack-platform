// 导入测试相关依赖
import {
  UserAlreadyExistsException,
  UserNotFoundException,
} from '@fullstack-platform/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

// 模拟 PasswordUtil
jest.mock('@fullstack-platform/common', () => ({
  PasswordUtil: {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
    validatePasswordStrength: jest.fn().mockReturnValue(true), // 默认返回 true
  },
  UserNotFoundException: class UserNotFoundException extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'UserNotFoundException';
    }
  },
  UserAlreadyExistsException: class UserAlreadyExistsException extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'UserAlreadyExistsException';
    }
  },
}));

// 完整功能测试 - 包含数据库模拟和业务逻辑测试
describe('UsersService', () => {
  // describe: 定义一个测试套件，专门测试业务逻辑
  let service: UsersService; // 服务实例变量
  let repository: Repository<User>; // 数据库仓库实例变量

  // 模拟用户数据，用于测试
  const mockUser = {
    // mockUser: 模拟数据，代表一个假的用户对象
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    passwordHash: 'hashed_password',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockCreateUserDto = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    role: 'user' as const,
  };
  beforeEach(async () => {
    // beforeEach: 每个测试前的准备工作
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService, // 注册真实的服务
        {
          // 依赖注入配置：用模拟对象替换真实的数据库仓库
          provide: getRepositoryToken(User), // 获取 User 实体的仓库令牌
          useValue: {
            // useValue: 提供模拟的仓库对象
            find: jest.fn(), // jest.fn(): 创建模拟函数，可以控制返回值
            findOne: jest.fn(), // 模拟查询单个记录的方法
            create: jest.fn(), // 模拟创建记录的方法
            save: jest.fn(), // 模拟保存记录的方法
            remove: jest.fn(), // 模拟删除记录的方法
          },
        },
      ],
    }).compile(); // 编译测试模块

    // 获取服务实例和模拟的仓库实例
    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  // 测试 findOne 方法的各种场景
  describe('findOne', () => {
    // describe: 嵌套的测试套件，专门测试 findOne 方法
    it('应该成功找到用户', async () => {
      // it: 测试用例 - 成功场景
      // jest.spyOn: 监听 repository.findOne 方法的调用
      // mockResolvedValue: 设置模拟方法的返回值（成功情况）
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      // 调用被测试的方法
      const result = await service.findOne(1);

      // 验证返回结果
      expect(result).toBeDefined(); // 验证结果不为空
      expect(result.id).toBe(1); // 验证返回的用户ID正确
      expect(result.email).toBe(mockUser.email); // 验证返回的用户邮箱正确
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } }); // 验证查询参数正确
    });

    it('应该抛出用户不存在异常当用户不存在时', async () => {
      // it: 测试用例 - 异常场景
      // mockResolvedValue(null): 设置模拟方法返回 null（用户不存在）
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // 验证调用不存在的用户ID时抛出异常
      // expect().rejects: 验证异步操作会抛出异常
      // toThrow: 验证抛出的异常类型
      await expect(service.findOne(999)).rejects.toThrow(UserNotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('999');
    });
    it('应该抛出系统错误异常当数据库操作失败时', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValue(new Error('Database error'));
      await expect(service.findOne(1)).rejects.toThrow('获取用户信息失败');
    });
  });
  describe('findAll', () => {
    it('应该返回所有用户列表', async () => {
      // 准备
      jest.spyOn(repository, 'find').mockResolvedValue([mockUser]);

      // 执行
      const result = await service.findAll();

      // 断言
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('test@example.com');
      expect(repository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });

    it('应该返回空数组当没有用户时', async () => {
      // 准备
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      // 执行
      const result = await service.findAll();

      // 断言
      expect(result).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('应该成功创建用户', async () => {
      // 准备
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValue(mockUser);

      // 执行
      const result = await service.create(mockCreateUserDto);

      // 断言
      expect(result).toBeDefined();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('应该抛出用户已存在异常当邮箱重复时', async () => {
      // 准备 - 模拟 findByEmail 返回已存在的用户
      jest.spyOn(service, 'findByEmail').mockResolvedValue(mockUser);

      // 执行和断言
      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        UserAlreadyExistsException,
      );
      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        '创建用户失败',
      );
    });
  });

  describe('getUserStats', () => {
    it('应该返回用户统计信息', async () => {
      // 准备 - 添加 count 方法到模拟对象
      const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        count: jest.fn().mockResolvedValue(10),
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([
            { role: 'admin', count: '2' },
            { role: 'user', count: '8' },
          ]),
        }),
      };

      // 重新创建模块以使用更新的模拟对象
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UsersService,
          {
            provide: getRepositoryToken(User),
            useValue: mockRepository,
          },
        ],
      }).compile();

      const testService = module.get<UsersService>(UsersService);

      // 执行
      const result = await testService.getUserStats();

      // 断言
      expect(result.total).toBe(10);
      expect(result.byRole.admin).toBe(2);
      expect(result.byRole.user).toBe(8);
    });
  });
});
