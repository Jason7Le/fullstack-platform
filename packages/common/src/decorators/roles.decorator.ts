import { SetMetadata } from '@nestjs/common';

/**
 * 角色元数据键
 * 用于存储角色信息的元数据键
 */
export const ROLES_KEY = 'roles';

/**
 * 角色装饰器
 * 用于在控制器/处理器上声明允许访问的角色列表
 *
 * 用法示例：
 * @Roles('admin')
 * @Get('secure')
 * findSecure() {}
 *
 * @param roles 允许访问的角色列表
 * @returns 装饰器函数
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
