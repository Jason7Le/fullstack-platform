import { SetMetadata } from '@nestjs/common';

// 元数据 key 常量，避免魔法字符串
export const ROLES_KEY = 'roles';

// @Roles 装饰器：用于在控制器/处理器上声明允许访问的角色列表
// 用法示例：
//   @Roles('admin')
//   @Get('secure')
//   findSecure() {}
//
// 参数说明：...roles: string[]
// - "..." 是 TypeScript 的"剩余参数（rest parameters）"语法，
//   表示可以传入 0 个或多个字符串参数（每个都是一个角色名）。
// - 这些参数会被收集为一个数组，类型为 string[]，例如：
//   调用 @Roles('admin', 'user') 时，roles 实际值为 ['admin', 'user']。
// - 这样可读性好、调用简洁，不必手动传数组。
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
