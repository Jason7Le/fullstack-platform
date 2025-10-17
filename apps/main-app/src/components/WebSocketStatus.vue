<template>
  <div class="websocket-status">
    <!-- 连接状态指示器 -->
    <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="status-badge">
      <el-button
        :type="statusColor"
        :icon="isConnected ? 'Connection' : 'Close'"
        circle
        size="small"
        @click="toggleConnection"
        :loading="connectionStatus === 'connecting' || connectionStatus === 'reconnecting'"
      />
    </el-badge>

    <!-- 状态提示 -->
    <el-tooltip :content="statusText" placement="bottom">
      <span class="status-text">{{ statusText }}</span>
    </el-tooltip>

    <!-- 在线用户数量 -->
    <span v-if="isConnected" class="online-count"> 在线: {{ onlineUserCount }} 人 </span>

    <!-- 通知列表 -->
    <el-dropdown v-if="isConnected" @command="handleNotificationCommand" trigger="click">
      <el-button type="text" size="small">
        <el-icon><Bell /></el-icon>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" />
      </el-button>

      <template #dropdown>
        <el-dropdown-menu>
          <div class="notification-header">
            <span>通知中心</span>
            <el-button type="text" size="small" @click="clearNotifications"> 清空 </el-button>
          </div>

          <el-divider />

          <div class="notification-list">
            <div
              v-for="notification in notifications.slice(0, 10)"
              :key="notification.id"
              class="notification-item"
              :class="{ unread: !notification.read }"
              @click="markAsRead(notification.id)"
            >
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-time">
                  {{ formatTime(notification.timestamp) }}
                </div>
              </div>
              <el-tag
                :type="getNotificationType(notification.type)"
                size="small"
                class="notification-type"
              >
                {{ getNotificationTypeText(notification.type) }}
              </el-tag>
            </div>

            <div v-if="notifications.length === 0" class="no-notifications">暂无通知</div>
          </div>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { Bell } from '@element-plus/icons-vue';
import { useWebSocket } from '../composables/useWebSocket';

// 使用 WebSocket 组合式函数
const {
  isConnected,
  connectionStatus,
  statusText,
  statusColor,
  notifications,
  onlineUserCount,
  unreadCount,
  connect,
  disconnect,
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
 * 处理通知操作
 */
const handleNotificationCommand = (command: string) => {
  switch (command) {
    case 'clear':
      clearNotifications();
      break;
  }
};

/**
 * 格式化时间
 */
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    // 1分钟内
    return '刚刚';
  } else if (diff < 3600000) {
    // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    // 1天内
    return `${Math.floor(diff / 3600000)}小时前`;
  } else {
    return date.toLocaleDateString();
  }
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
</script>

<style scoped>
.websocket-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  margin-right: 4px;
}

.status-text {
  font-size: 12px;
  color: #666;
}

.online-count {
  font-size: 12px;
  color: #67c23a;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-weight: bold;
  background-color: #f5f7fa;
}

.notification-list {
  max-height: 300px;
  overflow-y: auto;
  width: 300px;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.3s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.notification-content {
  flex: 1;
  margin-right: 8px;
}

.notification-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
  color: #303133;
}

.notification-message {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-time {
  font-size: 11px;
  color: #909399;
}

.notification-type {
  flex-shrink: 0;
}

.no-notifications {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
}
</style>
