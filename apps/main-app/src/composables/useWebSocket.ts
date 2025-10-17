/**
 * WebSocket 组合式函数
 *
 * 提供在 Vue 组件中使用 WebSocket 的便捷方法
 * 包含连接管理、事件监听、状态管理等功能
 */
import { useAuthStore } from '@/stores/auth';
import websocketService, {
  ConnectionStatus,
  type Notification,
  type OnlineUser,
} from '@/utils/websocket';
import { ElMessage } from 'element-plus';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { roomApi } from '../api/roomApi';

// 房间消息接口
export interface RoomMessage {
  id: string;
  roomId: string;
  userId: number;
  userEmail: string;
  username: string;
  content: string;
  timestamp: string;
}

// 全局状态，避免多个组件重复创建
// 使用单例模式确保整个应用只有一个WebSocket状态实例
let globalState: {
  isConnected: ReturnType<typeof ref<boolean>>; // WebSocket连接状态
  connectionStatus: ReturnType<typeof ref<ConnectionStatus>>; // 连接状态枚举
  notifications: ReturnType<typeof ref<Notification[]>>; // 通知消息列表
  onlineUsers: ReturnType<typeof ref<OnlineUser[]>>; // 在线用户列表
  onlineUserCount: ReturnType<typeof ref<number>>; // 在线用户数量
  currentRooms: ReturnType<typeof ref<string[]>>; // 当前用户加入的房间ID列表
  roomMembers: ReturnType<
    typeof ref<Record<string, Array<{ userId: number; userEmail: string; socketId: string }>>>
  >; // 各房间成员列表
  roomList: ReturnType<typeof ref<any[]>>; // 房间列表
  roomApplications: ReturnType<typeof ref<any[]>>; // 房间申请列表
  roomMessages: ReturnType<typeof ref<Record<string, RoomMessage[]>>>; // 各房间消息列表
  roomJoinedEvent: ReturnType<
    typeof ref<{
      roomId: string;
      roomName: string;
      message: string;
      timestamp: string;
    } | null>
  >; // 房间加入成功事件
  authStore: ReturnType<typeof useAuthStore>; // 认证状态管理
} | null = null;

// 连接状态标志，防止重复连接
let isConnecting = false;

// 认证失败标志，防止循环重连
let authFailed = false;

// 全局事件处理函数
let handleConnected: (data: { message: string; userId: number }) => void;
let handleDisconnected: () => void;
let handleError: (error: { message: string; code?: string }) => void;
let handleNotification: (notification: Notification) => void;
let handleSystemNotification: (notification: Notification) => void;
let handleRoomNotification: (notification: Notification) => void;
let handleOnlineUsers: (data: { users: OnlineUser[]; count: number }) => void;
let handleRoomJoined: (data: {
  room: string;
  roomName: string;
  message: string;
  timestamp: string;
}) => void;
let handleRoomLeft: (data: { room: string; message: string }) => void;
let handleRoomListUpdated: (data: {
  message: string;
  room: any;
  createdBy: number;
  createdByEmail: string;
  timestamp: string;
}) => void;
let handleRoomMembers: (data: {
  room: string;
  members: Array<{ userId: number; userEmail: string; socketId: string }>;
  count: number;
}) => void;
let handleUserJoinedRoom: (data: { userId: number; userEmail: string; room: string }) => void;
let handleUserLeftRoom: (data: { userId: number; userEmail: string; room: string }) => void;
let handleRoomApplicationReceived: (data: { application: any; room: any }) => void;
let handleApplicationSubmitted: (data: { application: any; message: string }) => void;
let handleApplicationProcessed: (data: { application: any; message: string }) => void;
let handleKickedFromRoom: (data: { room: any; message: string }) => void;
let handleUserKickedFromRoom: (data: { userId: number; userEmail: string; room: string }) => void;
let handleRoomOwnershipTransferred: (data: { room: any; oldOwner: any; newOwner: any }) => void;
let handleRoomDestroyed: (data: { room: any; message: string }) => void;
let handleRoomMessageReceived: (data: RoomMessage) => void;
let handleRoomHistory: (data: {
  roomId: string;
  roomName: string;
  messages: any[];
  timestamp: string;
}) => void;

