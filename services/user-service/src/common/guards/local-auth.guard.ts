import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 本地认证守卫
 * 验证用户名和密码
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
