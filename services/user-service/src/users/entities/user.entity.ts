import { Exclude } from 'class-transformer';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// 用户实体，对应数据库表 `users`
@Entity('users')
export class User {
  // 自增主键，用户唯一标识
  @PrimaryGeneratedColumn()
  id: number;

  // 用户邮箱：唯一约束，用于登录/找回密码等
  // 校验：必须为合法邮箱格式
  @Column({ unique: true })
  @IsEmail()
  email: string;

  // 密码哈希（而不是明文密码）
  // @Exclude：序列化为 JSON 时自动排除，避免返回给客户端
  @Column()
  @Exclude()
  passwordHash: string;

  // 用户显示名称
  // 校验：必须为字符串，且最少 2 个字符
  @Column()
  @IsString()
  @MinLength(2, { message: '姓名至少需要2个字符' })
  name: string;

  // 角色枚举：'admin' | 'user' | 'guest'，默认 'user'
  // 可用于权限控制
  @Column({
    type: 'enum',
    enum: ['admin', 'user', 'guest'],
    default: 'user',
  })
  @IsEnum(['admin', 'user', 'guest'])
  role: string;

  // 记录创建时间，由数据库/ORM 自动填充
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 记录创建时间，由数据库/ORM 自动填充
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  // 便捷方法：判断当前用户是否为管理员
  isAdmin(): boolean {
    return this.role === 'admin';
  }

  // 刷新token
  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  // 刷新token过期时间
  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  refreshTokenExpiry: Date;

  // 支持以部分属性进行快速构造并合并到实例
  constructor(partial?: Partial<User>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
