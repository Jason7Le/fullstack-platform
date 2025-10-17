<template>
  <div class="page-container">
    <!-- 导航栏 -->
    <AppNavigation />

    <!-- 页面内容区域 -->
    <div class="page-content">
      <!-- 页面头部 -->
      <div class="page-header" :class="`header-${headerTheme}`">
        <div class="header-content">
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
  headerTheme?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  icon: 'Document',
  showBackButton: true,
  backPath: '/dashboard',
  headerTheme: 'blue',
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
  margin-bottom: 20px;
  padding: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

/* 主题颜色 */
.header-blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-green {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.header-purple {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.header-red {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
}

.header-teal {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
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
  color: inherit;
}

.title-icon {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.9);
}

.page-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
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

  .header-content {
    padding: 0 15px;
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
