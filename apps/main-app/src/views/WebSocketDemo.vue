<template>
  <div class="websocket-demo-container">
    <!-- 页面头部 -->
    <PageHeader
      title="WebSocket 演示"
      subtitle="实时通信功能演示"
      :icon="Connection"
      theme="teal"
    />

    <!-- 主要内容区域 -->
    <div class="main-content">
      <div class="websocket-demo">
        <!-- 连接状态卡片 -->
        <el-card class="status-card">
          <template #header>
            <div class="card-header">
              <span>连接状态</span>
              <div class="header-actions">
                <el-tag :type="statusColor" size="small">
                  {{ statusText }}
                </el-tag>
                <el-button
                  :type="isConnected ? 'danger' : 'success'"
                  :icon="isConnected ? 'Close' : 'Connection'"
                  @click="toggleConnection"
                  :loading="
                    connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
                  "
                  size="small"
                >
                  {{ isConnected ? '断开连接' : '连接' }}
                </el-button>
              </div>
            </div>
          </template>

          <div class="status-info">
            <div class="status-item">
              <span class="label">连接状态:</span>
              <span :class="['value', statusColor]">{{ statusText }}</span>
            </div>

            <div class="status-item" v-if="isConnected">
              <span class="label">在线用户:</span>
              <span class="value">{{ onlineUserCount }} 人</span>
            </div>

            <div class="status-item">
              <span class="label">未读通知:</span>
              <span class="value">{{ unreadCount }} 条</span>
            </div>
          </div>
        </el-card>

        <!-- 功能测试卡片 -->
        <el-card class="test-card" v-if="isConnected">
          <template #header>
            <span>功能测试</span>
          </template>

          <div class="test-buttons">
            <el-button @click="handleSendTestNotification" type="primary"> 发送个人通知 </el-button>

            <el-button @click="handleSendBroadcastNotification" type="warning">
              发送系统通知
            </el-button>

            <el-button @click="handleSendRoomNotification" type="success"> 发送房间通知 </el-button>

            <el-button @click="joinTestRoom" type="info"> 加入测试房间 </el-button>

            <el-button @click="leaveTestRoom" type="danger"> 离开测试房间 </el-button>

            <el-button @click="getOnlineUsers" type="info"> 获取在线用户 </el-button>
          </div>
        </el-card>

        <!-- 在线用户列表 -->
        <el-card class="users-card" v-if="isConnected && onlineUsers && onlineUsers.length > 0">
          <template #header>
            <div class="card-header">
              <span>在线用户 ({{ onlineUserCount }})</span>
              <el-button type="primary" icon="Refresh" @click="getOnlineUsers" size="small">
                刷新在线用户
              </el-button>
            </div>
          </template>

          <div class="users-list">
            <div v-for="user in onlineUsers" :key="user.userId" class="user-item">
              <el-avatar
                :size="32"
                :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`"
              />
              <div class="user-info">
                <div class="user-id">用户 ID: {{ user.userId }}</div>
                <div class="socket-id">Socket: {{ user.socketId.substring(0, 8) }}...</div>
              </div>
              <el-tag type="success" size="small">在线</el-tag>
            </div>
          </div>
        </el-card>

        <!-- 通知列表 -->
        <el-card class="notifications-card">
          <template #header>
            <div class="card-header">
              <span>通知列表 ({{ notifications?.length || 0 }})</span>
              <el-button type="text" size="small" @click="clearNotifications"> 清空 </el-button>
            </div>
          </template>

          <div class="notifications-list">
            <div
              v-for="notification in notifications || []"
              :key="notification.id"
              class="notification-item"
              :class="{ unread: !notification.read }"
              @click="markAsRead(notification.id)"
            >
              <div class="notification-content">
                <div class="notification-header">
                  <span class="notification-title">{{ notification.title }}</span>
                  <el-tag :type="getNotificationType(notification.type)" size="small">
                    {{ getNotificationTypeText(notification.type) }}
                  </el-tag>
                </div>

                <div class="notification-message">{{ notification.message }}</div>

                <div class="notification-footer">
                  <span class="notification-time">
                    {{ formatTime(notification.timestamp) }}
                  </span>
                  <span v-if="!notification.read" class="unread-dot"></span>
                </div>
              </div>
            </div>

            <div v-if="!notifications || notifications.length === 0" class="no-notifications">
              <el-empty description="暂无通知" />
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Connection } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import {
  sendBroadcastNotification,
  sendRoomNotification,
  sendTestNotification,
} from '../api/notificationApi';
import PageHeader from '../components/PageHeader.vue';
import { useWebSocket } from '../composables/useWebSocket';

// 使用 WebSocket 组合式函数
const {
  isConnected,
  connectionStatus,
  statusText,
  statusColor,
  notifications,
  onlineUsers,
  onlineUserCount,
  unreadCount,
  connect,
  disconnect,
  getOnlineUsers,
  joinRoom,
  leaveRoom,
  markAsRead,
  clearNotifications,
} = useWebSocket();

/**
 * 切换连接状态
 */
const toggleConnection = () => {
  if (isConnected.value) {
    disconnect();
  } else {
    connect();
  }
};

/**
 * 发送测试通知
 */
const handleSendTestNotification = async () => {
  try {
    const response = await sendTestNotification({
      type: 'info',
      title: 'WebSocket测试通知',
      message: `这是一条来自WebSocket演示页面的测试通知，发送时间：${new Date().toLocaleString('zh-CN')}`,
    });

    if (response.success) {
      ElMessage.success('测试通知发送成功！');
    } else {
      ElMessage.error('测试通知发送失败');
    }
  } catch (error: any) {
    console.error('发送测试通知失败:', error);
    ElMessage.error(`发送测试通知失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 发送系统广播通知
 */
