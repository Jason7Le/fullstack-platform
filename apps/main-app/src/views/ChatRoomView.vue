<template>
  <div class="chat-room-container">
    <!-- 页面头部 -->
    <PageHeader title="聊天室" subtitle="实时聊天和协作功能" :icon="ChatDotRound" theme="orange" />

    <!-- WebSocket连接状态 -->
    <div class="connection-status" v-if="!isConnected">
      <el-alert
        title="WebSocket 未连接"
        type="warning"
        description="请先连接 WebSocket 以使用聊天室功能"
        show-icon
        :closable="false"
      >
        <template #default>
          <el-button @click="connect" type="primary" size="small"> 连接 WebSocket </el-button>
        </template>
      </el-alert>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content" v-if="isConnected">
      <div class="chat-layout">
        <!-- 左侧：房间管理 -->
        <div class="left-panel">
          <!-- 房间列表 -->
          <div class="room-list-section">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>
                    <el-icon><House /></el-icon>
                    房间列表
                  </span>
                  <div class="header-right">
                    <el-tag type="info" size="small">{{ roomList?.length || 0 }} 个房间</el-tag>
                    <el-button
                      type="primary"
                      @click="showCreateRoomDialog"
                      :icon="Plus"
                      size="small"
                    >
                      创建房间
                    </el-button>
                  </div>
                </div>
              </template>

              <div class="room-list" v-if="roomList && roomList.length > 0">
                <div
                  v-for="room in roomList"
                  :key="room.id"
                  class="room-item"
                  :class="{
                    active: currentRoom?.id === room.id,
                    joining: joiningRoom === room.id,
                    'private-no-access': room.isPrivate && !isUserRoomMember(room),
                  }"
                  @click="handleJoinRoom(room)"
                >
                  <div class="room-info">
                    <div class="room-header">
                      <el-icon v-if="room.isPrivate && !isUserRoomMember(room)" class="lock-icon">
                        <Lock />
                      </el-icon>
                      <div class="room-name">
                        <span class="room-name-text" :title="room.name">{{ room.name }}</span>
                        <el-icon v-if="joiningRoom === room.id" class="loading-icon">
                          <Loading />
                        </el-icon>
                      </div>
                      <span class="member-count">(在线人数{{ room.members?.length || 0 }})</span>
                    </div>
                    <div class="room-description">{{ room.description || '暂无描述' }}</div>
                    <div class="room-meta">
                      <span v-if="joiningRoom === room.id" class="joining-text">加入中...</span>
                      <span v-if="room.isPrivate && !isUserRoomMember(room)" class="no-access-text">
                        需要邀请
                      </span>
                    </div>
                    <div class="room-owner">
                      <el-icon><User /></el-icon>
                      <span class="owner-text">房主：{{ room.ownerEmail || '未知' }}</span>
                    </div>
                  </div>
                  <div class="room-right">
                    <div
                      class="room-actions"
                      v-if="room.ownerId === authStore.userInfo?.id && joiningRoom !== room.id"
                    >
                      <el-button size="small" type="danger" @click.stop="destroyRoom(room.id)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-room-list">
                <el-empty description="暂无房间" />
              </div>
            </el-card>
          </div>
        </div>

        <!-- 右侧：聊天区域 -->
        <div class="right-panel">
          <div v-if="!currentRoom" class="no-room-selected">
            <el-empty description="请选择一个房间开始聊天" />
          </div>
          <div v-else class="chat-area">
            <!-- 房间信息 -->
            <div class="room-info-header">
              <el-card>
                <div class="room-header">
                  <div class="room-details">
                    <h3>
                      {{ currentRoom.name }}
                      <el-icon v-if="isJoiningRoom" class="loading-icon">
                        <Loading />
                      </el-icon>
                    </h3>
                    <p>{{ currentRoom.description || '暂无描述' }}</p>
                    <div class="room-stats">
                      <el-tag :type="currentRoom.isPrivate ? 'warning' : 'success'" size="small">
                        {{ currentRoom.isPrivate ? '私有房间' : '公开房间' }}
                      </el-tag>
                      <el-tag type="info" size="small">
                        <el-icon><User /></el-icon>
                        在线 {{ currentRoom.members?.length }} 人
                      </el-tag>
                      <el-tag type="primary" size="small">
                        <el-icon><User /></el-icon>
                        房主：{{ currentRoom.ownerEmail || '未知' }}
                      </el-tag>
                      <el-tag v-if="isJoiningRoom" type="warning" size="small">
                        <el-icon><Loading /></el-icon>
                        加入中...
                      </el-tag>
                    </div>
                  </div>
                  <div class="room-actions">
                    <el-button
                      @click="leaveCurrentRoom"
                      type="danger"
                      size="small"
                      :disabled="isJoiningRoom"
                    >
                      <el-icon><Close /></el-icon>
                      离开房间
                    </el-button>
                  </div>
                </div>
              </el-card>
            </div>

            <!-- 聊天消息 -->
            <div class="chat-messages">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>
                      <el-icon><Message /></el-icon>
                      聊天消息
                    </span>
                    <el-tag v-if="isJoiningRoom" type="warning" size="small">
                      <el-icon><Loading /></el-icon>
                      正在连接...
                    </el-tag>
                  </div>
                </template>
                <div
                  class="messages-container"
                  ref="messagesContainer"
                  :class="{ 'loading-disabled': isJoiningRoom }"
                >
                  <div v-if="isJoiningRoom" class="loading-messages">
                    <el-icon class="loading-icon"><Loading /></el-icon>
                    <p>正在加载聊天记录...</p>
                  </div>
                  <div v-else-if="currentRoomMessages.length === 0" class="no-messages">
                    <el-empty description="暂无消息" />
                  </div>
                  <div v-else class="messages-list">
                    <div
                      v-for="message in currentRoomMessages"
                      :key="message.id"
                      class="message-item"
                      :class="{ 'own-message': message.userId === authStore.userInfo?.id }"
                    >
                      <div class="message-content">
                        <div class="message-header">
                          <span class="username">{{ message.username }}</span>
                          <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
                        </div>
                        <div class="message-text">{{ message.content }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>

            <!-- 发送消息 -->
            <div class="send-message">
              <el-card>
                <div class="message-input">
                  <el-input
                    v-model="newMessage"
                    placeholder="输入消息..."
                    @keyup.enter="sendMessage"
                    :disabled="!currentRoom || isJoiningRoom"
                  >
                    <template #append>
                      <el-button
                        @click="sendMessage"
                        :disabled="!newMessage.trim() || !currentRoom || isJoiningRoom"
                        :loading="isJoiningRoom"
                        type="primary"
                      >
                        <el-icon v-if="!isJoiningRoom"><Message /></el-icon>
                        {{ isJoiningRoom ? '连接中...' : '发送' }}
                      </el-button>
                    </template>
                  </el-input>
                </div>
              </el-card>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建房间对话框 -->
    <el-dialog
      v-model="createRoomDialogVisible"
      title="创建房间"
      width="500px"
      :before-close="handleCreateRoomDialogClose"
    >
      <el-form :model="roomForm" :rules="roomFormRules" ref="roomFormRef" label-width="80px">
        <el-form-item label="房间名称" prop="name">
          <el-input
            v-model="roomForm.name"
            placeholder="请输入房间名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="房间描述" prop="description">
          <el-input
            v-model="roomForm.description"
            placeholder="请输入房间描述（可选）"
            maxlength="50"
            show-word-limit
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="房间类型" prop="isPrivate">
          <el-radio-group v-model="roomForm.isPrivate">
            <el-radio :label="false">公开房间</el-radio>
            <el-radio :label="true">私有房间</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createRoomDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleCreateRoom"
            :loading="creating"
            :disabled="!roomForm.name.trim()"
          >
            创建房间
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  ChatDotRound,
  Close,
  Delete,
  House,
  Loading,
  Lock,
  Message,
  Plus,
  User,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { roomApi, type CreateRoomRequest, type RoomInfo } from '../api/roomApi';
import PageHeader from '../components/PageHeader.vue';
import { useWebSocket } from '../composables/useWebSocket';
import { useAuthStore } from '../stores/auth';
import { websocketService } from '../utils/websocket';

// Auth store
const authStore = useAuthStore();

// WebSocket 功能
const {
  isConnected,
  connect,
  joinRoom,
  leaveRoom,
  sendRoomMessage,
  getRoomMessages,
  getRoomHistory,
  getRoomList,
  roomJoinedEvent,
  roomList,
} = useWebSocket();

// 当前房间
const currentRoom = ref<any>(null);

// 聊天消息（已移除，现在使用useWebSocket管理）
// const chatMessages = ref<any[]>([]);

// 新消息
const newMessage = ref('');

// 消息容器引用
const messagesContainer = ref<HTMLElement>();

// 创建房间对话框
const createRoomDialogVisible = ref(false);

// 房间表单
const roomForm = ref({
  name: '',
  description: '',
  isPrivate: false,
});

// 房间表单验证规则
const roomFormRules = {
  name: [
    { required: true, message: '请输入房间名称', trigger: 'blur' },
    { min: 2, max: 20, message: '房间名称长度在 2 到 20 个字符', trigger: 'blur' },
  ],
};

// 创建状态
const creating = ref(false);

// 加入房间状态
const joiningRoom = ref<string | null>(null);

// 房间表单引用
const roomFormRef = ref();

/**
 * 显示创建房间对话框
 */
const showCreateRoomDialog = () => {
  createRoomDialogVisible.value = true;
};

/**
 * 关闭创建房间对话框
 */
const handleCreateRoomDialogClose = () => {
  createRoomDialogVisible.value = false;
  resetRoomForm();
};

/**
 * 重置房间表单
 */
const resetRoomForm = () => {
  roomForm.value = {
    name: '',
    description: '',
    isPrivate: false,
  };
  roomFormRef.value?.clearValidate();
};

/**
 * 创建房间
 * 验证输入，调用API创建房间，自动加入房间
 */
const handleCreateRoom = async () => {
  if (!roomForm.value.name.trim()) {
    ElMessage.warning('请输入房间名称');
    return;
  }

  try {
    creating.value = true;

    // 构建创建房间的请求数据
    const createRoomData: CreateRoomRequest = {
      name: roomForm.value.name.trim(),
      description: roomForm.value.description?.trim(),
      isPrivate: roomForm.value.isPrivate,
    };

    console.log('ChatRoomView: 发送创建房间请求:', createRoomData);

    const newRoom = await roomApi.createRoom(createRoomData);

    console.log('ChatRoomView: 创建房间响应:', newRoom);

    ElMessage.success('房间创建成功！');
    createRoomDialogVisible.value = false;
    resetRoomForm();

    // 房间列表会通过WebSocket事件自动更新，不需要手动刷新

    // 自动加入新创建的房间
    if (newRoom && newRoom.id) {
      // 将CreateRoomResponse转换为RoomInfo格式
      const roomInfo: RoomInfo = {
        id: newRoom.id,
        name: newRoom.name,
        ownerId: newRoom.ownerId,
        ownerEmail: newRoom.ownerEmail,
        createdAt: newRoom.createdAt,
        memberCount: newRoom.members?.length || 0,
        isPrivate: newRoom.isPrivate,
        description: newRoom.description,
        members: newRoom.members, // 包含成员信息，用于权限检查
      };

      // 设置加入状态
      joiningRoom.value = newRoom.id;
      await handleJoinRoom(roomInfo);
    }
  } catch (error: any) {
    console.error('创建房间失败:', error);
    ElMessage.error(`创建房间失败: ${error.message || '未知错误'}`);
  } finally {
    creating.value = false;
  }
};

/**
 * 检查用户是否是房间成员
 * @param room 房间信息
 * @returns 是否是房间成员
 */
const isUserRoomMember = (room: RoomInfo): boolean => {
  if (!room.members || !authStore.userInfo?.id) {
    console.log('ChatRoomView: isUserRoomMember 检查失败 - 缺少数据', {
      hasMembers: !!room.members,
      membersCount: room.members?.length || 0,
      hasUserId: !!authStore.userInfo?.id,
      userId: authStore.userInfo?.id,
    });
    return false;
  }

  const isMember = room.members.some(member => member.userId === authStore.userInfo.id);
  console.log('ChatRoomView: isUserRoomMember 检查结果', {
    roomId: room.id,
    roomName: room.name,
    members: room.members,
    currentUserId: authStore.userInfo.id,
    isMember,
  });
  return isMember;
};

/**
 * 加入房间
 * 检查当前状态，设置加载状态，通过WebSocket加入房间
 * 对于私人房间，需要检查用户是否是成员
 */
const handleJoinRoom = async (room: RoomInfo) => {
  console.log('ChatRoomView: 开始加入房间:', room);

  // 如果已经在当前房间，直接返回
  if (currentRoom.value?.id === room.id) {
    console.log('ChatRoomView: 已经在当前房间，跳过');
    return;
  }

  // 检查私人房间权限
  if (room.isPrivate && !isUserRoomMember(room)) {
    console.log('ChatRoomView: 权限检查失败', {
      roomId: room.id,
      roomName: room.name,
      isPrivate: room.isPrivate,
      members: room.members,
      currentUserId: authStore.userInfo?.id,
      isMember: isUserRoomMember(room),
    });
    ElMessage.warning('私人房间需要房主邀请才能进入');
    return;
  }

  // 设置加入状态，显示加载动画
  joiningRoom.value = room.id;
  console.log('ChatRoomView: 设置joiningRoom状态:', room.id);

  try {
    // 通过WebSocket加入房间
    console.log('ChatRoomView: 调用joinRoom:', room.id);
    joinRoom(room.id);

    // 不立即设置currentRoom，等待WebSocket事件处理
    // currentRoom会在handleRoomJoined事件中设置

    // 获取房间历史消息
    console.log('ChatRoomView: 获取房间历史消息:', room.id);
    getRoomHistory(room.id);
  } catch (error: any) {
    console.error('加入房间失败:', error);
    ElMessage.error(`加入房间失败: ${error.message || '未知错误'}`);
    // 清除加入状态
    joiningRoom.value = null;
  }
};

/**
 * 离开当前房间
 */
const leaveCurrentRoom = () => {
  if (currentRoom.value) {
    // 检查是否是房主（前端计算）
    const isOwner = currentRoom.value.ownerId === authStore.userInfo?.id;

    // 通过WebSocket离开房间，传递房主信息、用户ID和成员数量
    leaveRoom(
      currentRoom.value.id,
      isOwner,
      authStore.userInfo?.id,
      currentRoom.value.members?.length,
    );

    ElMessage.info(`已离开房间: ${currentRoom.value.name}`);
    currentRoom.value = null;
  }
};

/**
 * 加载房间列表
 */
// loadRoomList函数已移除，房间列表现在通过WebSocket事件自动更新

/**
 * 销毁房间
 */
const destroyRoom = async (roomId: any) => {
  try {
    await roomApi.deleteRoom(roomId);
    ElMessage.success('房间删除成功！');

    // 房间列表会通过WebSocket事件自动更新
  } catch (error: any) {
    console.error('删除房间失败:', error);
    ElMessage.error(`删除房间失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 发送消息
 */
const sendMessage = () => {
  if (!newMessage.value.trim() || !currentRoom.value) {
    return;
  }

  // 通过WebSocket发送消息，传递房间名称减少后端查询
  sendRoomMessage(currentRoom.value.id, newMessage.value.trim(), currentRoom.value.name);
  newMessage.value = '';

  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
};

/**
 * 滚动到底部
 */
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

/**
 * 获取当前房间的消息
 */
const currentRoomMessages = computed(() => {
  if (!currentRoom.value) {
    return [];
  }
  return getRoomMessages(currentRoom.value.id);
});

/**
 * 检查是否正在加入房间
 */
const isJoiningRoom = computed(() => {
  return joiningRoom.value !== null;
});

/**
 * 格式化时间
 */
const formatTime = (timestamp: Date | string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 监听房间加入成功事件
watch(roomJoinedEvent, event => {
  console.log('ChatRoomView: 监听到roomJoinedEvent变化:', event);
  console.log('ChatRoomView: 当前joiningRoom状态:', joiningRoom.value);

  if (event && joiningRoom.value === event.roomId) {
    console.log('ChatRoomView: 匹配到加入的房间，清除loading状态');
    // 清除loading状态
    joiningRoom.value = null;

    // 从房间列表中找到对应的房间信息
    const roomInfo = roomList.value?.find(room => room.id === event.roomId);
    console.log('ChatRoomView: 找到的房间信息:', roomInfo);

    if (roomInfo) {
      // 设置当前房间
      currentRoom.value = roomInfo;
      console.log('ChatRoomView: 设置当前房间:', roomInfo);
    } else {
      // 如果房间列表中找不到，创建一个基本的房间信息
      const basicRoomInfo = {
        id: event.roomId,
        name: event.roomName,
        ownerId: 0,
        ownerEmail: '',
        createdAt: new Date().toISOString(),
        memberCount: 0,
        isPrivate: false,
        description: '',
      };
      currentRoom.value = basicRoomInfo;
      console.log('ChatRoomView: 创建基本房间信息:', basicRoomInfo);
    }
  } else {
    console.log('ChatRoomView: 事件不匹配或没有正在加入的房间');
  }
});

const handleRoomError = (error: any) => {
  console.log('ChatRoomView: 收到房间错误:', error);

  // 如果是"您不是该房间的成员"错误，可能是权限检查的时序问题
  // 不要立即清除joiningRoom状态，等待room_joined事件
  if (error.code === 'NOT_MEMBER') {
    console.log('ChatRoomView: 收到NOT_MEMBER错误，可能是时序问题，等待room_joined事件');
    // 延迟清除状态，给room_joined事件一些时间
    setTimeout(() => {
      if (joiningRoom.value) {
        console.log('ChatRoomView: 延迟清除joiningRoom状态');
        joiningRoom.value = null;
      }
    }, 2000); // 等待2秒
  } else {
    // 其他错误立即清除loading状态
    if (joiningRoom.value) {
      joiningRoom.value = null;
    }
  }
};

// 组件挂载时连接WebSocket并加载房间列表
onMounted(async () => {
  if (!isConnected.value) {
    connect();
  }

  // 监听WebSocket事件（useWebSocket已经处理了room_joined事件）
  websocketService.on('error', handleRoomError);

  // 主动加载房间列表
  try {
    console.log('ChatRoomView: 开始加载房间列表');
    await getRoomList(true); // 强制刷新房间列表
    console.log('ChatRoomView: 房间列表加载完成');
  } catch (error) {
    console.error('ChatRoomView: 加载房间列表失败:', error);
    ElMessage.error('加载房间列表失败');
  }
});

// 组件卸载时清理事件监听
onUnmounted(() => {
  websocketService.off('error', handleRoomError);
});
</script>

<style scoped>
.chat-room-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.connection-status {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
}

/* 聊天布局 */
.chat-layout {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px);
  min-height: 600px;
}

.left-panel {
  width: 350px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 房间列表 */
.room-list-section {
  flex: 1;
  overflow: hidden;
}

.room-list {
  max-height: 400px;
  overflow-y: auto;
}

.room-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.room-item.active {
  border-color: #409eff;
  background-color: #e6f7ff;
}

.room-item.joining {
  border-color: #e6a23c;
  background-color: #fdf6ec;
  opacity: 0.8;
  cursor: not-allowed;
}

.room-item.joining:hover {
  border-color: #e6a23c;
  background-color: #fdf6ec;
}

.room-item.private-no-access {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.room-item.private-no-access:hover {
  border-color: #e4e7ed;
  background-color: #f5f5f5;
}

.room-info {
  flex: 1;
}

.room-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.room-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  justify-content: space-between;
}

.room-type-tag {
  flex-shrink: 0;
}

.room-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0; /* 允许flex子元素收缩 */
}

.room-name-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.lock-icon {
  color: #e6a23c;
  font-size: 14px;
}

.no-access-text {
  color: #e6a23c;
  font-size: 12px;
  font-weight: 500;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.room-description {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.room-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.room-owner {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.room-owner .el-icon {
  font-size: 12px;
  color: #909399;
}

.owner-text {
  font-size: 12px;
  color: #909399;
}

.member-count {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
  white-space: nowrap; /* 防止换行 */
  flex-shrink: 0; /* 防止收缩 */
}

.joining-text {
  font-size: 12px;
  color: #e6a23c;
  font-weight: 500;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.room-actions {
  display: flex;
  gap: 4px;
}

.empty-room-list {
  text-align: center;
  padding: 40px 0;
}

/* 右侧聊天区域 */
.no-room-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.chat-area {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 房间信息头部 */
.room-info-header {
  margin-bottom: 10px;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-details h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.room-details p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.room-stats {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 聊天消息 */
.chat-messages {
  flex: 1;
  overflow: hidden;
}

.messages-container {
  height: 300px;
  overflow-y: auto;
  padding: 10px 0;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  margin-bottom: 12px;
}

.message-item.own-message {
  justify-content: flex-end;
}

.message-content {
  max-width: 70%;
  min-width: 140px;
  padding: 8px 12px;
  border-radius: 12px;
  background-color: #f0f0f0;
}

.own-message .message-content {
  background-color: #409eff;
  color: white;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.username {
  font-size: 12px;
  font-weight: 600;
}

.timestamp {
  font-size: 11px;
  opacity: 0.7;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
}

.no-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 发送消息 */
.send-message {
  margin-top: 10px;
}

.message-input {
  width: 100%;
}

/* 对话框样式 */
.dialog-footer {
  text-align: right;
}

/* Loading状态样式 */
.loading-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
}

.loading-messages .loading-icon {
  font-size: 24px;
  margin-bottom: 10px;
  animation: spin 1s linear infinite;
}

.loading-messages p {
  margin: 0;
  font-size: 14px;
}

.messages-container.loading-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.room-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.room-header h3 .loading-icon {
  animation: spin 1s linear infinite;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .chat-layout {
    flex-direction: column;
    height: auto;
  }

  .left-panel {
    width: 100%;
    order: 2;
  }

  .right-panel {
    order: 1;
    height: 500px;
  }

  .room-list {
    max-height: 200px;
  }

  .messages-container {
    height: 200px;
  }
}
</style>
