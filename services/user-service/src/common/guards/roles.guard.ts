import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

// 角色守卫：基于控制器/处理器上定义的角色元数据决定是否放行
// 使用方式：在控制器/路由上配合自定义 @Roles('admin') 装饰器使用
// - @Roles 装饰器会把允许的角色写入到元数据（key: 'roles'）
// - 本守卫读取该元数据，与当前登录用户的角色进行对比
@Injectable()
export class RolesGuard implements CanActivate {
  // Reflector：用于读取类/方法上的元数据（由装饰器写入）
  constructor(private reflector: Reflector) {}

  // canActivate：守卫入口，返回 true 放行，false/抛异常则拦截
  canActivate(context: ExecutionContext): boolean {
    // 从当前处理器（方法）读取 @Roles 设置的角色数组
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    // 若未声明角色限制则默认放行（公共接口）
    if (!requiredRoles) {
      return true;
    }

    // 从 HTTP 上下文中获取 request 与已认证的用户对象（由认证策略/守卫写入）
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 未登录（无 user）直接拒绝
    if (!user) {
      throw new ForbiddenException('需要登录才能访问');
    }

    // 检查用户角色是否在允许列表中
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException('权限不足');
    }

    // 通过校验
    return true;
  }
}