/**
 * WebSocket 组合式函数
 *
 * @returns WebSocket 相关的响应式数据和方法
 */

/**
 * 添加通知到全局通知列表
 * @param notification 通知对象
 */
const addNotification = (notification: Notification) => {
  if (!globalState) {
    console.warn('尝试添加通知，但 globalState 未初始化');
    return;
  }
  // 确保 timestamp 是字符串格式，统一时间格式
  const normalizedNotification = {
    ...notification,
    timestamp:
      typeof notification.timestamp === 'string'
        ? notification.timestamp
        : notification.timestamp.toISOString(),
  };
  // 将新通知添加到列表顶部
  globalState.notifications.value?.unshift(normalizedNotification);
};

/**
 * WebSocket连接成功事件处理
 * 更新连接状态，重置认证失败标志，获取在线用户列表
 */
handleConnected = (_data: { message: string; userId: number }) => {
  if (!globalState) {
    console.warn('WebSocket 连接成功事件被触发，但 globalState 未初始化');
    return;
  }

  // 重置认证失败标志，允许重新连接
  authFailed = false;

  // 更新连接状态
  globalState.isConnected.value = true;
  globalState.connectionStatus.value = ConnectionStatus.CONNECTED;

  // 连接成功后获取在线用户列表
  websocketService.getOnlineUsers();
};

/**
 * WebSocket断开连接事件处理
 * 清空所有相关数据，重置连接状态
 */
handleDisconnected = () => {
  if (!globalState) {
    console.warn('WebSocket 断开连接事件被触发，但 globalState 未初始化');
    return;
  }

  // 更新连接状态
  globalState.isConnected.value = false;
  globalState.connectionStatus.value = ConnectionStatus.DISCONNECTED;

  // 清空在线用户数据
  globalState.onlineUsers.value = [];
  globalState.onlineUserCount.value = 0;

  // 清空房间相关数据
  globalState.currentRooms.value = [];
  (globalState as any).currentRoom.value = null;
  globalState.roomMembers.value = {};
  globalState.roomMessages.value = {};
  globalState.roomApplications.value = [];
  globalState.roomJoinedEvent.value = null;
};

handleError = (error: { message: string; code?: string }) => {
  if (!globalState) {
    console.warn('WebSocket 错误事件被触发，但 globalState 未初始化');
    return;
  }

  // 某些错误不应该影响连接状态
  const nonFatalErrors = ['ALREADY_MEMBER', 'NOT_MEMBER', 'INVALID_PARAMS', 'SERVICE_UNAVAILABLE'];
  const isNonFatalError = nonFatalErrors.includes(error.code || '');

  if (!isNonFatalError) {
    console.error('WebSocket 错误:', error);
    globalState.connectionStatus.value = ConnectionStatus.ERROR;
  } else {
    console.warn('WebSocket 非致命错误:', error);
  }

  // 只在特定错误时显示消息，避免过多错误提示
  if (error.message?.includes('认证失败') || error.message?.includes('AUTH_FAILED')) {
    ElMessage.error(`WebSocket 认证失败: ${error.message}`);
  } else if (error.message?.includes('连接失败')) {
    ElMessage.error(`WebSocket 连接失败: ${error.message}`);
  } else if (isNonFatalError) {
    // 非致命错误显示信息提示而不是错误提示
    ElMessage.info(error.message);
  } else {
    // 其他错误只记录日志，不显示消息
    console.warn('WebSocket 其他错误:', error);
  }
};

handleNotification = (notification: Notification) => {
  addNotification(notification);
  ElMessage.info(notification.title);
};

handleSystemNotification = (notification: Notification) => {
  addNotification(notification);
  ElMessage.warning(notification.title);
};

handleRoomNotification = (notification: Notification) => {
  addNotification(notification);
  ElMessage.info(`[房间] ${notification.title}`);
};

handleOnlineUsers = (data: { users: OnlineUser[]; count: number }) => {
  if (!globalState) {
    console.warn('WebSocket 在线用户事件被触发，但 globalState 未初始化');
    return;
  }
  globalState.onlineUsers.value = data.users;
  globalState.onlineUserCount.value = data.count;
};

