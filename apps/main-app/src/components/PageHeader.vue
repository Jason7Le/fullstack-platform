<template>
  <div class="page-header" :class="`header-${theme}`">
    <div class="header-content">
      <div class="header-left">
        <el-icon class="header-icon"><component :is="icon" /></el-icon>
        <div class="title-section">
          <h1>{{ title }}</h1>
          <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="header-right">
        <slot name="actions">
          <el-button @click="goBack" type="default" :icon="ArrowLeft"> 返回首页 </el-button>
        </slot>
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
  icon: any;
  theme?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
}

withDefaults(defineProps<Props>(), {
  theme: 'blue',
});

const router = useRouter();

const goBack = () => {
  router.push('/dashboard');
};
</script>

<style scoped>
.page-header {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  padding: 20px 0;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-icon {
  font-size: 32px;
  color: white;
}

.title-section h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 主题色彩 */
.header-blue {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.header-green {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.header-purple {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header-orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.header-red {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
}

.header-teal {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 15px;
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .header-left {
    justify-content: center;
    text-align: center;
  }

  .header-right {
    justify-content: center;
  }

  .title-section h1 {
    font-size: 24px;
  }

  .header-icon {
    font-size: 28px;
  }
}
</style>
