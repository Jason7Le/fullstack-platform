import { ErrorCodes } from '../errors/error-codes.enum';
import { CustomException, HttpStatus } from './custom.exception';

export class AuthenticationFailedException extends CustomException {
  constructor() {
    super(ErrorCodes.AUTH_INVALID_CREDENTIALS, '邮箱或者密码错误', HttpStatus.UNAUTHORIZED);
  }
}

export class TokenExpiredException extends CustomException {
  constructor() {
    super(ErrorCodes.AUTH_TOKEN_EXPIRED, '登录已过期，请重新登录', HttpStatus.UNAUTHORIZED);
  }
}
