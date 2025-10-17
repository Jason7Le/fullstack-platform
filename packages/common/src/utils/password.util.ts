/**
 * 密码工具类
 * 提供密码加密、验证和强度检查功能
 *
 * 使用 bcrypt 库实现密码的安全处理：
 * - 密码哈希加密：将明文密码转换为安全的哈希值
 * - 密码比较验证：安全地比较明文密码与哈希密码
 * - 密码强度验证：确保密码符合安全策略要求
 *
 * 安全特性：
 * - 使用 bcrypt 算法，提供强大的密码保护
 * - 自动生成随机盐值，防止彩虹表攻击
 * - 可配置的盐值轮数，平衡安全性与性能
 */
import * as bcrypt from 'bcrypt';

export class PasswordUtil {
  /**
   * 密码哈希加密
   * 将明文密码转换为安全的哈希值，用于安全存储
   * @param password 明文密码
   * @returns 加密后的哈希密码字符串
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10; // 盐值轮数，10轮是推荐默认值
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 密码比较验证
   * 比较用户输入的明文密码与数据库中存储的哈希密码是否匹配
   * @param plainPassword 明文密码
   * @param hashPassword 哈希密码
   * @returns true表示密码匹配，false表示不匹配
   */
  static async comparePassword(plainPassword: string, hashPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashPassword);
  }

  /**
   * 密码强度验证
   * 检查密码是否符合安全要求，确保密码足够复杂
   * @param password 待验证的密码字符串
   * @returns true表示密码强度符合要求，false表示不符合
   */
  static validatePasswordStrength(password: string): boolean {
    // 密码强度正则：至少6个字符，包含字母和数字
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
  }
}
