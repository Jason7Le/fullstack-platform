import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT认证守卫
 * 验证请求中的JWT token是否有效
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
