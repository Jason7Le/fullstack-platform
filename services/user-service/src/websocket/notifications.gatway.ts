import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';

/**
 * 客户端数据类型定义
 * 存储WebSocket连接中的用户信息
 */
interface ClientData {
  userId?: number; // 用户ID
  userEmail?: string; // 用户邮箱
}

// 房间信息接口
interface RoomInfo {
  id: string;
  name: string;
  ownerId: number;
  ownerEmail: string;
  createdAt: Date;
  members: Array<{
    userId: number;
    userEmail: string;
    socketId: string;
    joinedAt: Date;
  }>;
  isPrivate: boolean;
  description?: string;
}

// 房间申请接口
interface RoomApplication {
  id: string;
  roomId: string;
  applicantId: number;
  applicantEmail: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  processedAt?: Date;
  processedBy?: number;
}

/**
 * WebSocket 通知网关
 *
 * 提供实时通知功能，包括：
 * - 用户连接管理和认证
 * - 在线用户状态跟踪
 * - 实时消息推送
 * - 房间管理和广播功能
 *
 * 使用 Socket.IO 实现 WebSocket 通信
 * 支持 JWT 认证和跨域访问
 */
@WebSocketGateway({
  namespace: 'notifications', // WebSocket 命名空间，用于区分不同的 WebSocket 服务
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001', // 允许访问此WebSocket服务器的前端地址
    credentials: true, // 允许携带认证信息（如 cookies）
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  /**
   * WebSocket 服务器实例
   * 通过 @WebSocketServer() 装饰器自动注入
   * 用于管理所有 WebSocket 连接和消息发送
   */
  @WebSocketServer()
  server: Server;

  /**
   * 日志记录器
   * 用于记录 WebSocket 相关的操作日志
   */
  private readonly logger = new Logger(NotificationsGateway.name);

  /**
   * 在线用户映射表
   * 键：用户ID，值：Socket连接ID
   * 用于快速查找用户的 WebSocket 连接
   */
  private readonly connectedUsers = new Map<number, string>();

  /**
   * 房间信息映射表
   * 键：房间ID，值：房间信息
   */
  private readonly rooms = new Map<string, RoomInfo>();

  /**
   * 房间申请映射表
   * 键：申请ID，值：申请信息
   */
  private readonly roomApplications = new Map<string, RoomApplication>();

  /**
   * 构造函数
   * 注入 JWT 服务用于用户认证和房间服务
   *
   * @param jwtService - JWT 服务实例
   * @param roomsService - 房间服务实例
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly roomsService: RoomsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * WebSocket 服务器初始化完成后的回调
   * 在服务器启动后自动调用，设置事件监听器
   */
  afterInit() {
    this.logger.log('WebSocket 服务器初始化完成');

    // 监听房间创建事件
    this.eventEmitter.on(
      'room.created',
      (data: { room: any; createdBy: number; createdByEmail: string }) => {
        void this.handleRoomCreated(data);
      },
    );

    // 监听房间删除事件
    this.eventEmitter.on(
      'room.deleted',
      (data: {
        roomId: string;
        roomName: string;
        memberUserIds: number[];
        deletedBy: number;
      }) => {
        void this.handleRoomDeleted(data);
      },
    );
  }

  /**
   * 处理客户端连接
   * 当客户端建立 WebSocket 连接时调用
   * 包含用户认证和连接管理逻辑
   *
   * @param client - 客户端 Socket 连接实例
   */
  handleConnection(client: Socket) {
    // 从客户端握手信息中获取认证令牌
    // 优先从 auth.token 获取，其次从 headers.authorization 获取
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.headers?.authorization as string);

    try {
      // 如果没有提供令牌，拒绝连接
      if (!token) {
        this.logger.warn('客户端连接被拒绝：未提供认证令牌');
        client.disconnect();
        return;
      }

      // 验证 JWT 令牌并解析用户信息
      const cleanToken = token.replace('Bearer ', '');

      let payload: { sub: number; email: string };
      try {
        // 使用与JWT策略相同的配置进行验证
        const rawPayload = this.jwtService.verify(cleanToken, {
          secret:
            process.env.JWT_SECRET ||
            'your-super-secret-jwt-key-here-please-change-in-production',
        }) as unknown;

        // 类型检查
        if (
          !rawPayload ||
          typeof rawPayload !== 'object' ||
          !('sub' in rawPayload) ||
          !('email' in rawPayload)
        ) {
          this.logger.error('无效的JWT载荷:', rawPayload);
          throw new Error('认证失败');
        }

        payload = rawPayload as { sub: number; email: string };
      } catch (error) {
        this.logger.error('JWT验证失败:', error);
        throw new Error('认证失败');
      }

      const { sub, email } = payload;

      // 将用户信息存储到客户端数据中
      (client.data as ClientData).userId = sub; // 用户ID
      (client.data as ClientData).userEmail = email; // 用户邮箱

      // 检查用户是否已经有活跃连接
      const existingSocketId = this.connectedUsers.get(sub);
      if (existingSocketId) {
        // 断开旧连接
        const oldSocket = this.server.sockets.sockets.get(existingSocketId);
        if (oldSocket) {
          oldSocket.disconnect();
        }
      }

      // 将用户连接信息存储到映射表中
      this.connectedUsers.set(sub, client.id);

      // 将用户加入到个人房间，便于后续定向推送
      void client.join(`user_${sub}`);

      // 向客户端发送连接成功确认消息
      client.emit('connected', {
        message: 'WebSocket 连接成功',
        userId: sub,
        timestamp: new Date().toISOString(),
      });

      // 广播更新后的在线用户数量给所有用户
      this.broadcastOnlineUserCount();
    } catch (error: unknown) {
      // 认证失败，记录错误并断开连接
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.logger.error('WebSocket 连接认证失败:', {
        error: errorMessage,
        tokenLength: token?.length || 0,
        hasAuthToken: !!client.handshake.auth?.token,
        hasHeaderAuth: !!client.handshake.headers?.authorization,
        authToken: client.handshake.auth?.token
          ? String(client.handshake.auth.token).substring(0, 20) + '...'
          : 'none',
        headerAuth: client.handshake.headers?.authorization
          ? String(client.handshake.headers.authorization).substring(0, 20) +
            '...'
          : 'none',
      });
      client.emit('error', {
        message: `认证失败: ${errorMessage}`,
        code: 'AUTH_FAILED',
        timestamp: new Date().toISOString(),
      });
      client.disconnect();
    }
  }

  /**
   * 处理客户端断开连接
   * 当客户端断开 WebSocket 连接时调用
   * 清理用户连接信息
   *
   * @param client - 客户端 Socket 连接实例
   */
  handleDisconnect(client: Socket) {
    try {
      const userId = (client.data as ClientData).userId;
      const userEmail = (client.data as ClientData).userEmail;

      this.logger.log(
        `收到断开连接事件，用户ID: ${userId}, 邮箱: ${userEmail}`,
      );

      if (userId) {
        // 从在线用户映射表中移除用户
        const wasRemoved = this.connectedUsers.delete(userId);
        this.logger.log(
          `用户断开连接：${userEmail} (ID: ${userId}), 移除结果: ${wasRemoved}`,
        );
        this.logger.log(`当前在线用户数量: ${this.connectedUsers.size}`);

        // 从所有房间中移除用户
        this.removeUserFromAllRooms(userId, userEmail || 'unknown');

        // 立即广播更新后的在线用户数量给所有用户
        this.broadcastOnlineUserCount();

        // 额外延迟广播一次，确保所有客户端都收到更新
        setTimeout(() => {
          this.broadcastOnlineUserCount();
        }, 100);
      } else {
        this.logger.warn('收到断开连接事件，但用户ID为空');
      }
    } catch (error) {
      this.logger.error('处理用户断开连接时发生错误:', error);
    }
  }

  /**
   * 处理获取在线用户列表的请求
   * 客户端发送 'get_online_users' 消息时调用
   *
   * @param client - 发送请求的客户端 Socket 连接
   */
  @SubscribeMessage('get_online_users')
  handleGetOnlineUsers(client: Socket) {
    // 将在线用户映射表转换为数组格式
    const onlineUsers = Array.from(this.connectedUsers.entries()).map(
      ([userId, socketId]) => ({
        userId,
        socketId,
        isOnline: true,
      }),
    );

    // 向请求的客户端发送在线用户列表
    client.emit('online_users', {
      users: onlineUsers,
      count: onlineUsers.length,
      timestamp: new Date().toISOString(),
    });

    const userEmail = (client.data as ClientData).userEmail;
    this.logger.log(
      `用户 ${userEmail} 请求在线用户列表，当前在线 ${onlineUsers.length} 人`,
    );
  }

  /**
   * 广播在线用户数量给所有连接的用户
   * 当用户登录或登出时调用，更新所有客户端的在线人数显示
   */
  broadcastOnlineUserCount() {
    try {
      const onlineUsers = Array.from(this.connectedUsers.entries()).map(
        ([userId, socketId]) => ({
          userId,
          socketId,
          isOnline: true,
        }),
      );

      // 向所有连接的客户端广播在线用户列表
      this.server.emit('online_users', {
        users: onlineUsers,
        count: onlineUsers.length,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`广播在线用户数量: ${onlineUsers.length} 人`);
    } catch (error) {
      this.logger.error('广播在线用户数量失败:', error);
    }
  }

  /**
   * 向指定用户发送消息
   * 根据用户ID查找对应的Socket连接并发送消息
   *
   * @param userId - 目标用户ID
   * @param event - 事件名称
   * @param data - 要发送的数据
   * @returns 是否发送成功
   */
  sendToUser(userId: number, event: string, data: any): boolean {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
      this.logger.log(`向用户 ${userId} 发送消息: ${event}`);
      return true;
    } else {
      this.logger.warn(`用户 ${userId} 不在线，无法发送消息: ${event}`);
      return false;
    }
  }

  /**
   * 向所有连接的客户端广播消息
   * 用于系统通知、公告等全局消息
   *
   * @param event - 事件名称
   * @param data - 要广播的数据
   */
  broadcast(event: string, data: any): void {
    this.server.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(
      `广播消息: ${event}，当前在线 ${this.connectedUsers.size} 人`,
    );
  }

  /**
   * 向指定房间发送消息
   * 用于群组消息、频道消息等场景
   *
   * @param room - 房间名称
   * @param event - 事件名称
   * @param data - 要发送的数据
   */
  sendToRoom(room: string, event: string, data: any): void {
    this.server.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 获取当前在线用户数量
   *
   * @returns 在线用户数量
   */
  getOnlineUserCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * 检查指定用户是否在线
   *
   * @param userId - 用户ID
   * @returns 是否在线
   */
  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * 获取所有在线用户的ID列表
   *
   * @returns 在线用户ID数组
   */
  getOnlineUserIds(): number[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * 处理用户加入房间的请求
   * 客户端发送 'join_room' 消息时调用
   *
   * @param client - 发送请求的客户端 Socket 连接
   * @param payload - 包含房间ID的数据
   */
  @SubscribeMessage('join_room')
  async handleJoinRoom(client: Socket, payload: { roomId: string }) {
    const userId = (client.data as ClientData).userId;
    const userEmail = (client.data as ClientData).userEmail;
    const roomId = payload.roomId;

    debugger;
    if (!roomId) {
      client.emit('error', {
        message: '房间ID不能为空',
        code: 'INVALID_ROOM_ID',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!userId || !userEmail) {
      client.emit('error', {
        message: '用户信息不完整',
        code: 'INVALID_USER',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      // 一次性获取房间信息和成员状态，减少查询次数
      const roomInfo = await this.roomsService.getRoomWithMemberStatus(
        roomId,
        userId,
      );

      this.logger.log(`用户 ${userEmail} 尝试加入房间 ${roomId}:`, {
        roomExists: !!roomInfo.room,
        roomName: roomInfo.room?.name,
        isPrivate: roomInfo.room?.isPrivate,
        isMember: roomInfo.isMember,
        membersCount: roomInfo.room?.members?.length || 0,
      });

      if (!roomInfo.room) {
        client.emit('error', {
          message: '房间不存在',
          code: 'ROOM_NOT_FOUND',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      this.logger.log('roomInfo.room.isPrivate---', roomInfo.room.isPrivate);
      this.logger.log('roomInfo.isMember---', roomInfo.isMember);

      // 对于私有房间，只有成员才能加入
      if (roomInfo.room.isPrivate && !roomInfo.isMember) {
        this.logger.warn(
          `用户 ${userEmail} 被拒绝加入私有房间 ${roomId}: 不是成员`,
        );
        client.emit('error', {
          message: '您不是该房间的成员',
          code: 'NOT_MEMBER',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 对于公开房间，允许任何人加入（即使不是成员）
      if (!roomInfo.room.isPrivate) {
        this.logger.log(
          `用户 ${userEmail} 加入公开房间 ${roomId}: ${roomInfo.room.name}`,
        );
      }

      // 添加用户到房间
      let success = true;
      if (roomInfo.isMember) {
        // 如果已经是成员，只需要更新socketId
        success = await this.roomsService.addRoomMemberOptimized(
          roomId,
          userId,
          userEmail,
          client.id,
          true, // isAlreadyMember = true
        );
      } else {
        // 如果不是成员，添加新成员（公开房间允许任何人加入）
        success = await this.roomsService.addRoomMemberOptimized(
          roomId,
          userId,
          userEmail,
          client.id,
          false, // isAlreadyMember = false
        );
      }

      if (!success) {
        client.emit('error', {
          message: '加入房间失败',
          code: 'JOIN_FAILED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 加入Socket.IO房间
      await client.join(roomId);

      if (roomInfo.isMember) {
        this.logger.log(
          `用户 ${userEmail} (ID: ${userId}) 重新连接房间: ${roomInfo.room.name} (ID: ${roomId})`,
        );
      } else {
        this.logger.log(
          `用户 ${userEmail} (ID: ${userId}) 加入房间: ${roomInfo.room.name} (ID: ${roomId})`,
        );

        // 向房间内其他用户广播新用户加入
        client.to(roomId).emit('user_joined_room', {
          userId,
          userEmail,
          room: roomId,
          roomName: roomInfo.room.name,
          timestamp: new Date().toISOString(),
        });
      }

      // 向当前用户确认加入成功
      client.emit('room_joined', {
        room: roomId,
        roomName: roomInfo.room.name,
        message: roomInfo.isMember
          ? `重新连接到房间: ${roomInfo.room.name}`
          : `成功加入房间: ${roomInfo.room.name}`,
        timestamp: new Date().toISOString(),
      });

      // 延迟发送房间成员列表，确保Socket.IO adapter已准备好
      setTimeout(() => {
        try {
          this.sendRoomMembers(client, roomId);
        } catch (error) {
          this.logger.error(`发送房间 ${roomId} 成员列表失败:`, error);
        }
      }, 1000); // 增加延迟时间到1000ms

      // 广播房间列表更新（更新在线人数）
      await this.broadcastRoomListUpdate(roomId);
    } catch (error) {
      this.logger.error(`用户 ${userEmail} 加入房间失败:`, error);
      client.emit('error', {
        message: '房间不存在',
        code: 'ROOM_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 处理用户离开房间的请求
   * 客户端发送 'leave_room' 消息时调用
   *
   * @param client - 发送请求的客户端 Socket 连接
   * @param payload - 包含房间名称的数据
   */
  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    client: Socket,
    payload: {
      roomId: string;
      isOwner?: boolean;
      userId?: number;
      memberCount?: number;
    },
  ) {
    const userId = payload.userId || (client.data as ClientData).userId;
    const userEmail = (client.data as ClientData).userEmail;
    const roomId = payload.roomId;

    if (!roomId) {
      client.emit('error', {
        message: '房间ID不能为空',
        code: 'INVALID_ROOM_ID',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!userId) {
      client.emit('error', {
        message: '用户ID不能为空',
        code: 'INVALID_USER_ID',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      // 检查房间是否存在（前端已经处理了权限检查）
      const room = await this.roomsService.getRoomById(roomId);
      if (!room) {
        client.emit('error', {
          message: '房间不存在',
          code: 'ROOM_NOT_FOUND',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 使用前端传递的房主信息，如果没有传递则从房间数据计算
      const isOwner =
        payload.isOwner !== undefined
          ? payload.isOwner
          : room.ownerId === userId;

      if (isOwner) {
        // 使用前端传递的成员数量，如果没有则查询数据库
        const memberCount =
          payload.memberCount ||
          (await this.roomsService.getRoomMembers(roomId)).length;

        if (memberCount === 1) {
          // 房间只有房主一人，销毁房间
          await this.roomsService.deleteRoom(roomId, userId);

          // 通知房间内所有成员房间被销毁
          this.server.to(roomId).emit('room_destroyed', {
            room: { id: roomId, name: room.name },
            message: '房主离开，房间已被销毁',
            timestamp: new Date().toISOString(),
          });
        } else {
          // 房间还有其他成员，转让房主权限给第一个成员
          const members = await this.roomsService.getRoomMembers(roomId);
          const newOwner = members.find((member) => member.userId !== userId);
          if (newOwner) {
            await this.roomsService.transferOwnership(
              roomId,
              newOwner.userId,
              newOwner.userEmail,
            );

            // 通知房间内所有成员房主变更
            this.server.to(roomId).emit('room_ownership_transferred', {
              room: { id: roomId, name: room.name },
              oldOwner: { userId, userEmail },
              newOwner: {
                userId: newOwner.userId,
                userEmail: newOwner.userEmail,
              },
              message: `房主权限已转让给 ${newOwner.userEmail}`,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      // 从房间中移除用户
      await this.roomsService.removeRoomMember(roomId, userId);

      // 离开Socket.IO房间
      await client.leave(roomId);

      this.logger.log(
        `用户 ${userEmail} (ID: ${userId}) 离开房间: ${room.name} (ID: ${roomId})`,
      );

      // 向房间内其他用户广播用户离开
      client.to(roomId).emit('user_left_room', {
        userId,
        userEmail,
        room: roomId,
        roomName: room.name,
        timestamp: new Date().toISOString(),
      });

      // 向当前用户确认离开成功
      client.emit('room_left', {
        room: roomId,
        roomName: room.name,
        message: `成功离开房间: ${room.name}`,
        timestamp: new Date().toISOString(),
      });

      // 静默广播房间列表更新（不显示消息提示）
      await this.broadcastRoomListUpdateSilent(roomId);
    } catch (error) {
      this.logger.error(`用户 ${userEmail} 离开房间失败:`, error);
      client.emit('error', {
        message: '房间不存在',
        code: 'ROOM_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 处理获取房间成员列表的请求
   * 客户端发送 'get_room_members' 消息时调用
   *
   * @param client - 发送请求的客户端 Socket 连接
   * @param payload - 包含房间名称的数据
   */
  @SubscribeMessage('get_room_members')
  handleGetRoomMembers(client: Socket, payload: { room: string }) {
    this.sendRoomMembers(client, payload.room);
  }

  /**
   * 发送房间成员列表给客户端
   *
   * @param client - 目标客户端
   * @param room - 房间名称
   */
  private sendRoomMembers(client: Socket, room: string, retryCount = 0) {
    if (!room) {
      client.emit('error', {
        message: '房间名称不能为空',
        code: 'INVALID_ROOM',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    this.logger.debug(
      `尝试发送房间 ${room} 的成员列表，重试次数: ${retryCount}`,
    );

    // 获取房间内的所有Socket连接
    const adapter = this.server.sockets.adapter;
    if (!adapter) {
      this.logger.warn(`Socket.IO adapter 不可用，重试次数: ${retryCount}`);

      // 如果重试次数少于3次，延迟重试
      if (retryCount < 3) {
        setTimeout(
          () => {
            this.sendRoomMembers(client, room, retryCount + 1);
          },
          500 * (retryCount + 1), // 递增延迟，从500ms开始
        );
        return;
      }

      // 超过重试次数，发送简化的成员列表
      this.logger.warn(`Socket.IO adapter 持续不可用，发送简化成员列表`);
      this.sendSimplifiedRoomMembers(client, room);
      return;
    }

    try {
      // 检查客户端是否在房间中
      const clientRooms = Array.from(client.rooms);
      this.logger.debug(
        `客户端 ${client.id} 当前在房间: ${clientRooms.join(', ')}`,
      );

      const roomSockets = adapter.rooms.get(room);
      const members: Array<{
        userId: number;
        userEmail: string;
        socketId: string;
      }> = [];

      this.logger.debug(
        `获取房间 ${room} 的Socket连接，找到 ${roomSockets?.size || 0} 个连接`,
      );

      if (roomSockets) {
        for (const socketId of roomSockets) {
          const socket = this.server.sockets.sockets.get(socketId);
          if (socket) {
            const userId = (socket.data as ClientData).userId;
            const userEmail = (socket.data as ClientData).userEmail;
            if (userId && userEmail) {
              members.push({ userId, userEmail, socketId });
            }
          }
        }
      }

      client.emit('room_members', {
        room,
        members,
        count: members.length,
        timestamp: new Date().toISOString(),
      });

      const userEmail = (client.data as ClientData).userEmail;
      this.logger.log(
        `用户 ${userEmail} 请求房间 ${room} 成员列表，当前成员 ${members.length} 人`,
      );
    } catch (error) {
      this.logger.error(`发送房间 ${room} 成员列表失败:`, error);
      client.emit('error', {
        message: '获取房间成员列表失败',
        code: 'GET_MEMBERS_FAILED',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 获取房间成员数量
   *
   * @param room - 房间名称
   * @returns 房间成员数量
   */

  /**
   * 发送简化的房间成员列表（当Socket.IO adapter不可用时）
   *
   * @param client - 目标客户端
   * @param room - 房间名称
   */
  private sendSimplifiedRoomMembers(client: Socket, room: string) {
    try {
      const userId = (client.data as ClientData).userId;
      const userEmail = (client.data as ClientData).userEmail;

      // 发送简化的成员列表，只包含当前用户
      const members: Array<{
        userId: number;
        userEmail: string;
        socketId: string;
      }> = [];
      if (userId && userEmail) {
        members.push({
          userId,
          userEmail,
          socketId: client.id,
        });
      }

      client.emit('room_members', {
        room,
        members,
        count: members.length,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `发送简化房间 ${room} 成员列表，当前成员 ${members.length} 人`,
      );
    } catch (error) {
      this.logger.error(`发送简化房间 ${room} 成员列表失败:`, error);
      client.emit('error', {
        message: '获取房间成员列表失败',
        code: 'GET_MEMBERS_FAILED',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 从所有房间中移除用户（用户断开连接时调用）
   *
   * @param userId - 用户ID
   * @param userEmail - 用户邮箱
   */
  private removeUserFromAllRooms(userId: number, userEmail: string) {
    // 异步处理，不阻塞断开连接流程
    this.roomsService
      .getUserRooms(userId)
      .then((userRooms: any[]) => {
        if (userRooms.length === 0) {
          return;
        }

        // 从每个房间中移除用户
        return Promise.all(
          userRooms.map(async (room: any) => {
            try {
              // 从数据库中移除用户
              await this.roomsService.removeRoomMember(room.id, userId);

              // 静默广播房间列表更新（用户断开连接时不显示消息提示）
              await this.broadcastRoomListUpdateSilent(room.id);
            } catch (error) {
              this.logger.error(
                `从房间 ${room.name} 移除用户 ${userEmail} 失败:`,
                error,
              );
            }
          }),
        );
      })
      .catch((error) => {
        this.logger.error(`移除用户 ${userEmail} 从所有房间失败:`, error);
      });
  }

  /**
   * 检查用户是否在指定房间中
   *
   * @param userId - 用户ID
   * @param room - 房间名称
   * @returns 是否在房间中
   */
  isUserInRoom(userId: number, room: string): boolean {
    const socketId = this.connectedUsers.get(userId);
    if (!socketId) return false;

    const socket = this.server.sockets.sockets.get(socketId);
    if (!socket) return false;

    return socket.rooms.has(room);
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 申请加入房间
   */
  @SubscribeMessage('apply_to_room')
  handleApplyToRoom(
    client: Socket,
    payload: { roomId: string; message?: string },
  ) {
    const userId = (client.data as ClientData).userId;
    const userEmail = (client.data as ClientData).userEmail;
    const { roomId, message } = payload;

    if (!userId || !userEmail) {
      client.emit('error', {
        message: '用户信息不完整',
        code: 'INVALID_USER',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      client.emit('error', {
        message: '房间不存在',
        code: 'ROOM_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查是否已经在房间中
    if (room.members.some((member) => member.userId === userId)) {
      client.emit('error', {
        message: '您已经在房间中',
        code: 'ALREADY_IN_ROOM',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查是否已有待处理的申请
    const existingApplication = Array.from(this.roomApplications.values()).find(
      (app) =>
        app.roomId === roomId &&
        app.applicantId === userId &&
        app.status === 'pending',
    );

    if (existingApplication) {
      client.emit('error', {
        message: '您已提交过申请，请等待处理',
        code: 'APPLICATION_EXISTS',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const applicationId = this.generateId();
    const application: RoomApplication = {
      id: applicationId,
      roomId,
      applicantId: userId,
      applicantEmail: userEmail,
      message,
      status: 'pending',
      createdAt: new Date(),
    };

    this.roomApplications.set(applicationId, application);

    // 通知房主
    const ownerSocketId = this.connectedUsers.get(room.ownerId);
    if (ownerSocketId) {
      const ownerSocket = this.server.sockets.sockets.get(ownerSocketId);
      if (ownerSocket) {
        ownerSocket.emit('room_application', {
          application,
          room: {
            id: room.id,
            name: room.name,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    client.emit('application_submitted', {
      application,
      message: '申请已提交，等待房主审核',
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `用户 ${userEmail} 申请加入房间 ${room.name} (ID: ${roomId})`,
    );
  }

  /**
   * 处理房间申请
   */
  @SubscribeMessage('handle_room_application')
  async handleRoomApplication(
    client: Socket,
    payload: { applicationId: string; action: 'approve' | 'reject' },
  ) {
    const userId = (client.data as ClientData).userId;
    const userEmail = (client.data as ClientData).userEmail;
    const { applicationId, action } = payload;

    if (!userId || !userEmail) {
      client.emit('error', {
        message: '用户信息不完整',
        code: 'INVALID_USER',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const application = this.roomApplications.get(applicationId);
    if (!application) {
      client.emit('error', {
        message: '申请不存在',
        code: 'APPLICATION_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const room = this.rooms.get(application.roomId);
    if (!room) {
      client.emit('error', {
        message: '房间不存在',
        code: 'ROOM_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查是否有权限处理申请（只有房主可以处理）
    if (room.ownerId !== userId) {
      client.emit('error', {
        message: '只有房主可以处理申请',
        code: 'PERMISSION_DENIED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 更新申请状态
    application.status = action === 'approve' ? 'approved' : 'rejected';
    application.processedAt = new Date();
    application.processedBy = userId;

    if (action === 'approve') {
      // 批准申请，将用户加入房间
      const applicantSocketId = this.connectedUsers.get(
        application.applicantId,
      );
      if (applicantSocketId) {
        const applicantSocket =
          this.server.sockets.sockets.get(applicantSocketId);
        if (applicantSocket) {
          await applicantSocket.join(application.roomId);
          room.members.push({
            userId: application.applicantId,
            userEmail: application.applicantEmail,
            socketId: applicantSocketId,
            joinedAt: new Date(),
          });

          // 通知申请人
          applicantSocket.emit('room_joined', {
            room: {
              id: room.id,
              name: room.name,
            },
            message: `您已成功加入房间 "${room.name}"`,
            timestamp: new Date().toISOString(),
          });

          // 通知房间内其他成员
          applicantSocket.to(application.roomId).emit('user_joined_room', {
            userId: application.applicantId,
            userEmail: application.applicantEmail,
            room: room.name,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // 通知申请人处理结果
    const applicantSocketId = this.connectedUsers.get(application.applicantId);
    if (applicantSocketId) {
      const applicantSocket =
        this.server.sockets.sockets.get(applicantSocketId);
      if (applicantSocket) {
        applicantSocket.emit('application_processed', {
          application,
          message: action === 'approve' ? '申请已通过' : '申请被拒绝',
          timestamp: new Date().toISOString(),
        });
      }
    }

    this.logger.log(
      `房主 ${userEmail} ${action === 'approve' ? '批准' : '拒绝'}了用户 ${application.applicantEmail} 的申请`,
    );
  }

  /**
   * 踢出房间成员
   */
  @SubscribeMessage('kick_room_member')
  async handleKickRoomMember(
    client: Socket,
    payload: { roomId: string; targetUserId: number },
  ) {
    const userId = (client.data as ClientData).userId;
    const userEmail = (client.data as ClientData).userEmail;
    const { roomId, targetUserId } = payload;

    if (!userId || !userEmail) {
      client.emit('error', {
        message: '用户信息不完整',
        code: 'INVALID_USER',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      client.emit('error', {
        message: '房间不存在',
        code: 'ROOM_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查是否有权限踢人（只有房主可以踢人）
    if (room.ownerId !== userId) {
      client.emit('error', {
        message: '只有房主可以踢出成员',
        code: 'PERMISSION_DENIED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 不能踢出自己
    if (targetUserId === userId) {
      client.emit('error', {
        message: '不能踢出自己',
        code: 'CANNOT_KICK_SELF',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const memberIndex = room.members.findIndex(
      (member) => member.userId === targetUserId,
    );
    if (memberIndex === -1) {
      client.emit('error', {
        message: '用户不在房间中',
        code: 'USER_NOT_IN_ROOM',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const member = room.members[memberIndex];
    room.members.splice(memberIndex, 1);

    // 从Socket.IO房间中移除
    const targetSocketId = this.connectedUsers.get(targetUserId);
    if (targetSocketId) {
      const targetSocket = this.server.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        await targetSocket.leave(roomId);
        targetSocket.emit('kicked_from_room', {
          room: {
            id: room.id,
            name: room.name,
          },
          message: `您被房主踢出了房间 "${room.name}"`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // 通知房间内其他成员
    client.to(roomId).emit('user_kicked_from_room', {
      userId: targetUserId,
      userEmail: member.userEmail,
      room: room.name,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `房主 ${userEmail} 将用户 ${member.userEmail} 踢出了房间 ${room.name}`,
    );
  }

  /**
   * 转让房主权限
   */
  @SubscribeMessage('transfer_room_ownership')
  handleTransferRoomOwnership(
    client: Socket,
    payload: { roomId: string; newOwnerId: number },
  ) {
    const userId = (client.data as ClientData).userId;
    const userEmail = (client.data as ClientData).userEmail;
    const { roomId, newOwnerId } = payload;

    if (!userId || !userEmail) {
      client.emit('error', {
        message: '用户信息不完整',
        code: 'INVALID_USER',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      client.emit('error', {
        message: '房间不存在',
        code: 'ROOM_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查是否有权限转让（只有房主可以转让）
    if (room.ownerId !== userId) {
      client.emit('error', {
        message: '只有房主可以转让权限',
        code: 'PERMISSION_DENIED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 不能转让给自己
    if (newOwnerId === userId) {
      client.emit('error', {
        message: '不能转让给自己',
        code: 'CANNOT_TRANSFER_TO_SELF',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const newOwner = room.members.find(
      (member) => member.userId === newOwnerId,
    );
    if (!newOwner) {
      client.emit('error', {
        message: '目标用户不在房间中',
        code: 'USER_NOT_IN_ROOM',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 转让房主权限
    const oldOwnerEmail = room.ownerEmail;
    room.ownerId = newOwnerId;
    room.ownerEmail = newOwner.userEmail;

    // 通知房间内所有成员
    this.server.to(roomId).emit('room_ownership_transferred', {
      room: {
        id: room.id,
        name: room.name,
      },
      oldOwner: {
        userId,
        userEmail: oldOwnerEmail,
      },
      newOwner: {
        userId: newOwnerId,
        userEmail: newOwner.userEmail,
      },
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `房主 ${oldOwnerEmail} 将房间 ${room.name} 的权限转让给了 ${newOwner.userEmail}`,
    );
  }

  /**
   * 销毁房间
   */
  private destroyRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // 通知所有成员房间被销毁
    this.server.to(roomId).emit('room_destroyed', {
      room: {
        id: room.id,
        name: room.name,
      },
      message: '房间已被销毁',
      timestamp: new Date().toISOString(),
    });

    // 清理房间数据
    this.rooms.delete(roomId);

    // 清理相关申请
    for (const [
      applicationId,
      application,
    ] of this.roomApplications.entries()) {
      if (application.roomId === roomId) {
        this.roomApplications.delete(applicationId);
      }
    }

    this.logger.log(`房间 ${room.name} (ID: ${roomId}) 已被销毁`);
  }

  /**
   * 广播房间列表更新
   */
  private broadcastRoomList() {
    const rooms = Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      ownerId: room.ownerId,
      ownerEmail: room.ownerEmail,
      memberCount: room.members.length,
      isPrivate: room.isPrivate,
      description: room.description,
      createdAt: room.createdAt,
      members: room.members.map((member) => ({
        userId: member.userId,
        userEmail: member.userEmail,
        joinedAt: member.joinedAt,
      })),
    }));

    this.server.emit('room_list_updated', {
      rooms,
      count: rooms.length,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 处理房间消息发送
   * 客户端发送 'room_message' 消息时调用
   *
   * @param client - 发送请求的客户端 Socket 连接
   * @param payload - 包含房间ID和消息内容的数据
   */
  @SubscribeMessage('room_message')
  async handleRoomMessage(
    client: Socket,
    payload: { roomId: string; message: string; roomName?: string },
  ) {
    const userId = (client.data as ClientData).userId;
    const userEmail = (client.data as ClientData).userEmail;

    if (!userId || !userEmail) {
      client.emit('error', {
        message: '用户未认证',
        code: 'UNAUTHORIZED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { roomId, message } = payload;

    if (!roomId || !message?.trim()) {
      client.emit('error', {
        message: '房间ID和消息内容不能为空',
        code: 'INVALID_PARAMS',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      // 使用前端传递的房间名称，如果没有则查询数据库
      const roomName =
        payload.roomName || (await this.roomsService.getRoomById(roomId))?.name;
      if (!roomName) {
        client.emit('error', {
          message: '房间不存在',
          code: 'ROOM_NOT_FOUND',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      this.logger.log(
        `用户 ${userEmail} 发送消息到房间 ${roomId}: ${roomName}`,
      );

      // 构造消息对象
      const messageData = {
        id: Date.now().toString(),
        roomId,
        userId,
        userEmail,
        username: userEmail.split('@')[0], // 使用邮箱前缀作为用户名
        content: message.trim(),
        timestamp: new Date().toISOString(),
      };

      // 向房间内所有用户广播消息（包括发送者）
      this.server.to(roomId).emit('room_message_received', messageData);

      this.logger.log(
        `用户 ${userEmail} 在房间 ${roomName} 发送消息: ${message.trim()}`,
      );
    } catch (error) {
      this.logger.error(`用户 ${userEmail} 发送房间消息失败:`, error);
      client.emit('error', {
        message: '发送消息失败',
        code: 'SEND_FAILED',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 处理获取房间历史消息
   * 客户端发送 'get_room_history' 消息时调用
   *
   * @param client - 发送请求的客户端 Socket 连接
   * @param payload - 包含房间ID的数据
   */
  @SubscribeMessage('get_room_history')
  async handleGetRoomHistory(
    client: Socket,
    payload: { roomId: string; roomName?: string },
  ) {
    const userId = (client.data as ClientData).userId;
    const userEmail = (client.data as ClientData).userEmail;

    if (!userId || !userEmail) {
      client.emit('error', {
        message: '用户未认证',
        code: 'UNAUTHORIZED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { roomId } = payload;

    if (!roomId) {
      client.emit('error', {
        message: '房间ID不能为空',
        code: 'INVALID_PARAMS',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      // 使用前端传递的房间名称，如果没有则查询数据库
      const roomName =
        payload.roomName || (await this.roomsService.getRoomById(roomId))?.name;
      if (!roomName) {
        client.emit('error', {
          message: '房间不存在',
          code: 'ROOM_NOT_FOUND',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      this.logger.log(
        `用户 ${userEmail} 获取房间 ${roomId} 历史消息: ${roomName}`,
      );

      // 这里可以添加历史消息查询逻辑
      // 目前返回空数组，后续可以集成消息存储服务
      const historyMessages: any[] = [];

      client.emit('room_history', {
        roomId,
        roomName: roomName,
        messages: historyMessages,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`用户 ${userEmail} 请求房间 ${roomName} 历史消息`);
    } catch (error) {
      this.logger.error(`用户 ${userEmail} 获取房间历史消息失败:`, error);
      client.emit('error', {
        message: '获取历史消息失败',
        code: 'GET_HISTORY_FAILED',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 处理房间删除事件
   * 当房间被删除时，踢出房间内的所有用户
   *
   * @param data - 房间删除事件数据
   */
  /**
   * 处理房间创建事件
   * 当房间创建后，静默更新房间列表（不显示创建消息）
   */
  private handleRoomCreated(data: {
    room: any;
    createdBy: number;
    createdByEmail: string;
  }) {
    const { room } = data;

    this.logger.log(`处理房间创建事件: ${room?.name} (ID: ${room?.id})`);

    // 将新房间添加到内存中的rooms Map
    if (room && room.id) {
      this.rooms.set(room.id, {
        id: room.id,
        name: room.name,
        ownerId: room.ownerId,
        ownerEmail: room.ownerEmail,
        createdAt: room.createdAt,
        members: room.members || [],
        isPrivate: room.isPrivate,
        description: room.description,
      });
      this.logger.log(`已将房间 ${room.name} 添加到内存Map`);
    }

    // 静默广播房间列表更新给所有连接的客户端（不显示创建消息）
    this.server.emit('room_list_updated', {
      room: room,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`已静默更新房间列表: ${room?.name}`);
  }

  private async handleRoomDeleted(data: {
    roomId: string;
    roomName: string;
    memberUserIds: number[];
    deletedBy: number;
  }) {
    const { roomId, roomName, deletedBy } = data;

    this.logger.log(`处理房间删除事件: ${roomName} (ID: ${roomId})`);

    // 向房间内所有用户发送房间被删除的通知
    this.server.to(roomId).emit('room_destroyed', {
      room: {
        id: roomId,
        name: roomName,
      },
      message: `房间 "${roomName}" 已被房主删除`,
      deletedBy,
      timestamp: new Date().toISOString(),
    });

    // 获取房间内所有Socket连接（更准确的方式）
    const adapter = this.server.sockets.adapter;
    const roomSockets = adapter?.rooms.get(roomId);
    const connectedUserIds: number[] = [];

    // 先收集所有在房间中的用户ID
    if (roomSockets) {
      for (const socketId of roomSockets) {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          const userId = (socket.data as ClientData).userId;
          if (userId) {
            connectedUserIds.push(userId);
          }
        }
      }
    }

    this.logger.log(
      `房间 ${roomName} 中有 ${connectedUserIds.length} 个在线用户将被踢出`,
    );

    // 强制断开房间内所有用户的连接
    if (this.server.sockets.sockets) {
      for (const socket of this.server.sockets.sockets.values()) {
        const userId = (socket.data as ClientData).userId;
        if (userId && connectedUserIds.includes(userId)) {
          // 发送房间被删除的通知（确保每个用户都收到）
          socket.emit('room_destroyed', {
            room: {
              id: roomId,
              name: roomName,
            },
            message: `房间 "${roomName}" 已被房主删除`,
            deletedBy,
            timestamp: new Date().toISOString(),
          });

          // 强制离开房间
          await socket.leave(roomId);

          this.logger.log(`用户 ${userId} 已被踢出房间 ${roomName}`);
        }
      }
    } else {
      this.logger.warn('Socket.IO sockets 不可用，无法踢出房间用户');
    }

    // 从内存中移除房间
    this.rooms.delete(roomId);

    // 清理房间相关的申请
    for (const [
      applicationId,
      application,
    ] of this.roomApplications.entries()) {
      if (application.roomId === roomId) {
        this.roomApplications.delete(applicationId);
      }
    }

    this.logger.log(
      `房间 ${roomName} 删除完成，已踢出 ${connectedUserIds.length} 个在线用户`,
    );
  }

  /**
   * 获取房间的在线用户数量
   *
   * @param roomId - 房间ID
   * @returns 在线用户数量
   */
  private getRoomOnlineCount(roomId: string): number {
    try {
      const adapter = this.server.sockets.adapter;
      if (!adapter) {
        return 0;
      }

      const roomSockets = adapter.rooms.get(roomId);
      return roomSockets?.size || 0;
    } catch (error) {
      this.logger.error(`获取房间 ${roomId} 在线用户数量失败:`, error);
      return 0;
    }
  }

  /**
   * 广播房间列表更新（用于更新在线人数）
   *
   * @param roomId - 房间ID
   */
  private async broadcastRoomListUpdate(roomId: string) {
    try {
      // 获取更新后的房间信息（包含最新的成员列表）
      const roomInfo = await this.roomsService.getRoomById(roomId);
      if (!roomInfo) {
        this.logger.warn(`房间 ${roomId} 不存在，无法更新房间列表`);
        return;
      }

      // 获取房间的在线用户数量
      const onlineCount = this.getRoomOnlineCount(roomId);

      // 更新房间信息中的在线人数
      const updatedRoomInfo = {
        ...roomInfo,
        memberCount: onlineCount, // 使用在线用户数量而不是数据库中的成员数量
      };

      // 广播房间列表更新给所有连接的客户端
      this.server.emit('room_list_updated', {
        message: `房间 "${roomInfo.name}" 信息已更新`,
        room: updatedRoomInfo,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `房间 ${roomId} 列表更新已广播，在线用户数量: ${onlineCount}`,
      );
    } catch (error) {
      this.logger.error(`广播房间 ${roomId} 列表更新失败:`, error);
    }
  }

  /**
   * 静默广播房间列表更新（不显示消息提示，用于用户离开房间等场景）
   *
   * @param roomId - 房间ID
   */
  private async broadcastRoomListUpdateSilent(roomId: string) {
    try {
      // 获取更新后的房间信息（包含最新的成员列表）
      const roomInfo = await this.roomsService.getRoomById(roomId);
      if (!roomInfo) {
        this.logger.warn(`房间 ${roomId} 不存在，无法更新房间列表`);
        return;
      }

      // 获取房间的在线用户数量
      const onlineCount = this.getRoomOnlineCount(roomId);

      // 更新房间信息中的在线人数
      const updatedRoomInfo = {
        ...roomInfo,
        memberCount: onlineCount, // 使用在线用户数量而不是数据库中的成员数量
      };

      // 静默广播房间列表更新给所有连接的客户端（不包含消息提示）
      this.server.emit('room_list_updated', {
        room: updatedRoomInfo,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `房间 ${roomId} 静默列表更新已广播，在线用户数量: ${onlineCount}`,
      );
    } catch (error) {
      this.logger.error(`静默广播房间 ${roomId} 列表更新失败:`, error);
    }
  }
}
