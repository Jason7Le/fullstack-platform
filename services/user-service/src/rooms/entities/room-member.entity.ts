import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from './room.entity';

// 房间成员实体，对应数据库表 `room_members`
@Entity('room_members')
export class RoomMember {
  // 自增主键
  @PrimaryGeneratedColumn()
  id: number;

  // 房间ID：外键关联到rooms表
  @Column()
  roomId: string;

  // 用户ID：外键关联到users表
  @Column()
  userId: number;

  // 用户邮箱：冗余字段，便于查询
  @Column()
  userEmail: string;

  // WebSocket连接ID：用于实时通信
  @Column({ nullable: true })
  socketId?: string;

  // 加入时间
  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  // 记录更新时间
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 房间关系：多对一
  @ManyToOne(() => Room, (room) => room.members, {
    onDelete: 'CASCADE', // 房间删除时，成员记录也删除
  })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  // 支持以部分属性进行快速构造并合并到实例
  constructor(partial?: Partial<RoomMember>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
