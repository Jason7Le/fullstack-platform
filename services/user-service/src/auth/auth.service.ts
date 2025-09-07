import { PasswordUtil } from '@fullstack-platform/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { JwtPayload, LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// 用户信息类型（去除敏感字段）
type SafeUser = Pick<
  User,
  'id' | 'email' | 'name' | 'role' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class AuthService {
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

  // 用户登录：签发 JWT
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // JWT payload：包含用户关键信息
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // 用户注册：创建用户并自动登录
  async register(register: RegisterDto): Promise<LoginResponseDto> {
    // 创建新用户（包含密码加密、邮箱唯一性检查等）
    const user = await this.userService.create(register);
    // 生成 JWT payload
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // 返回访问令牌和用户信息
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
