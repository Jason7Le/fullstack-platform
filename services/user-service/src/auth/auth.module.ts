import { Module } from '@nestjs/common'; // Nest 模块装饰器：声明当前模块的元数据
import { AuthService } from './auth.service'; // 认证服务：封装登录/注册/JWT 签发等逻辑
import { AuthController } from './auth.controller'; // 认证控制器：暴露 /auth 路由接口
import { UsersModule } from 'src/users/users.module'; // 用户模块：提供用户查询/创建等能力
import { PassportModule } from '@nestjs/passport'; // Passport 集成模块：启用策略机制（local/jwt 等）
import { JwtModule } from '@nestjs/jwt'; // JWT 模块：提供签发与验证 JWT 的能力
import { ConfigModule, ConfigService } from '@nestjs/config'; // 配置模块/服务：读取环境变量
import { LocalStrategy } from './strategies/local.strategy'; // 本地策略：基于邮箱+密码校验
import { JwtStrategy } from './strategies/jwt.strategy';
// 使用 @Module 装饰器声明模块的组成
@Module({
  // imports：导入当前模块依赖的其他模块
  imports: [
    UsersModule, // 依赖用户模块以在认证逻辑中查询/创建用户
    PassportModule.register({ defaultStrategy: 'jwt' }), // 启用 Passport 的认证策略框架
    // 异步注册 JWT 模块：从配置服务读取密钥与过期时间
    JwtModule.registerAsync({
      imports: [ConfigModule], // 依赖 ConfigModule 以便在工厂函数中注入 ConfigService
      useFactory: (configService: ConfigService) => ({
        // 工厂函数：动态生成 JWT 配置
        secret: configService.get<string>('JWT_SECRET'), // JWT 签名密钥
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'), // 令牌过期时间，默认 7 天
        },
      }),
      inject: [ConfigService], // 注入 ConfigService 到 useFactory
    }),
  ],
  // controllers：声明本模块暴露的控制器
  controllers: [AuthController],
  // providers：可注入的服务/守卫/策略等提供者
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule], // 导出认证服务、JWT模块和Passport模块供其他模块使用
})
export class AuthModule {} // 导出模块类，供应用引导或其它模块导入
