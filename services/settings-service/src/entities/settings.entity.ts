import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 系统设置实体
 * 用于存储系统配置的数据库表结构
 *
 * @description
 * - 使用键值对的方式存储配置
 * - 支持 JSON 格式的复杂配置值
 * - 自动维护创建和更新时间
 * - 支持配置描述信息
 */
@Entity('settings')
export class SettingsEntity {
  /** 主键 ID */
  @PrimaryGeneratedColumn()
  id: number;

  /** 配置键名，唯一标识 */
  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  /** 配置值，支持多种数据类型 */
  @Column({ type: 'text' })
  value: string;

  /** 配置描述信息（可选） */
  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;
}
