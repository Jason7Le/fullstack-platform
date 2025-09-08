<template>
  <div class="page-container">
    <!-- 导航栏 -->
    <AppNavigation />

    <!-- 页面内容区域 -->
    <div class="page-content">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <!-- 返回按钮 -->
          <el-button
            v-if="showBackButton"
            @click="handleBack"
            class="back-button"
            :icon="ArrowLeft"
          >
            返回
          </el-button>

          <!-- 页面标题 -->
          <div class="page-title-section">
            <h1 class="page-title">
              <el-icon class="title-icon">
                <component :is="icon" />
              </el-icon>
              {{ title }}
            </h1>
            <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
          </div>
        </div>

        <!-- 页面操作按钮 -->
        <div class="header-actions">
          <slot name="actions" />
        </div>
      </div>

      <!-- 页面主体内容 -->
      <div class="page-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
  showBackButton?: boolean;
  backPath?: string;
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  icon: 'Document',
  showBackButton: true,
  backPath: '/dashboard',
});

const router = useRouter();

// 处理返回操作
const handleBack = () => {
  if (props.backPath) {
    router.push(props.backPath);
  } else {
    router.back();
  }
};
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-content {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-button {
  flex-shrink: 0;
}

.page-title-section {
  display: flex;
  flex-direction: column;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.title-icon {
  font-size: 28px;
  color: #409eff;
}

.page-subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.page-body {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-content {
    padding: 15px;
  }

  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .page-title {
    font-size: 20px;
  }

  .header-actions {
    justify-content: flex-start;
  }
}
</style>
