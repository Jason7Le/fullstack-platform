/**
 * WebSocket 通知服务
 *
 * 提供实时通知功能，包括：
 * - 用户个人通知
 * - 系统广播通知
 * - 房间群组通知
 *
 *
 *
 * 通过 NotificationsGateway 发送 WebSocket 消息
 */
import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gatway';

/**
 * 通知消息接口
 * 定义通知消息的数据结构
 */
export interface Notification {
  id: string; // 通知唯一标识
  type: 'system' | 'user' | 'info' | 'warning' | 'error'; // 通知类型
  title: string; // 通知标题
  message: string; // 通知内容
  timestamp: Date; // 创建时间
  read: boolean; // 是否已读
  data?: any; // 附加数据
}

/**
 * 通知服务类
 * 封装各种通知发送逻辑
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  /**
   * 生成唯一通知ID
   * 使用时间戳和随机数组合生成
   *
   * @returns 唯一ID字符串
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 发送用户个人通知
   * 向指定用户发送通知消息
   *
   * @param userId - 目标用户ID
   * @param notification - 通知内容（不包含id、timestamp、read字段）
   * @returns 完整的通知对象
   */
  sendUserNotification(
    userId: number,
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>,
  ) {
    const fullNotification: Notification = {
      id: this.generateId(),
      ...notification,
      timestamp: new Date(),
      read: false,
    };
    this.notificationsGateway.sendToUser(
      userId,
      'notification',
      fullNotification,
    );
    return fullNotification;
  }

  /**
   * 发送系统广播通知
   * 向所有在线用户广播系统通知
   *
   * @param notification - 通知内容（不包含id、timestamp、read字段）
   * @returns 完整的通知对象
   */
  sendBroadcast(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const fullNotification: Notification = {
      id: this.generateId(),
      ...notification,
      timestamp: new Date(),
      read: false,
    };
    this.notificationsGateway.broadcast(
      'system_notification',
      fullNotification,
    );
    return fullNotification;
  }

  /**
   * 发送房间通知
   * 向指定房间的所有用户发送通知
   *
   * @param room - 房间名称
   * @param notification - 通知内容（不包含id、timestamp、read字段）
   * @returns 完整的通知对象
   */
  sendToRoom(
    room: string,
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>,
  ) {
    const fullNotification: Notification = {
      id: this.generateId(),
      ...notification,
      timestamp: new Date(),
      read: false,
    };
    this.notificationsGateway.sendToRoom(
      room,
      'room_notification',
      fullNotification,
    );
    return fullNotification;
  }
}
