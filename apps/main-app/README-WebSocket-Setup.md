# WebSocket 前端集成说明

## 安装依赖

在 `apps/main-app` 目录下运行以下命令安装 socket.io-client：

```bash
# 方法1：使用 npm
npm install socket.io-client

# 方法2：使用 yarn
yarn add socket.io-client

# 方法3：使用 pnpm
pnpm add socket.io-client

# 方法4：如果上述方法失败，尝试指定版本
npm install socket.io-client@4.7.4
```

## 功能特性

### 1. WebSocket 服务类 (`src/utils/websocket.ts`)

- **连接管理**：自动连接、重连机制
- **认证集成**：与现有 JWT 认证系统集成
- **事件系统**：支持自定义事件监听和触发
- **状态管理**：连接状态跟踪
- **错误处理**：完善的错误处理和用户提示

### 2. Vue 组合式函数 (`src/composables/useWebSocket.ts`)

- **响应式状态**：连接状态、通知列表、在线用户
- **自动管理**：组件挂载时自动连接，卸载时自动断开
- **便捷方法**：提供连接、断开、发送消息等便捷方法

### 3. WebSocket 状态组件 (`src/components/WebSocketStatus.vue`)

- **状态指示器**：显示连接状态和未读通知数量
- **通知中心**：下拉式通知列表
- **在线用户**：显示当前在线用户数量

### 4. WebSocket 演示页面 (`src/views/WebSocketDemo.vue`)

- **功能测试**：连接、断开、发送消息等功能测试
- **实时监控**：在线用户列表、通知历史
- **房间管理**：加入/离开房间功能

## 使用方法

### 在组件中使用

```vue
<template>
  <div>
    <el-button @click="toggleConnection">
      {{ isConnected ? '断开' : '连接' }}
    </el-button>
    <div>状态: {{ statusText }}</div>
    <div>在线用户: {{ onlineUserCount }}</div>
  </div>
</template>

<script setup lang="ts">
import { useWebSocket } from '@/composables/useWebSocket';

const { isConnected, statusText, onlineUserCount, connect, disconnect } = useWebSocket();

const toggleConnection = () => {
  if (isConnected.value) {
    disconnect();
  } else {
    connect();
  }
};
</script>
```

### 在导航栏中显示状态

WebSocket 状态组件已经集成到 `AppNavigation.vue` 中，会自动显示连接状态和通知。

### 访问演示页面

在仪表板中点击 "WebSocket 演示" 卡片，或直接访问 `/websocket-demo` 路由。

## 配置说明

### 服务器地址配置

WebSocket 服务会自动使用当前页面的域名和协议，连接到 `/notifications` 命名空间。

如果需要自定义服务器地址，可以在连接时传入：

```typescript
await websocketService.connect(token, 'http://your-server:3000');
```

### 事件类型

支持以下事件类型：

- `connected` - 连接成功
- `disconnected` - 连接断开
- `error` - 连接错误
- `notification` - 个人通知
- `system_notification` - 系统通知
- `room_notification` - 房间通知
- `online_users` - 在线用户列表

## 故障排除

### 1. 安装失败

如果 `socket.io-client` 安装失败，尝试：

- 清除缓存：`npm cache clean --force`
- 使用不同包管理器
- 指定具体版本号

### 2. 连接失败

- 检查后端 WebSocket 服务是否运行
- 确认端口和路径配置正确
- 检查网络连接和防火墙设置

### 3. 认证失败

- 确认用户已登录
- 检查 JWT token 是否有效
- 查看浏览器控制台错误信息

## 开发建议

1. **错误处理**：始终处理连接错误和网络异常
2. **状态管理**：使用响应式状态管理连接状态
3. **内存管理**：及时清理事件监听器避免内存泄漏
4. **用户体验**：提供清晰的连接状态反馈
5. **性能优化**：限制通知数量，避免内存占用过多
