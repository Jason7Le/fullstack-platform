/**
 * WebSocket 服务类
 *
 * 功能说明：
 * - 管理 WebSocket 连接
 * - 处理认证和重连
 * - 提供消息发送和接收接口
 * - 支持事件监听和回调
 *
 * 使用场景：
 * - 实时通知
 * - 在线状态同步
 * - 实时数据更新
 */
import { ElMessage } from 'element-plus';
import { io, type Socket } from 'socket.io-client';

// WebSocket 连接状态
export const ConnectionStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
} as const;

export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus];

// 通知消息接口
export interface Notification {
  id: string;
  type: 'system' | 'user' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date | string; // 支持 Date 对象或字符串格式
  read: boolean;
  data?: any;
}

// 在线用户接口
export interface OnlineUser {
  userId: number;
  socketId: string;
  isOnline: boolean;
  userEmail?: string;
}

// WebSocket 事件类型定义
export interface WebSocketEvents {
  // 连接相关事件
  connected: (data: { message: string; userId: number }) => void;
  disconnected: () => void;
  error: (error: { message: string; code?: string }) => void;

  // 通知相关事件
  notification: (notification: Notification) => void;
  system_notification: (notification: Notification) => void;
  room_notification: (notification: Notification) => void;

  // 在线用户相关事件
  online_users: (data: { users: OnlineUser[]; count: number }) => void;

  // 房间相关事件
  room_joined: (data: {
    room: string;
    roomName: string;
    message: string;
    timestamp: string;
  }) => void;
  room_left: (data: { room: string; roomName: string; message: string }) => void;
  room_list_updated: (data: {
    message: string;
    room: any;
    createdBy: number;
    createdByEmail: string;
    timestamp: string;
  }) => void;
  room_members: (data: {
    room: string;
    members: Array<{ userId: number; userEmail: string; socketId: string }>;
    count: number;
  }) => void;
  user_joined_room: (data: { userId: number; userEmail: string; room: string }) => void;
  user_left_room: (data: { userId: number; userEmail: string; room: string }) => void;
  room_application: (data: { application: any; room: any }) => void;
  application_submitted: (data: { application: any; message: string }) => void;
  application_processed: (data: { application: any; message: string }) => void;

  // 房间消息事件
  room_message_received: (data: {
    id: string;
    roomId: string;
    userId: number;
    userEmail: string;
    username: string;
    content: string;
    timestamp: string;
  }) => void;
  room_history: (data: {
    roomId: string;
    roomName: string;
    messages: any[];
    timestamp: string;
  }) => void;
  room_member_count_updated: (data: {
    roomId: string;
    memberCount: number;
    timestamp: string;
  }) => void;
  kicked_from_room: (data: { room: any; message: string }) => void;
  user_kicked_from_room: (data: { userId: number; userEmail: string; room: string }) => void;
  room_ownership_transferred: (data: { room: any; oldOwner: any; newOwner: any }) => void;
  room_destroyed: (data: { room: any; message: string }) => void;
}

/**
 * WebSocket 服务类
 * 封装 Socket.IO 客户端功能
 */
class WebsocketService {
  private socket: Socket | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private eventListeners: Map<string, Function[]> = new Map();
  private isManualDisconnect = false; // 标记是否为手动断开
  private lastEventTime: Map<string, number> = new Map(); // 记录最后触发事件的时间

  // 重连相关属性
  private reconnectAttempts = 0; // 当前重连尝试次数
  private reconnectTimeout: NodeJS.Timeout | null = null; // 重连定时器

  /**
   * 连接 WebSocket 服务器
   *
   * @param token - JWT 认证令牌
   * @param serverUrl - 服务器地址，默认为当前域名
   * @param isReconnect - 是否为重连操作，默认为 false
   */
  connect(token: string, serverUrl?: string, isReconnect = false): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 如果已经连接，直接返回
        if (this.socket && this.socket.connected && this.status === ConnectionStatus.CONNECTED) {
          console.log('WebSocket 已经连接，跳过重复连接');
          resolve();
          return;
        }

