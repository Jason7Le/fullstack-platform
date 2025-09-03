/**
 * 密码工具类 - 提供密码加密、验证和强度检查功能
 * 
 * 本工具类使用 bcrypt 库实现密码的安全处理，包括：
 * 1. 密码哈希加密 - 将明文密码转换为安全的哈希值
 * 2. 密码比较验证 - 安全地比较明文密码与哈希密码
 * 3. 密码强度验证 - 确保密码符合安全策略要求
 * 
 * 安全特性：
 * - 使用 bcrypt 算法，提供强大的密码保护
 * - 自动生成随机盐值，防止彩虹表攻击
 * - 可配置的盐值轮数，平衡安全性与性能
 */
import * as bcrypt from 'bcrypt';

/**
 * 密码工具类
 * 提供密码相关的安全操作，包括哈希加密、密码比较和强度验证
 * 
 * 使用场景：
 * - 用户注册时：hashPassword() 加密存储密码
 * - 用户登录时：comparePassword() 验证密码正确性
 * - 密码修改时：validatePasswordStrength() 检查新密码强度
 */
export class PasswordUtil {
  /**
   * 密码哈希加密
   * 将明文密码转换为安全的哈希值，用于安全存储
   *
   * 工作原理：
   * 1. 接收用户输入的明文密码
   * 2. 使用 bcrypt 算法生成随机盐值
   * 3. 将密码与盐值进行多轮哈希计算
   * 4. 返回包含盐值的完整哈希字符串
   *
   * 安全优势：
   * - 即使数据库被泄露，攻击者也无法直接获得原始密码
   * - 每次加密都会生成不同的盐值，相同密码的哈希值也不同
   * - 可配置的轮数可以随着计算能力提升而增加
   *
   * @param password - 明文密码，用户输入的原始密码
   * @returns Promise<string> - 返回加密后的哈希密码字符串
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10; // 盐值轮数，数值越高安全性越强但性能越低
    // 10 轮是 bcrypt 的推荐默认值，在安全性和性能间取得良好平衡
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 密码比较验证
   * 比较用户输入的明文密码与数据库中存储的哈希密码是否匹配
   *
   * 工作原理：
   * 1. 从哈希字符串中提取盐值
   * 2. 使用相同的盐值对输入的明文密码进行哈希计算
   * 3. 比较计算结果与存储的哈希值是否一致
   * 4. 返回比较结果
   *
   * 安全特性：
   * - 使用时间安全的比较算法，防止时序攻击
   * - 不会泄露密码的任何信息
   * - 支持不同盐值轮数生成的哈希值比较
   *
   * @param plainPassword - 明文密码，用户登录时输入的密码
   * @param hashPassword - 哈希密码，数据库中存储的加密密码
   * @returns Promise<boolean> - 返回true表示密码匹配，false表示不匹配
   */
  static async comparePassword(
    plainPassword: string,
    hashPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashPassword);
  }

  /**
   * 密码强度验证
   * 检查密码是否符合安全要求，确保密码足够复杂
   *
   * 验证规则说明：
   * - 长度要求：至少6个字符（符合 bcrypt 最小长度要求）
   * - 复杂度要求：必须包含字母和数字的组合
   * - 正则表达式：/^(?=.*[A-Za-z])(?=.*\d).{6,}$/
   *   * (?=.*[A-Za-z]) - 正向预查，确保包含至少一个字母
   *   * (?=.*\d) - 正向预查，确保包含至少一个数字
   *   * .{6,} - 至少6个任意字符
   *
   * 安全建议：
   * - 建议用户使用更复杂的密码（如包含特殊字符）
   * - 可以考虑增加最小长度要求（如8个字符）
   * - 可以添加密码黑名单检查，防止常见弱密码
   *
   * @param password - 待验证的密码字符串
   * @returns boolean - 返回true表示密码强度符合要求，false表示不符合
   */
  static validatePasswordStrength(password: string): boolean {
    // 密码强度正则表达式：至少6个字符，包含字母和数字
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
  }
}
