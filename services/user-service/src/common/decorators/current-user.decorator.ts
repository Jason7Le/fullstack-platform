/**
 * 当前用户装饰器
 *
 * 用于从请求中提取当前认证用户信息
 * 简化控制器中获取用户信息的代码
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 用户信息接口
 */
export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 当前用户装饰器
 * 从请求对象中提取用户信息
 *
 * @param data - 可选的用户属性名，如果指定则只返回该属性
 * @param ctx - 执行上下文
 * @returns 用户信息或指定属性
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | undefined,
    ctx: ExecutionContext,
  ): AuthenticatedUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // 如果指定了属性名，只返回该属性
    if (data) {
      return user?.[data];
    }

    // 否则返回整个用户对象
    return user;
  },
);
