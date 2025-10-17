/**
 * 通知模块
 *
 * 提供通知相关的功能模块
 */
import { Module } from '@nestjs/common';
import { WebSocketModule } from '../websocket/websocket.module';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [WebSocketModule], // 导入WebSocket模块以使用其服务
  controllers: [NotificationsController],
})
export class NotificationsModule {}
