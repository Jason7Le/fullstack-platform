import {
  CustomException,
  ErrorCodes,
  HttpStatus,
  UserAlreadyExistsException,
  UserNotFoundException,
} from '@fullstack-platform/common';

/**
 * 用户服务异常类
 * 提供用户相关的业务异常处理
 */
export class UserServiceExceptions {
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
   * 密码强度不符合要求异常
   * @param password 密码
   */
  static weakPassword(password: string): CustomException {
    return new CustomException(
      ErrorCodes.VALIDATION_ERROR,
      '密码强度不符合要求，必须包含字母和数字，至少6位',
      HttpStatus.BAD_REQUEST,
      { password: password.substring(0, 3) + '***' }, // 只显示前3位，保护隐私
    );
  }

  /**
   * 邮箱格式错误异常
   * @param email 邮箱地址
   */
  static invalidEmail(email: string): CustomException {
    return new CustomException(
      ErrorCodes.VALIDATION_ERROR,
      '邮箱格式不正确',
      HttpStatus.BAD_REQUEST,
      { email },
    );
  }

  /**
   * 用户角色无效异常
   * @param role 角色
   */
  static invalidRole(role: string): CustomException {
    return new CustomException(
      ErrorCodes.VALIDATION_ERROR,
      `无效的用户角色: ${role}`,
      HttpStatus.BAD_REQUEST,
      { role, validRoles: ['admin', 'user', 'guest'] },
    );
  }
}
