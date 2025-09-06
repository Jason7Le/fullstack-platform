import { ErrorCodes } from '../errors/error-codes.enum';
import { CustomException, HttpStatus } from './custom.exception';

export class UserNotFoundException extends CustomException {
  constructor(userId: number) {
    super(ErrorCodes.USER_NOT_FOUND, `用户 ID ${userId} 不存在`, HttpStatus.NOT_FOUND, { userId });
  }
}

export class UserAlreadyExistsException extends CustomException {
  constructor(email: string) {
    super(ErrorCodes.USER_ALREADY_EXISTS, `邮箱 ${email} 已被注册`, HttpStatus.CONFLICT, { email });
  }
}
