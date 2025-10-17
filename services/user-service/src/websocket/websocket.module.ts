/**
 * WebSocket 模块
 *
 * 提供实时通信功能，包括：
 * - WebSocket 连接管理
 * - 实时通知发送
 * - 用户认证和授权
 * - 消息广播和房间管理
 *
 * 依赖模块：
 * - AuthModule: 认证模块，包含已配置的JWT模块
 * - UsersModule: 提供用户数据访问功能
 */
import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { RoomsModule } from 'src/rooms/rooms.module';
import { NotificationsGateway } from './notifications.gatway';
import { NotificationsService } from './notifications.service';

/**
 * WebSocket 模块配置
 *
 * 模块功能：
 * - 管理 WebSocket 网关和服务
 * - 提供实时通知功能
 * - 处理用户连接和消息传递
 */
@Module({
  // 导入依赖模块
  imports: [
    forwardRef(() => AuthModule), // 使用 forwardRef 解决循环依赖
    forwardRef(() => UsersModule), // 使用 forwardRef 解决循环依赖
    forwardRef(() => RoomsModule), // 使用 forwardRef 解决循环依赖
  ],

  // 模块提供者
  providers: [
    NotificationsGateway, // WebSocket 网关，处理连接和消息
    NotificationsService, // 通知服务，封装通知发送逻辑
  ],

  // 导出服务供其他模块使用
  exports: [
    NotificationsService, // 导出通知服务，供其他模块调用
    NotificationsGateway, // 导出通知网关，供其他模块调用
  ],
})
export class WebSocketModule {}
