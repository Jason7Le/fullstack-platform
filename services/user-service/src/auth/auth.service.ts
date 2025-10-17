import { PasswordUtil } from '@fullstack-platform/common';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import {
  JwtPayload,
  LoginResponseDto,
  RefreshTokenDto,
} from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
// 用户信息类型（去除敏感字段）
type SafeUser = Pick<
  User,
  'id' | 'email' | 'name' | 'role' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 校验用户凭证：用于本地策略
  async validateUser(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.userService.findByEmail(email);
    if (
      user &&
      (await PasswordUtil.comparePassword(password, user.passwordHash))
    ) {
      // 返回去除敏感字段的用户数据
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  // 生成JWT令牌：基于已验证的用户信息
  async generateToken(
    user: SafeUser,
    rememberMe: boolean,
  ): Promise<LoginResponseDto> {
    // JWT payload：包含用户关键信息
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    // 生成访问令牌（短期有效，如15分钟）
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    // 生成刷新令牌(长期有效，如7天)
    const refresh_token = this.generateRefreshToken();

    // 计算刷新令牌过期时间（7天后）
    const refreshTokenExpiry = this.calculateRefreshTokenExpiry(rememberMe);

    /// 保存刷新令牌到数据库
    await this.userService.updateRefreshToken(
      user.id,
      refresh_token,
      refreshTokenExpiry,
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  // 撤销刷新令牌（用户登出时使用）
  async revokeRefreshToken(userId: number): Promise<void> {
    await this.userService.updateRefreshToken(userId, '', new Date());
  }

  // 通知用户登出，广播在线用户数量
  notifyUserLogout(userId: number): void {
    // 这里可以添加通知WebSocket服务的逻辑
    // 由于WebSocket服务在用户断开连接时会自动广播，这里暂时不需要额外处理
    this.logger.log(
      `用户 ${userId} 登出，WebSocket连接将在断开时自动广播在线用户数量`,
    );
  }

  // 生成刷新令牌（随机字符串）
  private generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // 刷新访问令牌
  async refreshAccessToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginResponseDto> {
    const { refresh_token } = refreshTokenDto;
    // 查找拥有此刷新令牌的用户
    const user = await this.userService.findByRefreshToken(refresh_token);
    if (!user) {
      throw new UnauthorizedException('无效的刷新令牌');
    }

    // 检查刷新令牌是否过期
    if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
      throw new UnauthorizedException('刷新令牌已过期');
    }

    // 生成新的访问令牌
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  // 用户登录：签发 JWT（保留用于其他场景）
  async login(
    loginDto: LoginDto,
    rememberMe: boolean,
  ): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    return this.generateToken(user, rememberMe);
  }

  // 计算刷新令牌过期时间
  private calculateRefreshTokenExpiry(rememberMe: boolean): Date {
    const expiryDays = rememberMe ? 30 : 7;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    return expiryDate;
  }
  // 用户注册：创建用户并自动登录
  async register(register: RegisterDto): Promise<LoginResponseDto> {
    // 创建新用户（包含密码加密、邮箱唯一性检查等）
    const user = await this.userService.create(register);

    // 使用新的generateToken方法生成JWT
    return this.generateToken(user, false);
  }
}
