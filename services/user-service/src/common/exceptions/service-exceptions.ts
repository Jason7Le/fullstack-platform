import {
  AuthenticationFailedException,
  CustomException,
  ErrorCodes,
  HttpStatus,
  TokenExpiredException,
  UserAlreadyExistsException,
  UserNotFoundException,
} from '@fullstack-platform/common';

/**
 * 服务层异常类
 * 提供业务相关的异常处理
 */
export class ServiceExceptions {
  /**
   * 用户不存在异常
   * @param userId 用户ID
   */
  static userNotFound(userId: number): UserNotFoundException {
    return new UserNotFoundException(userId);
  }

  /**
   * 用户已存在异常
   * @param email 邮箱地址
   */
  static userAlreadyExists(email: string): UserAlreadyExistsException {
    return new UserAlreadyExistsException(email);
  }

  /**
   * 认证失败异常
   */
  static authenticationFailed(): AuthenticationFailedException {
    return new AuthenticationFailedException();
  }

  /**
   * 令牌过期异常
   */
  static tokenExpired(): TokenExpiredException {
    return new TokenExpiredException();
  }

  /**
   * 数据库操作异常
   * @param operation 操作类型
   * @param details 详细信息
   */
  static databaseError(operation: string, details?: any): CustomException {
    return new CustomException(
      ErrorCodes.DATABASE_ERROR,
      `数据库操作失败: ${operation}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
    );
  }

  /**
   * 参数验证异常
   * @param field 字段名
   * @param message 错误消息
   */
  static validationError(field: string, message: string): CustomException {
    return new CustomException(
      ErrorCodes.VALIDATION_ERROR,
      `参数验证失败: ${field} - ${message}`,
      HttpStatus.BAD_REQUEST,
      { field, message },
    );
  }
}