        // 如果正在连接中，拒绝新连接
        if (this.status === ConnectionStatus.CONNECTING) {
          reject(new Error('正在连接中，请稍后重试'));
          return;
        }

        // 如果存在socket但未连接，先断开（但不重置重连次数）
        if (this.socket) {
          console.log('WebSocket 存在但未连接，先断开旧连接');
          this.disconnect(false); // 不重置重连次数
        }

        this.status = ConnectionStatus.CONNECTING;
        this.isManualDisconnect = false; // 重置手动断开标记

        // 只有在非重连时才重置重连次数
        if (!isReconnect) {
          this.reconnectAttempts = 0;
        }

        // 构建服务器URL - 连接到后端3000端口
        // 支持环境变量配置，默认连接到3000端口
        const defaultUrl =
          import.meta.env.VITE_API_BASE_URL ||
          `${window.location.protocol}//${window.location.hostname}:3000`;
        const url = serverUrl || defaultUrl;

        // 创建 Socket.IO 连接
        console.log('WebSocket 连接配置:', {
          url: `${url}/notifications`,
          tokenLength: token?.length || 0,
          hasToken: !!token,
        });

        this.socket = io(`${url}/notifications`, {
          auth: {
            token: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          },
          transports: ['websocket', 'polling'], // 支持降级
          timeout: 20000, // 连接超时时间
          forceNew: true, // 强制创建新连接
        });

        // 连接成功事件（Socket.IO连接建立）
        this.socket.on('connect', () => {
          console.log('WebSocket Socket.IO 连接建立');
          // 注意：这里不设置状态为CONNECTED，等待服务器认证成功
        });

        // 连接错误事件
        this.socket.on('connect_error', error => {
          console.error('WebSocket 连接失败:', error);
          this.status = ConnectionStatus.ERROR;

          // 如果已达到最大重连次数，彻底断开连接
          if (this.reconnectAttempts >= 5) {
            this.forceDisconnect('达到最大重连次数');
            return;
          }

          // 如果是认证失败，不显示通用错误消息
          if (error.message?.includes('认证失败') || error.message?.includes('AUTH_FAILED')) {
            console.error('WebSocket 认证失败:', error);
            reject(new Error(`认证失败: ${error.message || error}`));
          } else {
            ElMessage.error('WebSocket 连接失败');
            // 尝试重连
            this.handleReconnect(token, url, resolve, reject);
          }
        });

        // 断开连接事件
        this.socket.on('disconnect', reason => {
          console.log('WebSocket 断开连接:', reason);
          this.status = ConnectionStatus.DISCONNECTED;

          // 只有在非手动断开时才触发事件，避免重复触发
          if (!this.isManualDisconnect) {
            this.triggerEvent('disconnected');
          }

          // 重置手动断开标记
          this.isManualDisconnect = false;

          // 如果已达到最大重连次数，彻底断开连接
          if (this.reconnectAttempts >= 5) {
            this.forceDisconnect('达到最大重连次数');
            return;
          }

          // 如果不是手动断开且不是客户端主动断开，尝试重连
          if (reason !== 'io client disconnect' && !this.isManualDisconnect) {
            this.handleReconnect(token, url, resolve, reject);
          }
        });

        // 服务器认证成功事件
        this.socket.on('connected', data => {
          console.log('WebSocket 认证成功:', data);
          this.status = ConnectionStatus.CONNECTED;
          this.reconnectAttempts = 0; // 连接成功后重置重连次数
          this.triggerEvent('connected', data);

          // 设置所有业务事件监听器
          this.setupBusinessEventListeners();

          // 认证成功后自动获取在线用户列表
          this.getOnlineUsers();

          resolve(); // 认证成功后resolve Promise
        });

        // 服务器错误事件
        this.socket.on('error', error => {
          console.error('WebSocket 服务器错误:', error);

          // 某些错误不应该断开连接
          const nonFatalErrors = [
            'ALREADY_MEMBER',
            'NOT_MEMBER',
            'INVALID_PARAMS',
            'SERVICE_UNAVAILABLE',
          ];
          const isNonFatalError = nonFatalErrors.includes(error.code);

          if (!isNonFatalError) {
            this.status = ConnectionStatus.ERROR;
          }

          this.triggerEvent('error', error);

          // 如果是认证错误，reject Promise
          if (error.message?.includes('认证失败') || error.message?.includes('AUTH_FAILED')) {
            reject(new Error(error.message));
          }
        });

