import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomMember } from './entities/room-member.entity';
import { Room } from './entities/room.entity';

export interface RoomInfo {
  id: string;
  name: string;
  ownerId: number;
  ownerEmail: string;
  createdAt: Date;
  members: Array<{
    userId: number;
    userEmail: string;
    socketId?: string;
    joinedAt: Date;
  }>;
  isPrivate: boolean;
  description?: string;
}

export interface CreateRoomData {
  name: string;
  description?: string;
  isPrivate?: boolean;
  ownerId: number;
  ownerEmail: string;
}

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomMember)
    private readonly roomMemberRepository: Repository<RoomMember>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 创建房间
   */
  async createRoom(data: CreateRoomData): Promise<RoomInfo> {
    const { name, description, isPrivate = false, ownerId, ownerEmail } = data;

    this.logger.log('创建房间请求数据:', {
      name,
      description,
      isPrivate,
      ownerId,
      ownerEmail,
    });

    // 使用数据库事务确保数据一致性
    return await this.roomRepository.manager.transaction(async (manager) => {
      try {
        // 检查房间名是否已存在
        const existingRoom = await manager.findOne(Room, {
          where: { name: name.trim() },
        });

        if (existingRoom) {
          this.logger.warn(`房间名称已存在: ${name}`);
          throw new Error('房间名称已存在');
        }

        // 创建房间
        const room = manager.create(Room, {
          name: name.trim(),
          description,
          isPrivate,
          ownerId,
          ownerEmail,
        });

        this.logger.log('创建的房间对象:', {
          name: room.name,
          description: room.description,
          isPrivate: room.isPrivate,
          ownerId: room.ownerId,
          ownerEmail: room.ownerEmail,
        });

        const savedRoom = await manager.save(Room, room);

        this.logger.log('保存的房间对象:', {
          id: savedRoom.id,
          name: savedRoom.name,
          description: savedRoom.description,
          isPrivate: savedRoom.isPrivate,
          ownerId: savedRoom.ownerId,
          ownerEmail: savedRoom.ownerEmail,
        });

        // 创建房主成员记录
        const ownerMember = manager.create(RoomMember, {
          roomId: savedRoom.id,
          userId: ownerId,
          userEmail: ownerEmail,
        });

        const savedMember = await manager.save(RoomMember, ownerMember);

        this.logger.log('保存的房主成员记录:', {
          id: savedMember.id,
          roomId: savedMember.roomId,
          userId: savedMember.userId,
          userEmail: savedMember.userEmail,
        });

        // 验证成员记录是否正确保存
        const verifyMember = await manager.findOne(RoomMember, {
          where: { roomId: savedRoom.id, userId: ownerId },
        });

        if (!verifyMember) {
          this.logger.error('房主成员记录保存失败，事务将回滚');
          throw new Error('房主成员记录保存失败');
        }

        this.logger.log('验证房主成员记录成功:', {
          id: verifyMember.id,
          roomId: verifyMember.roomId,
          userId: verifyMember.userId,
        });

        this.logger.log(
          `用户 ${ownerEmail} 创建房间: ${name} (ID: ${savedRoom.id})`,
        );

        // 重新查询房间信息，包含成员关系
        const roomWithMembers = await manager.findOne(Room, {
          where: { id: savedRoom.id },
          relations: ['members'],
        });

        if (!roomWithMembers) {
          this.logger.error(`房间创建后查询失败: ${savedRoom.id}`);
          throw new Error('房间创建失败');
        }

        this.logger.log('查询到的房间信息:', {
          id: roomWithMembers.id,
          name: roomWithMembers.name,
          membersCount: roomWithMembers.members?.length || 0,
          members:
            roomWithMembers.members?.map((m) => ({
              userId: m.userId,
              userEmail: m.userEmail,
            })) || [],
        });

        // 发出房间创建事件，通知WebSocket网关广播房间列表更新
        this.eventEmitter.emit('room.created', {
          room: this.convertToRoomInfo(roomWithMembers),
          createdBy: ownerId,
          createdByEmail: ownerEmail,
        });

        // 返回房间信息
        return this.convertToRoomInfo(roomWithMembers);
      } catch (error) {
        this.logger.error('创建房间失败:', error);
        throw error;
      }
    });
  }

  /**
   * 获取房间列表
   */
  async getRoomList(): Promise<RoomInfo[]> {
    const rooms = await this.roomRepository.find({
      relations: ['members'],
    });

    this.logger.log('getRoomList: 查询到的房间数量:', rooms.length);
    this.logger.log(
      'getRoomList: 房间详情:',
      rooms.map((room) => ({
        id: room.id,
        name: room.name,
        isPrivate: room.isPrivate,
        membersCount: room.members?.length || 0,
      })),
    );

    const roomInfos = rooms.map((room) => this.convertToRoomInfo(room));

    this.logger.log(
      'getRoomList: 转换后的房间信息:',
      roomInfos.map((room) => ({
        id: room.id,
        name: room.name,
        isPrivate: room.isPrivate,
        membersCount: room.members?.length || 0,
      })),
    );

    return roomInfos;
  }

  /**
   * 调试方法：直接查询数据库
   */
  async debugRooms(): Promise<any> {
    try {
      // 直接查询rooms表
      const rooms = await this.roomRepository.find();
      this.logger.log('debugRooms: 直接查询rooms表:', rooms);

      // 查询room_members表
      const members = await this.roomMemberRepository.find();
      this.logger.log('debugRooms: 直接查询room_members表:', members);

      // 使用原生SQL查询
      const rawRooms = await this.roomRepository.query('SELECT * FROM rooms');
      this.logger.log('debugRooms: 原生SQL查询rooms表:', rawRooms);

      const rawMembers = await this.roomMemberRepository.query(
        'SELECT * FROM room_members',
      );
      this.logger.log('debugRooms: 原生SQL查询room_members表:', rawMembers);

      return {
        rooms,
        members,
        rawRooms,
        rawMembers,
      };
    } catch (error) {
      this.logger.error('debugRooms: 查询失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取房间
   */
  async getRoomById(id: string): Promise<RoomInfo> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['members'],
    });

    if (!room) {
      throw new NotFoundException('房间不存在');
    }

    return this.convertToRoomInfo(room);
  }

  /**
   * 获取房间信息和成员状态（优化方法，减少查询次数）
   */
  async getRoomWithMemberStatus(
    roomId: string,
    userId: number,
  ): Promise<{
    room: RoomInfo | null;
    isMember: boolean;
  }> {
    // 一次性查询房间信息和成员状态
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['members'],
    });

    if (!room) {
      this.logger.warn(`房间 ${roomId} 不存在`);
      return { room: null, isMember: false };
    }

    const isMember = room.members.some((member) => member.userId === userId);

    this.logger.log(`getRoomWithMemberStatus 查询结果:`, {
      roomId,
      userId,
      roomName: room.name,
      isPrivate: room.isPrivate,
      membersCount: room.members?.length || 0,
      members:
        room.members?.map((m) => ({
          userId: m.userId,
          userEmail: m.userEmail,
        })) || [],
      isMember,
    });

    return {
      room: this.convertToRoomInfo(room),
      isMember,
    };
  }

  /**
   * 删除房间
   */
  async deleteRoom(roomId: string, userId: number): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['members'],
    });

    if (!room) {
      throw new NotFoundException('房间不存在');
    }

    if (room.ownerId !== userId) {
      throw new ForbiddenException('只有房主可以删除房间');
    }

    // 获取房间内所有成员的用户ID
    const memberUserIds = room.members.map((member) => member.userId);

    // 删除房间（会自动删除关联的成员记录，因为设置了CASCADE）
    await this.roomRepository.remove(room);

    // 发出房间删除事件，通知WebSocket踢出所有用户
    this.eventEmitter.emit('room.deleted', {
      roomId,
      roomName: room.name,
      memberUserIds,
      deletedBy: userId,
    });

    this.logger.log(
      `房间 ${room.name} (ID: ${roomId}) 已被删除，踢出 ${memberUserIds.length} 个用户`,
    );
  }

  /**
   * 添加房间成员（内部方法，供WebSocket使用）
   */
  async addRoomMember(
    roomId: string,
    userId: number,
    userEmail: string,
    socketId?: string,
  ): Promise<boolean> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
    });

    if (!room) {
      return false;
    }

    // 检查用户是否已经在房间中
    const existingMember = await this.roomMemberRepository.findOne({
      where: { roomId, userId },
    });

    if (existingMember) {
      // 更新socketId
      existingMember.socketId = socketId;
      await this.roomMemberRepository.save(existingMember);
      return true;
    }

    // 添加新成员
    const newMember = this.roomMemberRepository.create({
      roomId,
      userId,
      userEmail,
      socketId,
    });

    await this.roomMemberRepository.save(newMember);
    return true;
  }

  /**
   * 优化的添加房间成员方法（减少查询次数）
   */
  async addRoomMemberOptimized(
    roomId: string,
    userId: number,
    userEmail: string,
    socketId?: string,
    isAlreadyMember: boolean = false,
  ): Promise<boolean> {
    if (isAlreadyMember) {
      // 如果已经是成员，只需要更新socketId
      const existingMember = await this.roomMemberRepository.findOne({
        where: { roomId, userId },
      });

      if (existingMember) {
        existingMember.socketId = socketId;
        await this.roomMemberRepository.save(existingMember);
        return true;
      }
    } else {
      // 如果不是成员，添加新成员
      const newMember = this.roomMemberRepository.create({
        roomId,
        userId,
        userEmail,
        socketId,
      });

      await this.roomMemberRepository.save(newMember);
      return true;
    }

    return false;
  }

  /**
   * 移除房间成员（内部方法，供WebSocket使用）
   */
  async removeRoomMember(roomId: string, userId: number): Promise<boolean> {
    const member = await this.roomMemberRepository.findOne({
      where: { roomId, userId },
    });

    if (!member) {
      return false;
    }

    // 检查用户是否是房主
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
    });

    if (!room) {
      this.logger.warn(`房间 ${roomId} 不存在，无法移除成员`);
      return false;
    }

    // 房主不能从房间中移除，只能更新socketId为null
    if (room.ownerId === userId) {
      this.logger.log(
        `用户 ${userId} 是房主，只更新socketId为null，不从房间中移除`,
      );
      member.socketId = undefined;
      await this.roomMemberRepository.save(member);
      return true;
    }

    // 非房主用户可以从房间中移除
    await this.roomMemberRepository.remove(member);

    // 检查房间是否还有其他成员
    const remainingMembers = await this.roomMemberRepository.count({
      where: { roomId },
    });

    // 如果房间没有成员了，删除房间
    if (remainingMembers === 0) {
      await this.roomRepository.remove(room);
      this.logger.log(`房间 ${roomId} 已无成员，自动删除房间`);

      // 发射房间删除事件，通知WebSocket网关
      this.eventEmitter.emit('room.deleted', {
        roomId: room.id,
        roomName: room.name,
        memberUserIds: [], // 已经没有成员了
        deletedBy: userId,
      });
    }

    return true;
  }

  /**
   * 获取房间成员列表（内部方法，供WebSocket使用）
   */
  async getRoomMembers(
    roomId: string,
  ): Promise<Array<{ userId: number; userEmail: string; socketId?: string }>> {
    const members = await this.roomMemberRepository.find({
      where: { roomId },
    });

    return members.map((member) => ({
      userId: member.userId,
      userEmail: member.userEmail,
      socketId: member.socketId,
    }));
  }

  /**
   * 转让房主权限（内部方法，供WebSocket使用）
   */
  async transferOwnership(
    roomId: string,
    newOwnerId: number,
    newOwnerEmail: string,
  ): Promise<boolean> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
    });

    if (!room) {
      return false;
    }

    room.ownerId = newOwnerId;
    room.ownerEmail = newOwnerEmail;
    await this.roomRepository.save(room);
    return true;
  }

  /**
   * 获取用户所在的所有房间
   */
  async getUserRooms(userId: number): Promise<RoomInfo[]> {
    try {
      const rooms = await this.roomRepository.find({
        where: {
          members: {
            userId: userId,
          },
        },
        relations: ['members'],
      });

      return rooms.map((room) => this.convertToRoomInfo(room));
    } catch (error) {
      this.logger.error(`获取用户 ${userId} 的房间列表失败:`, error);
      return [];
    }
  }

  /**
   * 将Room实体转换为RoomInfo接口
   */
  private convertToRoomInfo(room: Room): RoomInfo {
    return {
      id: room.id,
      name: room.name,
      ownerId: room.ownerId,
      ownerEmail: room.ownerEmail,
      createdAt: room.createdAt,
      members:
        room.members?.map((member) => ({
          userId: member.userId,
          userEmail: member.userEmail,
          socketId: member.socketId,
          joinedAt: member.joinedAt,
        })) || [],
      isPrivate: room.isPrivate,
      description: room.description,
    };
  }
}
