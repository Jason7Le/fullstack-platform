import {
  AuthenticationFailedException,
  PasswordUtil,
} from '@fullstack-platform/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
// 模拟 PasswordUtil
jest.mock('@fullstack-platform/common', () => ({
  PasswordUtil: {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
    validatePasswordStrength: jest.fn(),
  },
}));
describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
    passwordHash: 'hashed_password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockLoginDto = {
    email: 'test@example.com',
    password: 'password123',
  };
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_jwt_token'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('validateUser', () => {
    it('应该成功验证用户', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        passwordHash: '$2b$10$hashed_password',
        name: 'Test User',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 需要模拟 bcrypt 的 comparePassword
      const result = await authService.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeDefined();
    });
    it('应该返回null当用户不存在时', async () => {
      // 准备
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      // 执行
      const result = await authService.validateUser(
        'nonexistent@example.com',
        'password123',
      );

      // 断言
      expect(result).toBeNull();
    });

    it('应该返回null当密码错误时', async () => {
      // 准备
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      (PasswordUtil.comparePassword as jest.Mock).mockResolvedValue(false);

      // 执行
      const result = await authService.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      // 断言
      expect(result).toBeNull();
    });
  });
  describe('login', () => {
    it('应该成功登录并返回token', async () => {
      // 准备
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);

      // 执行
      const result = await authService.login(mockLoginDto);

      // 断言
      expect(result).toBeDefined();
      expect(result.access_token).toBe('mock_jwt_token');
      expect(result.user.email).toBe('test@example.com');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'test@example.com',
        role: 'user',
      });
    });

    it('应该抛出认证失败异常当验证失败时', async () => {
      // 准备
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      // 执行和断言
      await expect(authService.login(mockLoginDto)).rejects.toThrow(
        AuthenticationFailedException,
      );
      await expect(authService.login(mockLoginDto)).rejects.toThrow(
        '邮箱或密码错误',
      );
    });
  });
});
