// 导入测试相关依赖
import { UserNotFoundException } from '@fullstack-platform/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'users/entities/user.entity';
import { UsersService } from './users.service';

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
    createdAt: new Date(),
    updatedAt: new Date(),
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
    });

    it('应该抛出用户不存在异常', async () => {
      // it: 测试用例 - 异常场景
      // mockResolvedValue(null): 设置模拟方法返回 null（用户不存在）
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // 验证调用不存在的用户ID时抛出异常
      // expect().rejects: 验证异步操作会抛出异常
      // toThrow: 验证抛出的异常类型
      await expect(service.findOne(999)).rejects.toThrow(UserNotFoundException);
    });
  });
});
