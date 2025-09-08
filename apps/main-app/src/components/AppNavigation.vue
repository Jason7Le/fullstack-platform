<template>
  <el-header class="app-navigation">
    <div class="nav-content">
      <!-- 左侧：Logo和面包屑 -->
      <div class="nav-left">
        <div class="logo-section" @click="goHome">
          <el-icon class="logo-icon"><DataBoard /></el-icon>
          <span class="logo-text">{{ appTitle }}</span>
        </div>

        <!-- 面包屑导航 -->
        <el-breadcrumb separator="/" class="breadcrumb">
          <el-breadcrumb-item
            v-for="(item, index) in breadcrumbItems"
            :key="index"
            :to="item.path"
            :class="{ 'is-current': index === breadcrumbItems.length - 1 }"
          >
            <el-icon v-if="item.icon" class="breadcrumb-icon">
              <component :is="item.icon" />
            </el-icon>
            {{ item.name }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 右侧：用户信息和操作 -->
      <div class="nav-right">
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
</template>

<script setup lang="ts">
import { ArrowDown, DataBoard, Setting, SwitchButton, User } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

interface BreadcrumbItem {
  name: string;
  path?: string;
  icon?: string;
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 应用标题
const appTitle = '全栈微前端数据平台';

// 用户信息
const userInfo = computed(() => authStore.userInfo);

// 面包屑导航
const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [{ name: '首页', path: '/dashboard', icon: 'DataBoard' }];

  // 根据当前路由添加面包屑
  switch (route.name) {
    case 'UserManagement':
      items.push({ name: '用户管理', icon: 'User' });
      break;
    case 'PermissionMatrix':
      items.push({ name: '权限矩阵', icon: 'Key' });
      break;
    default:
      if (route.meta?.title) {
        items.push({ name: route.meta.title as string });
      }
  }

  return items;
});

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
    .then(async () => {
      await authStore.logout();
      ElMessage.success('已退出登录');
      router.push('/login');
    })
    .catch(() => {
      // 用户取消
    });
};

// 返回首页
const goHome = () => {
  router.push('/dashboard');
};
</script>

<style scoped>
.app-navigation {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.logo-section:hover {
  background-color: #f5f7fa;
}

.logo-icon {
  font-size: 24px;
  color: #409eff;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.breadcrumb {
  font-size: 14px;
}

.breadcrumb-icon {
  margin-right: 4px;
}

.nav-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-name {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
}

.dropdown-icon {
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-navigation {
    padding: 0 15px;
  }

  .nav-left {
    gap: 15px;
  }

  .logo-text {
    display: none;
  }

  .breadcrumb {
    font-size: 12px;
  }

  .user-name {
    display: none;
  }
}
</style>
