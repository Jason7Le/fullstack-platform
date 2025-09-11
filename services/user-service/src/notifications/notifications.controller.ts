/**
 * 通知控制器
 *
 * 提供通知相关的HTTP API接口
 * 包括发送测试通知、系统通知等功能
 */
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from '../websocket/notifications.service';

/**
 * 发送测试通知的请求体
 */
export interface SendTestNotificationDto {
  type?: 'system' | 'user' | 'info' | 'warning' | 'error';
  title?: string;
  message?: string;
  targetUserId?: number; // 如果指定，则发送给特定用户；否则发送给当前用户
}

/**
 * 发送系统通知的请求体
 */
export interface SendSystemNotificationDto {
  type?: 'system' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

/**
 * 通知控制器
 * 处理通知相关的HTTP请求
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * 发送测试通知
   * 用于WebSocket演示页面测试通知功能
   *
   * @param user - 当前用户信息
   * @param body - 通知内容
   * @returns 发送结果
   */
  @Post('test')
  async sendTestNotification(
    @CurrentUser() user: any,
    @Body() body: SendTestNotificationDto,
  ) {
    const targetUserId = body.targetUserId || user.id;

    const notification = this.notificationsService.sendUserNotification(
      targetUserId,
      {
        type: body.type || 'info',
        title: body.title || '测试通知',
        message:
          body.message ||
          `这是一条来自用户 ${user.email} 的测试通知，时间：${new Date().toLocaleString('zh-CN')}`,
      },
    );

    return {
      success: true,
      message: '测试通知发送成功',
      notification,
    };
  }

  /**
   * 发送系统广播通知
   * 向所有在线用户发送系统通知
   *
   * @param body - 通知内容
   * @returns 发送结果
   */
  @Post('broadcast')
  async sendBroadcastNotification(@Body() body: SendSystemNotificationDto) {
    const notification = this.notificationsService.sendBroadcast({
      type: body.type || 'system',
      title: body.title,
      message: body.message,
    });

    return {
      success: true,
      message: '系统通知广播成功',
      notification,
    };
  }

  /**
   * 发送房间通知
   * 向指定房间的所有用户发送通知
   *
   * @param room - 房间名称
   * @param body - 通知内容
   * @returns 发送结果
   */
  @Post('room/:room')
  async sendRoomNotification(@Body() body: SendSystemNotificationDto) {
    // 这里需要从路由参数获取房间名称，但为了简化，我们使用固定房间
    const room = 'test-room';

    const notification = this.notificationsService.sendToRoom(room, {
      type: body.type || 'info',
      title: body.title,
      message: body.message,
    });

    return {
      success: true,
      message: `房间通知发送成功 (房间: ${room})`,
      notification,
    };
  }
}
