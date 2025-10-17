/**
 * 通知相关API接口
 *
 * 提供发送测试通知、系统通知等功能
 */
import httpClient from '@/utils/httpClient';

/**
 * 发送测试通知的请求参数
 */
export interface SendTestNotificationRequest {
  type?: 'system' | 'user' | 'info' | 'warning' | 'error';
  title?: string;
  message?: string;
  targetUserId?: number; // 如果指定，则发送给特定用户；否则发送给当前用户
}

/**
 * 发送系统通知的请求参数
 */
export interface SendSystemNotificationRequest {
  type?: 'system' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  notification?: any;
}

/**
 * 发送测试通知
 * 用于WebSocket演示页面测试通知功能
 *
 * @param data - 通知内容
 * @returns API响应
 */
export const sendTestNotification = async (
  data: SendTestNotificationRequest = {},
): Promise<ApiResponse> => {
  const response = await httpClient.post('/notifications/test', data);
  return response;
};

/**
 * 发送系统广播通知
 * 向所有在线用户发送系统通知
 *
 * @param data - 通知内容
 * @returns API响应
 */
export const sendBroadcastNotification = async (
  data: SendSystemNotificationRequest,
): Promise<ApiResponse> => {
  const response = await httpClient.post('/notifications/broadcast', data);
  return response;
};

/**
 * 发送房间通知
 * 向指定房间的所有用户发送通知
 *
 * @param data - 通知内容
 * @returns API响应
 */
export const sendRoomNotification = async (
  data: SendSystemNotificationRequest,
): Promise<ApiResponse> => {
  const response = await httpClient.post('/notifications/room/test-room', data);
  return response;
};
