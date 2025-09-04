// NestJS 核心装饰器与服务
import { Injectable, UnauthorizedException } from '@nestjs/common';
// Passport 策略基类：提供 Passport 集成的基础功能
import { PassportStrategy } from '@nestjs/passport';
// JWT 策略相关：ExtractJwt 用于从请求中提取 JWT，Strategy 是 JWT 策略类
import { ExtractJwt, Strategy } from 'passport-jwt';
// 配置服务：用于获取环境变量和配置项
import { ConfigService } from '@nestjs/config';
// 用户服务：用于根据用户 ID 查询用户信息
import { UsersService } from 'src/users/users.service';

// @Injectable() 装饰器：标记此类可被 NestJS 依赖注入系统管理
@Injectable()
// JwtStrategy 类：继承自 PassportStrategy(Strategy)，实现 JWT 认证策略
export class JwtStrategy extends PassportStrategy(Strategy) {
  // constructor：构造函数，在创建 JwtStrategy 实例时自动调用
  // 作用：1) 接收依赖注入的服务 2) 调用父类构造函数 super() 初始化 Passport 策略
  constructor(
    // private 修饰符：自动创建实例属性，可通过 this.configService 访问
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    // super() 调用：调用父类 PassportStrategy 的构造函数
    // 作用：初始化 JWT 策略的配置，包括如何提取 JWT、验证密钥等
    // 参数说明：
    // - jwtFromRequest: 指定从请求的哪个位置提取 JWT（这里是从 Authorization Bearer 头）
    // - ignoreExpiration: 是否忽略 JWT 过期时间（false 表示会验证过期时间）
    // - secretOrKey: JWT 签名密钥，用于验证 JWT 的有效性
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // validate 方法：JWT 策略的核心验证逻辑
  // 当 JWT 被成功解析后，此方法会被调用进行进一步的用户验证
  async validate(payload: any) {
    // payload 参数：JWT 解码后的数据，通常包含用户 ID (sub)、过期时间等
    const user = await this.usersService.findOne(payload.sub);

    // 验证用户是否存在：如果用户不存在，抛出未授权异常
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 返回用户信息：此对象会被附加到 request.user，供后续的控制器和服务使用
    // 注意：只返回必要的用户信息，避免敏感数据泄露
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