handleRoomJoined = (data: {
  room: string;
  roomName: string;
  message: string;
  timestamp: string;
}) => {
  if (!globalState) {
    console.warn('WebSocket 房间加入事件被触发，但 globalState 未初始化');
    return;
  }
  if (!globalState.currentRooms.value?.includes(data.room)) {
    globalState.currentRooms.value?.push(data.room);
  }

  // 触发房间加入成功事件，让ChatRoomView可以设置当前房间
  globalState.roomJoinedEvent.value = {
    roomId: data.room,
    roomName: data.roomName,
    message: data.message,
    timestamp: data.timestamp,
  };

  // 只在真正加入新房间时显示成功消息，重新连接时不显示
  if (!data.message.includes('重新连接')) {
    ElMessage.success(data.message);
  }
};

handleRoomLeft = (data: { room: string; message: string }) => {
  if (!globalState) {
    console.warn('WebSocket 房间离开事件被触发，但 globalState 未初始化');
    return;
  }
  const index = globalState.currentRooms.value?.indexOf(data.room) ?? -1;
  if (index > -1) {
    globalState.currentRooms.value?.splice(index, 1);
  }
  // 清除房间成员数据
  if (globalState.roomMembers.value) {
    delete globalState.roomMembers.value[data.room];
  }
  ElMessage.success(data.message);
};

handleRoomListUpdated = (data: {
  message: string;
  room: any;
  createdBy?: number;
  createdByEmail?: string;
  timestamp: string;
}) => {
  if (!globalState) {
    console.warn('WebSocket 房间列表更新事件被触发，但 globalState 未初始化');
    return;
  }

  // 更新房间列表
  if (globalState.roomList.value) {
    // 检查房间是否已存在
    const existingIndex = globalState.roomList.value.findIndex(r => r.id === data.room.id);
    if (existingIndex >= 0) {
      // 更新现有房间（包括在线人数）
      globalState.roomList.value[existingIndex] = data.room;
    } else {
      // 添加新房间
      globalState.roomList.value.push(data.room);
    }
  }

  // 只在创建新房间时显示通知消息，在线人数更新时不显示
  if (data.createdBy && data.createdByEmail) {
    ElMessage.info(data.message);
  }
};

handleRoomMembers = (data: {
  room: string;
  members: Array<{ userId: number; userEmail: string; socketId: string }>;
  count: number;
}) => {
  if (!globalState) {
    console.warn('WebSocket 房间成员事件被触发，但 globalState 未初始化');
    return;
  }
  if (globalState.roomMembers.value) {
    globalState.roomMembers.value[data.room] = data.members;
  }
};

handleUserJoinedRoom = (_data: { userId: number; userEmail: string; room: string }) => {
  if (!globalState) {
    console.warn('WebSocket 用户加入房间事件被触发，但 globalState 未初始化');
    return;
  }
};

handleUserLeftRoom = (_data: { userId: number; userEmail: string; room: string }) => {
  if (!globalState) {
    console.warn('WebSocket 用户离开房间事件被触发，但 globalState 未初始化');
    return;
  }
};

handleRoomApplicationReceived = (_data: { application: any; room: any }) => {
  if (!globalState) {
    console.warn('WebSocket 房间申请事件被触发，但 globalState 未初始化');
    return;
  }
};

handleApplicationSubmitted = (_data: { application: any; message: string }) => {
  if (!globalState) {
    console.warn('WebSocket 申请提交事件被触发，但 globalState 未初始化');
    return;
  }
};

handleApplicationProcessed = (_data: { application: any; message: string }) => {
  if (!globalState) {
    console.warn('WebSocket 申请处理事件被触发，但 globalState 未初始化');
    return;
  }
};

handleKickedFromRoom = (_data: { room: any; message: string }) => {
  if (!globalState) {
    console.warn('WebSocket 被踢出房间事件被触发，但 globalState 未初始化');
    return;
  }
};

handleUserKickedFromRoom = (_data: { userId: number; userEmail: string; room: string }) => {
  if (!globalState) {
    console.warn('WebSocket 用户被踢出房间事件被触发，但 globalState 未初始化');
    return;
  }
};

handleRoomOwnershipTransferred = (_data: { room: any; oldOwner: any; newOwner: any }) => {
  if (!globalState) {
    console.warn('WebSocket 房主权限转让事件被触发，但 globalState 未初始化');
    return;
  }
};