const handleSendBroadcastNotification = async () => {
  try {
    const response = await sendBroadcastNotification({
      type: 'system',
      title: '系统广播通知',
      message: `这是一条系统广播通知，发送时间：${new Date().toLocaleString('zh-CN')}。所有在线用户都会收到此通知。`,
    });

    if (response.success) {
      ElMessage.success('系统通知广播成功！');
    } else {
      ElMessage.error('系统通知广播失败');
    }
  } catch (error: any) {
    console.error('发送系统通知失败:', error);
    ElMessage.error(`发送系统通知失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 发送房间通知
 */
const handleSendRoomNotification = async () => {
  try {
    const response = await sendRoomNotification({
      type: 'info',
      title: '房间通知',
      message: `这是一条房间通知，发送到测试房间，时间：${new Date().toLocaleString('zh-CN')}。只有加入该房间的用户会收到此通知。`,
    });

    if (response.success) {
      ElMessage.success('房间通知发送成功！');
    } else {
      ElMessage.error('房间通知发送失败');
    }
  } catch (error: any) {
    console.error('发送房间通知失败:', error);
    ElMessage.error(`发送房间通知失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 加入测试房间
 */
const joinTestRoom = () => {
  joinRoom('test-room');
};

/**
 * 离开测试房间
 */
const leaveTestRoom = () => {
  leaveRoom('test-room');
};

/**
 * 获取通知类型样式
 */
const getNotificationType = (type: string) => {
  switch (type) {
    case 'system':
      return 'danger';
    case 'user':
      return 'success';
    case 'info':
      return 'info';
    case 'warning':
      return 'warning';
    case 'error':
      return 'danger';
    default:
      return 'info';
  }
};

/**
 * 获取通知类型文本
 */
const getNotificationTypeText = (type: string) => {
  switch (type) {
    case 'system':
      return '系统';
    case 'user':
      return '用户';
    case 'info':
      return '信息';
    case 'warning':
      return '警告';
    case 'error':
      return '错误';
    default:
      return '未知';
  }
};

/**
 * 格式化时间
 */
const formatTime = (timestamp: string | Date) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString('zh-CN');
};
</script>

<style scoped>
.websocket-demo-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.websocket-demo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.status-card,
.test-card,
.users-card,
.notifications-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-weight: bold;
  color: #606266;
}

.value {
  color: #303133;
}

.value.success {
  color: #67c23a;
}

.value.warning {
  color: #e6a23c;
}

.value.danger {
  color: #f56c6c;
}

.value.info {
  color: #909399;
}

.test-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.user-info {
  flex: 1;
}

.user-id {
  font-weight: bold;
  color: #303133;
}

.socket-id {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.notification-content {
  width: 100%;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-title {
  font-weight: bold;
  color: #303133;
}

.notification-message {
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.4;
}

.notification-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background-color: #409eff;
  border-radius: 50%;
}

.no-notifications {
  text-align: center;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .websocket-demo {
    grid-template-columns: 1fr;
  }

  .test-buttons {
    flex-direction: column;
  }
}
</style>