        // 设置其他事件监听器
        this.setupEventListeners();
      } catch (error) {
        console.error('WebSocket 连接异常:', error);
        this.status = ConnectionStatus.ERROR;
        reject(error);
      }
    });
  }

  /**
   * 断开 WebSocket 连接
   * @param resetRetryCount - 是否重置重连次数，默认为 true
   */
  disconnect(resetRetryCount = true): void {
    console.log('WebSocketService: 开始断开连接');

    // 设置手动断开标记
    this.isManualDisconnect = true;

    // 重置重连次数（只有在手动断开或明确要求时才重置）
    if (resetRetryCount) {
      this.reconnectAttempts = 0;
    }

    // 先触发断开连接事件
    this.triggerEvent('disconnected');

    // 调用彻底断开连接方法
    this.forceDisconnect('手动断开连接');

    this.status = ConnectionStatus.DISCONNECTED;
    // 注意：不清空 eventListeners，保持组合式函数的事件监听器
    // this.eventListeners.clear();

    console.log('WebSocketService: 连接已断开');
  }

  /**
   * 彻底断开 WebSocket 连接
   * @param reason - 断开原因，用于日志记录
   */
  private forceDisconnect(reason: string): void {
    console.log(`彻底断开 WebSocket 连接: ${reason}`);
    this.status = ConnectionStatus.ERROR;

    // 彻底断开 Socket.IO 连接，防止继续触发事件
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // 清理重连定时器
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * 处理重连逻辑
   * @param token - JWT 认证令牌
   * @param serverUrl - 服务器地址
   * @param resolve - Promise resolve 函数
   * @param reject - Promise reject 函数
   */
  private handleReconnect(
    token: string,
    serverUrl: string,
    resolve: Function,
    reject: Function,
  ): void {
    // 先递增重连次数
    this.reconnectAttempts++;

    // 检查是否已达到最大重连次数
    if (this.reconnectAttempts > 5) {
      console.error('WebSocket 重连失败，已达到最大重连次数 5');
      ElMessage.error('WebSocket 连接失败，已尝试 5 次');

      this.forceDisconnect('达到最大重连次数');
      reject(new Error('连接失败，已达到最大重连次数 5'));
      return;
    }

    console.log(`WebSocket 开始第 ${this.reconnectAttempts} 次重连尝试 (最大 5 次)`);

    // 设置重连状态
    this.status = ConnectionStatus.RECONNECTING;

    // 计算重连延迟时间（指数退避）
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000); // 最大10秒

    this.reconnectTimeout = setTimeout(() => {
      // 在定时器执行前再次检查重连次数
      if (this.reconnectAttempts > 5) {
        console.log('定时器执行时发现已超过最大重连次数，停止重连');
        return;
      }

      console.log(`WebSocket 第 ${this.reconnectAttempts} 次重连尝试，延迟 ${delay}ms`);

      // 重新连接
      this.connect(token, serverUrl, true)
        .then(() => {
          console.log(`WebSocket 第 ${this.reconnectAttempts} 次重连成功`);
          resolve();
        })
        .catch(error => {
          console.error(`WebSocket 第 ${this.reconnectAttempts} 次重连失败:`, error);
          // 继续尝试重连
          this.handleReconnect(token, serverUrl, resolve, reject);
        });
    }, delay);
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // 监听通知消息
    this.socket.on('notification', (notification: Notification) => {
      console.log('收到个人通知:', notification);
      this.triggerEvent('notification', notification);
    });

    this.socket.on('system_notification', (notification: Notification) => {
      console.log('收到系统通知:', notification);
      this.triggerEvent('system_notification', notification);
    });

    this.socket.on('room_notification', (notification: Notification) => {
      console.log('收到房间通知:', notification);
      this.triggerEvent('room_notification', notification);
    });

    // 监听在线用户列表
    this.socket.on('online_users', data => {
      console.log('收到在线用户列表:', data);
      this.triggerEvent('online_users', data);
    });
  }

  /**
   * 发送消息到服务器
   *
   * @param event - 事件名称
   * @param data - 数据
   */
  emit(event: string, data?: any): void {
    console.log('WebSocketService: emit被调用，事件:', event, '数据:', data);
    console.log('WebSocketService: socket状态:', !!this.socket, '连接状态:', this.status);

    if (this.socket && this.status === ConnectionStatus.CONNECTED) {
      console.log('WebSocketService: 发送事件到后端:', event, data);
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket 未连接，无法发送消息');
    }
  }

  /**
   * 监听服务器事件
   *
   * @param event - 事件名称
   * @param callback - 回调函数
   */
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    // console.log('WebSocketService: 注册事件监听器:', event);
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听器
   *
   * @param event - 事件名称
   * @param callback - 回调函数
   */
  off<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 添加一次性事件监听器
   *
   * @param event - 事件名称
   * @param callback - 回调函数
   */
  once<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): void {
    const onceCallback = (data: any) => {
      callback(data);
      this.off(event, onceCallback as WebSocketEvents[K]);
    };
    this.on(event, onceCallback as WebSocketEvents[K]);
  }

  /**
   * 触发内部事件
   *
   * @param event - 事件名称
   * @param data - 数据
   */
  private triggerEvent(event: string, data?: any): void {
    const now = Date.now();
    const lastTime = this.lastEventTime.get(event) || 0;

    // 防重复触发：同一事件在100ms内只触发一次
    if (now - lastTime < 100) {
      // console.log(`WebSocketService: 跳过重复事件 ${event} (距离上次触发 ${now - lastTime}ms)`);
      return;
    }

    this.lastEventTime.set(event, now);
    console.log(`WebSocketService: 触发事件 ${event}`, data);
    const listeners = this.eventListeners.get(event);
    console.log(`WebSocketService: 找到 ${listeners?.length || 0} 个监听器`);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          console.log(`WebSocketService: 执行 ${event} 回调`);
          callback(data);
        } catch (error) {
          console.error(`事件 ${event} 回调执行失败:`, error);
        }
      });
    }
  }

  /**
   * 获取连接状态
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED && this.socket?.connected === true;
  }

  /**
   * 获取重连状态信息
   */
  getReconnectInfo(): { attempts: number; maxAttempts: number; isReconnecting: boolean } {
    return {
      attempts: this.reconnectAttempts,
      maxAttempts: 5,
      isReconnecting: this.status === ConnectionStatus.RECONNECTING,
    };
  }

  /**
   * 请求在线用户列表
   */
  getOnlineUsers(): void {
    this.emit('get_online_users');
  }

  /**
   * 加入房间
   *
   * @param roomId - 房间ID
   */
  joinRoom(roomId: string): void {
    console.log('WebSocketService: joinRoom被调用，房间ID:', roomId);
    this.emit('join_room', { roomId });
  }

  /**
   * 离开房间
   *
   * @param roomId - 房间ID
   * @param isOwner - 是否是房主（前端计算）
   * @param userId - 用户ID（前端传递）
   * @param memberCount - 房间成员数量（前端传递，减少后端查询）
   */
  leaveRoom(roomId: string, isOwner?: boolean, userId?: number, memberCount?: number): void {
    this.emit('leave_room', { roomId, isOwner, userId, memberCount });
  }

  /**
   * 获取房间成员列表
   *
   * @param room - 房间名称
   */
  getRoomMembers(room: string): void {
    this.emit('get_room_members', { room });
  }

  /**
   * 申请加入房间
   *
   * @param roomId - 房间ID
   * @param message - 申请消息
   */
  applyToRoom(roomId: string, message?: string): void {
    this.emit('apply_to_room', { roomId, message });
  }

  /**
   * 发送房间消息
   *
   * @param roomId - 房间ID
   * @param message - 消息内容
   * @param roomName - 房间名称（前端传递，减少后端查询）
   */
  sendRoomMessage(roomId: string, message: string, roomName?: string): void {
    this.emit('room_message', { roomId, message, roomName });
  }

  /**
   * 设置所有业务事件监听器
   */
  private setupBusinessEventListeners(): void {
    console.log('WebSocketService: 设置业务事件监听器');

    // 房间相关事件
    this.socket!.on('room_joined', (data: any) => {
      console.log('WebSocketService: 收到room_joined事件:', data);
      this.triggerEvent('room_joined', data);
    });

    this.socket!.on('room_left', (data: any) => {
      console.log('WebSocketService: 收到room_left事件:', data);
      this.triggerEvent('room_left', data);
    });

    this.socket!.on('room_list_updated', (data: any) => {
      console.log('WebSocketService: 收到room_list_updated事件:', data);
      this.triggerEvent('room_list_updated', data);
    });

    this.socket!.on('room_members', (data: any) => {
      console.log('WebSocketService: 收到room_members事件:', data);
      this.triggerEvent('room_members', data);
    });

    this.socket!.on('user_joined_room', (data: any) => {
      console.log('WebSocketService: 收到user_joined_room事件:', data);
      this.triggerEvent('user_joined_room', data);
    });

    this.socket!.on('user_left_room', (data: any) => {
      console.log('WebSocketService: 收到user_left_room事件:', data);
      this.triggerEvent('user_left_room', data);
    });

    // 消息相关事件
    this.socket!.on('room_message_received', (data: any) => {
      console.log('WebSocketService: 收到room_message_received事件:', data);
      this.triggerEvent('room_message_received', data);
    });

    this.socket!.on('room_history', (data: any) => {
      console.log('WebSocketService: 收到room_history事件:', data);
      this.triggerEvent('room_history', data);
    });

    this.socket!.on('room_member_count_updated', (data: any) => {
      console.log('WebSocketService: 收到room_member_count_updated事件:', data);
      this.triggerEvent('room_member_count_updated', data);
    });

    // 通知相关事件
    this.socket!.on('notification', (data: any) => {
      console.log('WebSocketService: 收到notification事件:', data);
      this.triggerEvent('notification', data);
    });

    this.socket!.on('system_notification', (data: any) => {
      console.log('WebSocketService: 收到system_notification事件:', data);
      this.triggerEvent('system_notification', data);
    });

    this.socket!.on('room_notification', (data: any) => {
      console.log('WebSocketService: 收到room_notification事件:', data);
      this.triggerEvent('room_notification', data);
    });

    // 在线用户事件
    this.socket!.on('online_users', (data: any) => {
      // console.log('WebSocketService: 收到online_users事件:', data);
      this.triggerEvent('online_users', data);
    });

    // console.log('WebSocketService: 业务事件监听器设置完成');
  }

  /**
   * 获取房间历史消息
   *
   * @param roomId - 房间ID
   * @param roomName - 房间名称（前端传递，减少后端查询）
   */
  getRoomHistory(roomId: string, roomName?: string): void {
    this.emit('get_room_history', { roomId, roomName });
  }

  /**
   * 处理房间申请
   *
   * @param applicationId - 申请ID
   * @param action - 处理动作：approve 或 reject
   */
  handleRoomApplication(applicationId: string, action: 'approve' | 'reject'): void {
    this.emit('handle_room_application', { applicationId, action });
  }

  /**
   * 踢出房间成员
   *
   * @param roomId - 房间ID
   * @param targetUserId - 目标用户ID
   */
  kickRoomMember(roomId: string, targetUserId: number): void {
    this.emit('kick_room_member', { roomId, targetUserId });
  }

  /**
   * 转让房主权限
   *
   * @param roomId - 房间ID
   * @param newOwnerId - 新房主用户ID
   */
  transferRoomOwnership(roomId: string, newOwnerId: number): void {
    this.emit('transfer_room_ownership', { roomId, newOwnerId });
  }
}

// 创建单例实例
export const websocketService = new WebsocketService();
export default websocketService;
