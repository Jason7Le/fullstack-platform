import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: number;

  /**
   * 用户邮箱地址
   * - 用户的登录标识和联系方式
   * - 用于显示用户信息，但不包含密码等敏感数据
   * - @Expose() 确保此字段在序列化时被包含
   */
  @Expose()
  email: string;

  /**
   * 用户姓名/昵称
   * - 用于界面显示和用户识别
   * - 在用户列表、个人资料等场景中展示
   * - @Expose() 确保此字段在序列化时被包含
   */
  @Expose()
  name: string;

  /**
   * 用户角色
   * - 定义用户的权限级别和访问范围
   * - 可能的值：'admin'(管理员)、'user'(普通用户)、'guest'(访客)
   * - 前端可根据角色显示不同的功能菜单和权限
   * - @Expose() 确保此字段在序列化时被包含
   */
  @Expose()
  role: string;

  /**
   * 用户创建时间
   * - 记录用户注册/创建的时间戳
   * - 用于显示用户注册时间、计算用户年龄等
   * - 格式：ISO 8601 标准日期时间格式
   * - @Expose() 确保此字段在序列化时被包含
   */
  @Expose()
  createdAt: Date;

  /**
   * 用户信息最后更新时间
   * - 记录用户信息最后一次修改的时间戳
   * - 用于判断用户信息的时效性、缓存策略等
   * - 格式：ISO 8601 标准日期时间格式
   * - @Expose() 确保此字段在序列化时被包含
   */
  @Expose()
  updatedAt: Date;

  /**
   * 是否为管理员
   * - 布尔值，表示用户是否具有管理员权限
   * - 前端可根据此字段显示/隐藏管理功能
   * - 通常与 role 字段配合使用，提供更直观的权限判断
   * - @Expose() 确保此字段在序列化时被包含
   */
  @Expose()
  isAdmin: boolean;

  /**
   * 构造函数
   * 支持使用部分属性快速创建 UserResponseDto 实例
   *
   * @param partial - 部分用户属性，用于从现有用户对象创建响应 DTO
   *
   * 使用示例：
   * const userResponse = new UserResponseDto({
   *   id: 1,
   *   email: 'user@example.com',
   *   name: '张三'
   * });
   */
  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
