/**
 * 异常使用示例
 * 展示如何使用新的统一异常处理替换原有的异常
 */

import { ServiceExceptions } from '../../common/exceptions/service-exceptions';
import { UserServiceExceptions } from '../exceptions/user-service-exceptions';

/**
 * 示例：用户服务中的异常处理
 */
export class ExceptionUsageExample {
  /**
   * 示例1：用户创建时的异常处理
   *
   * 原有代码：
   * throw new ConflictException('用户邮箱已存在');
   *
   * 新代码：
   */
  static async createUserExample(email: string) {
    // 检查用户是否已存在
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      // 使用新的异常处理
      throw UserServiceExceptions.userAlreadyExists(email);
    }
  }

  /**
   * 示例2：用户查询时的异常处理
   *
   * 原有代码：
   * throw new NotFoundException(`用户 ID ${id} 不存在`);
   *
   * 新代码：
   */
  static async findUserExample(id: number) {
    const user = await this.findById(id);
    if (!user) {
      // 使用新的异常处理
      throw UserServiceExceptions.userNotFound(id);
    }
    return user;
  }

  /**
   * 示例3：密码验证异常处理
   *
   * 原有代码：
   * throw new BadRequestException('密码必须至少6个字符，包含字母和数字');
   *
   * 新代码：
   */
  static async validatePasswordExample(password: string) {
    if (!this.isPasswordStrong(password)) {
      // 使用新的异常处理
      throw UserServiceExceptions.weakPassword(password);
    }
  }

  /**
   * 示例4：数据库操作异常处理
   *
   * 原有代码：
   * throw new InternalServerErrorException('创建用户失败');
   *
   * 新代码：
   */
  static async databaseOperationExample() {
    try {
      // 数据库操作
      await this.performDatabaseOperation();
    } catch (error) {
      // 使用新的异常处理
      throw ServiceExceptions.databaseError('创建用户', error.message);
    }
  }

  /**
   * 示例5：参数验证异常处理
   *
   * 原有代码：
   * throw new BadRequestException('邮箱格式不正确');
   *
   * 新代码：
   */
  static async validateEmailExample(email: string) {
    if (!this.isValidEmail(email)) {
      // 使用新的异常处理
      throw UserServiceExceptions.invalidEmail(email);
    }
  }

  /**
   * 示例6：角色验证异常处理
   *
   * 新代码：
   */
  static async validateRoleExample(role: string) {
    const validRoles = ['admin', 'user', 'guest'];
    if (!validRoles.includes(role)) {
      // 使用新的异常处理
      throw UserServiceExceptions.invalidRole(role);
    }
  }

  // 辅助方法（示例）
  private static async findByEmail(email: string) {
    // 模拟数据库查询
    return null;
  }

  private static async findById(id: number) {
    // 模拟数据库查询
    return null;
  }

  private static isPasswordStrong(password: string): boolean {
    // 模拟密码强度检查
    return (
      password.length >= 6 && /[A-Za-z]/.test(password) && /\d/.test(password)
    );
  }

  private static async performDatabaseOperation() {
    // 模拟数据库操作
    throw new Error('Database connection failed');
  }

  private static isValidEmail(email: string): boolean {
    // 模拟邮箱验证
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

/**
 * 异常响应格式对比
 */
export const ExceptionResponseComparison = {
  /**
   * 原有异常响应格式
   */
  oldFormat: {
    success: false,
    statusCode: 409,
    timestamp: '2025-01-06T10:00:00.000Z',
    path: '/users',
    message: '用户邮箱已存在',
    error: 'Conflict',
  },

  /**
   * 新的统一异常响应格式
   */
  newFormat: {
    success: false,
    code: 'USER_ALREADY_EXISTS',
    message: '邮箱 user@example.com 已被注册',
    details: { email: 'user@example.com' },
    timestamp: '2025-01-06T10:00:00.000Z',
    path: '/users',
  },
};