handleRoomDestroyed = (data: { room: any; message: string }) => {
  if (!globalState) {
    console.warn('WebSocket 房间销毁事件被触发，但 globalState 未初始化');
    return;
  }

  // 从房间列表中移除被销毁的房间
  if (globalState.roomList.value) {
    const roomIndex = globalState.roomList.value.findIndex(r => r.id === data.room.id);
    if (roomIndex >= 0) {
      globalState.roomList.value.splice(roomIndex, 1);
    }
  }

  // 从当前房间列表中移除
  if (globalState.currentRooms.value) {
    const currentRoomIndex = globalState.currentRooms.value.indexOf(data.room.id);
    if (currentRoomIndex >= 0) {
      globalState.currentRooms.value.splice(currentRoomIndex, 1);
    }
  }

  // 清理房间相关数据
  if (globalState.roomMessages.value) {
    delete globalState.roomMessages.value[data.room.id];
  }
  if (globalState.roomMembers.value) {
    delete globalState.roomMembers.value[data.room.id];
  }

  // 如果当前正在查看被销毁的房间，清空当前房间
  if ((globalState as any).currentRoom.value?.id === data.room.id) {
    (globalState as any).currentRoom.value = null;
  }

  ElMessage.warning(data.message);
};

handleRoomMessageReceived = (data: RoomMessage) => {
  if (!globalState) {
    console.warn('WebSocket 房间消息事件被触发，但 globalState 未初始化');
    return;
  }

  // 将消息添加到对应房间的消息列表中
  if (!globalState.roomMessages.value) {
    globalState.roomMessages.value = {};
  }
  if (!globalState.roomMessages.value[data.roomId]) {
    globalState.roomMessages.value[data.roomId] = [];
  }
  globalState.roomMessages.value[data.roomId].push(data);
};

handleRoomHistory = (data: {
  roomId: string;
  roomName: string;
  messages: any[];
  timestamp: string;
}) => {
  if (!globalState) {
    console.warn('WebSocket 房间历史消息事件被触发，但 globalState 未初始化');
    return;
  }

  // 将历史消息设置到对应房间的消息列表中
  if (!globalState.roomMessages.value) {
    globalState.roomMessages.value = {};
  }
  globalState.roomMessages.value[data.roomId] = data.messages;
};

