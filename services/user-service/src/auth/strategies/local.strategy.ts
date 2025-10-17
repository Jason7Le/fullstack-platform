import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

// 实现本地策略（用户名 + 密码 登录）
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  // constructor：构造函数，用于注入依赖并完成父类初始化
  // private authService: AuthService 表示将依赖注入的实例保存为类的私有属性
  constructor(private authService: AuthService) {
    // super：调用父类 PassportStrategy 的构造函数，传入策略配置
    // - usernameField: 指定使用请求体中的哪个字段作为用户名（默认是 username，这里改为 email）
    // - 还可以在此传入 passwordField、自定义回调等配置

    super({
      usernameField: 'email',
    });
  }

  // validate：当本地策略被触发时，框架会调用此方法进行用户校验
  // 参数顺序需与上面配置一致（email 作为用户名字段）
  async validate(email: string, password: string): Promise<any> {
    // 调用业务服务校验账号密码是否合法
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      // 校验失败抛出未授权异常，框架会返回 401
      throw new UnauthorizedException('邮箱或者密码错误');
    }
    // 返回的对象会被附加到 request.user，供后续守卫/控制器使用
    return user;
  }
}
