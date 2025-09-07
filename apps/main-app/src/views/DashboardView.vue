<template>
  <div class="dashboard-container">
    <!-- 顶部导航栏 -->
    <el-header class="dashboard-header">
      <div class="header-content">
        <div class="logo-section">
          <el-icon class="logo-icon"><DataBoard /></el-icon>
          <h1 class="logo-text">{{ appTitle }}</h1>
        </div>

        <div class="user-section">
          <el-dropdown @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="userInfo?.avatar">
                {{ userInfo?.name?.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ userInfo?.name }}</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- 主要内容区域 -->
    <el-main class="dashboard-main">
      <div class="welcome-section">
        <el-card class="welcome-card">
          <div class="welcome-content">
            <div class="welcome-text">
              <h2>欢迎回来，{{ userInfo?.name }}！</h2>
              <p>您已成功登录全栈微前端数据平台</p>
            </div>
            <!-- <div class="welcome-icon">
              <el-icon size="60" color="#409eff"><SuccessFilled /></el-icon>
            </div> -->
          </div>
        </el-card>
      </div>

      <!-- 功能卡片区域 -->
      <div class="features-section">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-card class="feature-card" @click="navigateToFeature('users')">
              <div class="feature-content">
                <el-icon class="feature-icon" color="#67c23a"><User /></el-icon>
                <h3>用户管理</h3>
                <p>管理系统用户和权限</p>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-card class="feature-card" @click="navigateToFeature('data')">
              <div class="feature-content">
                <el-icon class="feature-icon" color="#e6a23c"><DataAnalysis /></el-icon>
                <h3>数据分析</h3>
                <p>查看和分析业务数据</p>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-card class="feature-card" @click="navigateToFeature('reports')">
              <div class="feature-content">
                <el-icon class="feature-icon" color="#f56c6c"><Document /></el-icon>
                <h3>报表中心</h3>
                <p>生成和查看各类报表</p>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-card class="feature-card" @click="navigateToFeature('settings')">
              <div class="feature-content">
                <el-icon class="feature-icon" color="#909399"><Setting /></el-icon>
                <h3>系统设置</h3>
                <p>配置系统参数和选项</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 用户信息展示 -->
      <div class="user-info-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><User /></el-icon>
              <span>用户信息</span>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="姓名">
              {{ userInfo?.name }}
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">
              {{ userInfo?.email }}
            </el-descriptions-item>
            <el-descriptions-item label="角色">
              <el-tag :type="getRoleTagType(userInfo?.role)">
                {{ getRoleText(userInfo?.role) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ formatDate(userInfo?.createdAt) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
    </el-main>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowDown,
  DataAnalysis,
  DataBoard,
  Document,
  Setting,
  SwitchButton,
  User,
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

// 路由
const router = useRouter();

// Auth store
const authStore = useAuthStore();

// 应用标题
const appTitle = import.meta.env.VITE_APP_TITLE || '全栈微前端数据平台';

// 用户信息
const userInfo = ref<any>(null);

// 获取用户信息
const getUserInfo = () => {
  userInfo.value = authStore.userInfo;
  if (!userInfo.value) {
    // 如果没有用户信息，跳转到登录页
    router.push('/login');
  }
};

// 处理用户下拉菜单命令
const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人资料功能开发中...');
      break;
    case 'settings':
      ElMessage.info('系统设置功能开发中...');
      break;
    case 'logout':
      handleLogout();
      break;
  }
};

// 处理退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      // 使用auth store清除登录信息
      authStore.logout();

      ElMessage.success('已退出登录');
      router.push('/login');
    })
    .catch(() => {
      // 用户取消
    });
};

// 导航到功能页面
const navigateToFeature = (feature: string) => {
  switch (feature) {
    case 'users':
      router.push('/user-management');
      break;
    default:
      ElMessage.info(`${feature} 功能正在开发中...`);
  }
};

// 获取角色标签类型
const getRoleTagType = (role: string) => {
  switch (role) {
    case 'admin':
      return 'danger';
    case 'user':
      return 'success';
    case 'guest':
      return 'info';
    default:
      return 'info';
  }
};

// 获取角色文本
const getRoleText = (role: string) => {
  switch (role) {
    case 'admin':
      return '管理员';
    case 'user':
      return '普通用户';
    case 'guest':
      return '访客';
    default:
      return '未知';
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '未知';
  return new Date(dateString).toLocaleString('zh-CN');
};

// 组件挂载时获取用户信息
onMounted(() => {
  getUserInfo();
});
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.user-section {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-name {
  font-weight: 500;
  color: #fff;
}

.dropdown-icon {
  font-size: 12px;
}

.dashboard-main {
  padding: 20px;
}

.welcome-section {
  margin-bottom: 30px;
}

.welcome-card {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  border: none;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-text h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.welcome-text p {
  margin: 0;
  opacity: 0.9;
}

.features-section {
  margin-bottom: 30px;
}

.feature-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 120px;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.feature-content {
  text-align: center;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.feature-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.feature-content h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.feature-content p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.user-info-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 15px;
  }

  .logo-text {
    font-size: 20px;
  }

  .dashboard-main {
    padding: 15px;
  }

  .welcome-content {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }

  .welcome-text h2 {
    font-size: 20px;
  }
}
</style>
