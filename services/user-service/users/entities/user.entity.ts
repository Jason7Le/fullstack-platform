// 创建用户实体：用于描述 users 表的结构与行为，供 TypeORM 映射
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// @Entity('users')
// 将该类映射为数据库中的表，表名为 `users`
// 若不指定表名，默认使用类名的复数或原名（取决于命名策略）
@Entity('users')
export class User {
  // @PrimaryGeneratedColumn()
  // 主键列，值由数据库自动生成（通常为自增整数）
  // - 对应列名默认是属性名 `id`
  // - 常用于唯一标识每条记录
  @PrimaryGeneratedColumn()
  id: number;

  // @Column({ unique: true })
  // 普通列，启用唯一约束：
  // - `unique: true`：数据库层面建立唯一索引，保证邮箱不重复
  // - 默认列类型根据数据库与TS类型推断为 `varchar`
  @Column({ unique: true })
  email: string;

  // @Column()
  // 存储密码的哈希值（非明文），建议：
  // - 使用强哈希算法（如 bcrypt、argon2）在业务层处理
  // - 不在实体层做明文转换
  @Column()
  passwordHash: string;

  // @Column()
  // 用户的展示名称/昵称等
  @Column()
  name: string;

  // @Column({ type: 'enum', enum: ['admin', 'user', 'guest'], default: 'user' })
  // 枚举列，限定角色取值范围，并给出默认值：
  // - `type: 'enum'`：在支持的数据库中使用枚举类型存储
  // - `enum: ['admin', 'user', 'guest']`：允许的合法值集合
  // - `default: 'user'`：默认角色为普通用户
  @Column({
    type: 'enum',
    enum: ['admin', 'user', 'guest'],
    default: 'user',
  })
  role: string;

  // @CreateDateColumn()
  // 自动填充的创建时间列：
  // - 插入记录时由数据库或ORM自动写入当前时间
  // - 不需要在应用层显式赋值
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // @UpdateDateColumn()
  // 自动维护的更新时间列：
  // - 每次更新记录时自动刷新为当前时间
  // - 便于做审计与数据变更跟踪
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