export function useWebSocket() {
  // 如果全局状态不存在，创建它
  if (!globalState) {
    console.log('useWebSocket: 创建全局状态');
    globalState = {
      isConnected: ref(false),
      connectionStatus: ref<ConnectionStatus>(ConnectionStatus.DISCONNECTED),
      notifications: ref<Notification[]>([]),
      onlineUsers: ref<OnlineUser[]>([]),
      onlineUserCount: ref(0),
      currentRooms: ref<string[]>([]),
      currentRoom: ref<any>(null),
      roomMembers: ref<
        Record<string, Array<{ userId: number; userEmail: string; socketId: string }>>
      >({}),
      roomList: ref<any[]>([]),
      roomApplications: ref<any[]>([]),
      roomMessages: ref<Record<string, RoomMessage[]>>({}),
      roomJoinedEvent: ref<{
        roomId: string;
        roomName: string;
        message: string;
        timestamp: string;
      } | null>(null),
      authStore: useAuthStore(),
    } as any;

    // 设置事件监听器（只设置一次）
    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);
    websocketService.on('error', handleError);
    websocketService.on('notification', handleNotification);
    websocketService.on('system_notification', handleSystemNotification);
    websocketService.on('room_notification', handleRoomNotification);
    websocketService.on('online_users', handleOnlineUsers);
    websocketService.on('room_joined', handleRoomJoined);
    websocketService.on('room_left', handleRoomLeft);
    websocketService.on('room_list_updated', handleRoomListUpdated);
    websocketService.on('room_members', handleRoomMembers);
    websocketService.on('user_joined_room', handleUserJoinedRoom);
    websocketService.on('user_left_room', handleUserLeftRoom);
    websocketService.on('room_application', handleRoomApplicationReceived);
    websocketService.on('application_submitted', handleApplicationSubmitted);
    websocketService.on('application_processed', handleApplicationProcessed);
    websocketService.on('kicked_from_room', handleKickedFromRoom);
    websocketService.on('user_kicked_from_room', handleUserKickedFromRoom);
    websocketService.on('room_ownership_transferred', handleRoomOwnershipTransferred);
    websocketService.on('room_destroyed', handleRoomDestroyed);
    websocketService.on('room_message_received', handleRoomMessageReceived);
    websocketService.on('room_history', handleRoomHistory);

    // 延迟加载房间列表，只在需要时加载
    // 避免在不需要聊天功能的页面（如监控页面）自动加载房间列表
    console.log('useWebSocket: 全局状态已创建，房间列表将在需要时加载');
  }

  // 使用全局状态
  const {
    isConnected,
    connectionStatus,
    notifications,
    onlineUsers,
    onlineUserCount,
    currentRooms,
    roomMembers,
    roomList,
    roomApplications,
    roomMessages,
    roomJoinedEvent,
    authStore,
  } = globalState!;

  // 重连状态信息
  const reconnectInfo = computed(() => websocketService.getReconnectInfo());

  const currentRoom = (globalState as any).currentRoom;

  // 计算属性
  const statusText = computed(() => {
    switch (connectionStatus.value) {
      case ConnectionStatus.CONNECTED:
        return '已连接';
      case ConnectionStatus.CONNECTING:
        return '连接中...';
      case ConnectionStatus.RECONNECTING:
        return '重连中...';
      case ConnectionStatus.DISCONNECTED:
        return '未连接';
      case ConnectionStatus.ERROR:
        return '连接错误';
      default:
        return '未知状态';
    }
  });

  const statusColor = computed(() => {
    switch (connectionStatus.value) {
      case ConnectionStatus.CONNECTED:
        return 'success';
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        return 'warning';
      case ConnectionStatus.DISCONNECTED:
        return 'info';
      case ConnectionStatus.ERROR:
        return 'danger';
      default:
        return 'info';
    }
  });

  const unreadCount = computed(() => {
    return notifications.value?.filter(n => !n.read).length || 0;
  });

  /**
   * 连接 WebSocket
   * 检查认证状态，防止重复连接，处理连接错误
   */
  const connect = async () => {
    if (isConnecting) {
      return;
    }

    // 如果之前认证失败，需要用户重新登录
    if (authFailed) {
      ElMessage.error('认证已失效，请重新登录');
      window.location.href = '/login';
      return;
    }

    // 检查是否有有效的认证令牌
    if (!authStore.token) {
      ElMessage.error('未找到认证令牌');
      return;
    }

    isConnecting = true;

    // 重置状态，确保重连时状态正确
    connectionStatus.value = ConnectionStatus.CONNECTING;
    isConnected.value = false;

    // 清空在线用户数据，避免显示过期数据
    onlineUsers.value = [];
    onlineUserCount.value = 0;

    try {
      await websocketService.connect(authStore.token);
      isConnecting = false;
    } catch (error: any) {
      isConnecting = false;

      // 认证失败时清理token并跳转登录
      if (error.message?.includes('认证失败')) {
        authFailed = true; // 设置认证失败标志
        ElMessage.error('认证失败，请重新登录');

        // 重置状态，避免循环
        connectionStatus.value = ConnectionStatus.ERROR;
        isConnected.value = false;

        // 清理认证信息，防止页面跳转循环
        authStore.clearAuthInfo();

        // 延迟跳转，确保状态更新完成
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
        return;
      }

      connectionStatus.value = ConnectionStatus.ERROR;
      isConnected.value = false;
      ElMessage.error(`连接失败: ${error.message}`);
    }
  };

  /**
   * 断开 WebSocket 连接
   * 重置所有状态，清空数据，断开连接
   */
  const disconnect = () => {
    // 重置所有状态
    isConnecting = false;

    // 先更新状态，再断开连接
    connectionStatus.value = ConnectionStatus.DISCONNECTED;
    isConnected.value = false;

    // 断开WebSocket连接
    websocketService.disconnect();

    // 清空在线用户数据
    onlineUsers.value = [];
    onlineUserCount.value = 0;
  };

  /**
   * 获取在线用户列表
   * 只有在连接状态下才发送请求
   */
  const getOnlineUsers = () => {
    if (isConnected.value) {
      websocketService.getOnlineUsers();
    }
  };

  /**
   * 加入房间
   * 检查连接状态，发送加入房间请求
   */
  const joinRoom = (room: string) => {
    if (isConnected.value) {
      websocketService.joinRoom(room);
    } else {
      console.warn('useWebSocket: WebSocket未连接，无法加入房间');
    }
  };

  /**
   * 离开房间
   */
  const leaveRoom = (room: string, isOwner?: boolean, userId?: number, memberCount?: number) => {
    if (isConnected.value) {
      websocketService.leaveRoom(room, isOwner, userId, memberCount);
      ElMessage.info(`已离开房间: ${room}`);
    }
  };

  /**
   * 标记通知为已读
   */
  const markAsRead = (notificationId: string) => {
    const notification = notifications.value?.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  };

  /**
   * 清空通知
   */
  const clearNotifications = () => {
    notifications.value = [];
  };

  /**
   * 清理资源
   */
  const cleanup = () => {
    // 注意：不在这里断开连接，因为其他组件可能还在使用
    // 只清理本地状态
    isConnecting = false;
    authFailed = false; // 重置认证失败标志
  };

  // 组件挂载时自动连接
  onMounted(() => {
    // 只有在用户已认证且WebSocket未连接且不在连接中时才自动连接
    if (authStore.isAuthenticated && !isConnected.value && !isConnecting) {
      connect();
    }
  });

  // 房间管理方法
  const getRoomMembers = (room: string) => {
    websocketService.getRoomMembers(room);
  };

  const applyToRoom = (roomId: string, message?: string) => {
    websocketService.applyToRoom(roomId, message);
  };

  const handleRoomApplication = (applicationId: string, action: 'approve' | 'reject') => {
    websocketService.handleRoomApplication(applicationId, action);
  };

  const kickRoomMember = (roomId: string, targetUserId: number) => {
    websocketService.kickRoomMember(roomId, targetUserId);
  };

  const transferRoomOwnership = (roomId: string, newOwnerId: number) => {
    websocketService.transferRoomOwnership(roomId, newOwnerId);
  };

  // 组件卸载时清理资源
  onUnmounted(() => {
    cleanup();
  });

  // 房间消息相关方法
  const sendRoomMessage = (roomId: string, message: string, roomName?: string) => {
    websocketService.sendRoomMessage(roomId, message, roomName);
  };

  const getRoomHistory = (roomId: string, roomName?: string) => {
    websocketService.getRoomHistory(roomId, roomName);
  };

  const getRoomMessages = (roomId: string) => {
    return roomMessages.value?.[roomId] || [];
  };

  const getRoomList = async (forceRefresh = false) => {
    try {
      console.log('useWebSocket: 调用getRoomList API, forceRefresh:', forceRefresh);

      // 如果强制刷新或者没有房间列表数据，则重新加载
      if (
        forceRefresh ||
        !globalState ||
        !globalState.roomList.value ||
        globalState.roomList.value.length === 0
      ) {
        console.log('useWebSocket: 重新加载房间列表');
        const rooms = await roomApi.getRoomList();
        console.log('useWebSocket: getRoomList API返回:', rooms);
        if (globalState) {
          globalState.roomList.value = rooms;
          console.log('useWebSocket: 更新globalState.roomList:', globalState.roomList.value);
        }
        return rooms;
      } else {
        console.log('useWebSocket: 使用缓存的房间列表');
        return globalState.roomList.value;
      }
    } catch (error) {
      console.error('获取房间列表失败:', error);
      throw error;
    }
  };

  return {
    // 状态
    isConnected,
    connectionStatus,
    statusText,
    statusColor,
    reconnectInfo,
    notifications,
    onlineUsers,
    onlineUserCount,
    unreadCount,
    currentRooms,
    currentRoom,
    roomMembers,
    roomList,
    roomApplications,
    roomMessages,
    roomJoinedEvent,

    // 方法
    connect,
    disconnect,
    getOnlineUsers,
    joinRoom,
    leaveRoom,
    getRoomMembers,
    applyToRoom,
    handleRoomApplication,
    kickRoomMember,
    transferRoomOwnership,
    markAsRead,
    clearNotifications,
    sendRoomMessage,
    getRoomHistory,
    getRoomMessages,
    getRoomList,
  };
}
