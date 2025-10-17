# WebSocket 装饰器和方法详解

## 概述

本文档详细解释了 NestJS WebSocket 模块中使用的装饰器和接口，以及它们在实时通知系统中的应用。

## 核心装饰器

### 1. @WebSocketGateway

**作用**: 将类标记为 WebSocket 网关，用于处理 WebSocket 连接和消息。

**语法**:

```typescript
@WebSocketGateway(options)
export class MyGateway {
  // 网关实现
}
```

**配置选项**:

```typescript
@WebSocketGateway({
  namespace: 'notifications',  // WebSocket 命名空间
  cors: {                      // 跨域配置
    origin: 'http://localhost:3000',
    credentials: true
  },
  transports: ['websocket'],   // 传输协议
  allowEIO3: true             // 允许 Engine.IO v3
})
```

**详细说明**:

- **namespace**: 用于区分不同的 WebSocket 服务，客户端连接时需要指定相同的命名空间
- **cors**: 配置跨域资源共享，允许前端应用连接
- **transports**: 指定传输协议，默认支持 WebSocket 和轮询
- **allowEIO3**: 兼容性选项，允许旧版本的 Engine.IO 客户端连接

### 2. @WebSocketServer

**作用**: 自动注入 Socket.IO 服务器实例到类属性中。

**语法**:

```typescript
@WebSocketServer()
server: Server;
```

**功能**:

- 提供对 Socket.IO 服务器的完全访问
- 用于发送消息、管理房间、广播等操作
- 自动由 NestJS 依赖注入系统管理

### 3. @SubscribeMessage

**作用**: 将方法标记为消息处理器，当客户端发送指定消息时自动调用。

**语法**:

```typescript
@SubscribeMessage('message_name')
handleMessage(client: Socket, data: any) {
  // 处理消息
}
```

**参数说明**:

- **message_name**: 客户端发送的消息名称
- **client**: 发送消息的客户端 Socket 实例
- **data**: 客户端发送的数据

**使用示例**:

```typescript
@SubscribeMessage('get_online_users')
handleGetOnlineUsers(client: Socket) {
  // 处理获取在线用户列表的请求
  const onlineUsers = this.getOnlineUsers();
  client.emit('online_users', onlineUsers);
}
```

## 生命周期接口

### 1. OnGatewayInit

**作用**: 定义 WebSocket 服务器初始化完成后的回调。

**实现方法**:

```typescript
afterInit(server: Server) {
  // 服务器初始化完成后的逻辑
  this.logger.log('WebSocket 服务器已启动');
}
```

**使用场景**:

- 初始化全局配置
- 设置服务器级别的中间件
- 记录启动日志

### 2. OnGatewayConnection

**作用**: 处理客户端连接建立时的逻辑。

**实现方法**:

```typescript
async handleConnection(client: Socket) {
  // 处理新连接
  const token = client.handshake.auth.token;
  // 验证用户身份
  // 存储连接信息
}
```

**使用场景**:

- 用户身份验证
- 连接信息存储
- 初始化用户状态

### 3. OnGatewayDisconnect

**作用**: 处理客户端断开连接时的清理逻辑。

**实现方法**:

```typescript
handleDisconnect(client: Socket) {
  // 清理连接信息
  this.removeUserConnection(client.id);
  this.logger.log('用户断开连接');
}
```

**使用场景**:

- 清理用户连接信息
- 更新在线状态
- 释放相关资源

## 消息发送方法

### 1. 向单个客户端发送消息

```typescript
// 向特定客户端发送消息
client.emit('event_name', data);

// 向特定 Socket ID 发送消息
this.server.to(socketId).emit('event_name', data);
```

### 2. 向房间发送消息

```typescript
// 向指定房间发送消息
this.server.to('room_name').emit('event_name', data);

// 向多个房间发送消息
this.server.to(['room1', 'room2']).emit('event_name', data);
```

### 3. 广播消息

```typescript
// 向所有连接的客户端广播
this.server.emit('event_name', data);

// 向除发送者外的所有客户端广播
socket.broadcast.emit('event_name', data);
```

## 房间管理

### 1. 加入房间

```typescript
// 客户端加入房间
client.join('room_name');

// 加入多个房间
client.join(['room1', 'room2']);
```

### 2. 离开房间

```typescript
// 客户端离开房间
client.leave('room_name');
```

### 3. 房间查询

```typescript
// 获取房间中的所有 Socket
const sockets = await this.server.in('room_name').fetchSockets();

// 检查房间是否存在
const roomExists = this.server.sockets.adapter.rooms.has('room_name');
```

## 认证和中间件

### 1. JWT 认证示例

```typescript
async handleConnection(client: Socket) {
  try {
    const token = client.handshake.auth.token;
    const payload = this.jwtService.verify(token);

    // 存储用户信息
    client.data.userId = payload.sub;
    client.data.userEmail = payload.email;

  } catch (error) {
    client.disconnect();
  }
}
```

### 2. 中间件使用

```typescript
// 在网关类中使用中间件
@UseGuards(JwtAuthGuard)
@WebSocketGateway()
export class MyGateway {
  // 网关实现
}
```

## 错误处理

### 1. 连接错误处理

```typescript
async handleConnection(client: Socket) {
  try {
    // 连接逻辑
  } catch (error) {
    this.logger.error('连接失败:', error);
    client.emit('error', { message: '连接失败' });
    client.disconnect();
  }
}
```

### 2. 消息错误处理

```typescript
@SubscribeMessage('message_name')
handleMessage(client: Socket, data: any) {
  try {
    // 处理消息
  } catch (error) {
    client.emit('error', { message: '消息处理失败' });
  }
}
```

## 性能优化

### 1. 连接池管理

```typescript
// 限制最大连接数
@WebSocketGateway({
  maxHttpBufferSize: 1e6, // 1MB
  pingTimeout: 60000,     // 60秒
  pingInterval: 25000     // 25秒
})
```

### 2. 内存管理

```typescript
// 定期清理无效连接
setInterval(() => {
  this.cleanupInactiveConnections();
}, 30000); // 每30秒清理一次
```

## 最佳实践

### 1. 消息格式标准化

```typescript
interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  userId?: number;
}
```

### 2. 事件命名规范

```typescript
// 使用动词+名词的命名方式
@SubscribeMessage('get_user_list')
@SubscribeMessage('send_message')
@SubscribeMessage('join_room')
```

### 3. 日志记录

```typescript
// 记录重要操作
this.logger.log(`用户 ${userId} 发送消息: ${event}`);
this.logger.warn(`用户 ${userId} 认证失败`);
this.logger.error(`消息处理失败: ${error.message}`);
```

## 客户端连接示例

```javascript
// 前端连接 WebSocket
const socket = io('ws://localhost:3000/notifications', {
  auth: {
    token: 'your-jwt-token',
  },
});

// 监听连接成功
socket.on('connected', (data) => {
  console.log('连接成功:', data);
});

// 发送消息
socket.emit('get_online_users');

// 监听消息
socket.on('online_users', (data) => {
  console.log('在线用户:', data);
});
```

## 总结

WebSocket 装饰器和接口提供了强大的实时通信功能：

- **@WebSocketGateway**: 定义 WebSocket 服务
- **@WebSocketServer**: 注入服务器实例
- **@SubscribeMessage**: 处理客户端消息
- **OnGatewayInit**: 服务器初始化回调
- **OnGatewayConnection**: 连接处理
- **OnGatewayDisconnect**: 断开连接处理

通过合理使用这些装饰器和接口，可以构建出功能完整、性能优良的实时通知系统。
