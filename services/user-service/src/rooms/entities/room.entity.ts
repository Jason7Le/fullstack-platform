import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoomMember } from './room-member.entity';

// 房间实体，对应数据库表 `rooms`
@Entity('rooms')
export class Room {
  // 自增主键，房间唯一标识
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 房间名称：唯一约束
  @Column({ unique: true })
  name: string;

  // 房间描述
  @Column({ nullable: true })
  description?: string;

  // 房主ID：外键关联到users表
  @Column()
  ownerId: number;

  // 房主邮箱：冗余字段，便于查询
  @Column()
  ownerEmail: string;

  // 是否为私有房间
  @Column({ default: false })
  isPrivate: boolean;

  // 记录创建时间
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 记录更新时间
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 房间成员关系：一对多
  @OneToMany(() => RoomMember, (member) => member.room, {
    cascade: true,
    eager: true, // 自动加载成员信息
  })
  members: RoomMember[];

  // 支持以部分属性进行快速构造并合并到实例
  constructor(partial?: Partial<Room>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
