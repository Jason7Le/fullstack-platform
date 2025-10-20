<template>
  <div class="settings-container">
    <AppNavigation />
    <el-main class="settings-main">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1>系统设置</h1>
        <p>配置系统参数和监控选项</p>
      </div>

      <!-- 系统配置 -->
      <div class="settings-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>系统配置</span>
            </div>
          </template>

          <el-form :model="systemSettings" label-width="150px" @submit.prevent>
            <el-form-item label="自动刷新间隔">
              <el-input-number
                v-model="systemSettings.autoRefreshInterval"
                :min="5"
                :max="300"
                :step="5"
                controls-position="right"
              />
              <span class="unit">秒</span>
              <div class="form-tip">监控数据自动刷新间隔，5-300秒</div>
            </el-form-item>

            <el-form-item label="数据保留天数">
              <el-input-number
                v-model="systemSettings.dataRetentionDays"
                :min="1"
                :max="365"
                :step="1"
                controls-position="right"
              />
              <span class="unit">天</span>
              <div class="form-tip">监控数据保留时间，1-365天</div>
            </el-form-item>

            <el-form-item label="错误告警阈值">
              <el-input-number
                v-model="systemSettings.errorThreshold"
                :min="1"
                :max="100"
                :step="1"
                controls-position="right"
              />
              <span class="unit">次/小时</span>
              <div class="form-tip">每小时错误次数超过此值将触发告警</div>
            </el-form-item>

            <el-form-item label="性能告警阈值">
              <el-input-number
                v-model="systemSettings.performanceThreshold"
                :min="100"
                :max="5000"
                :step="100"
                controls-position="right"
              />
              <span class="unit">毫秒</span>
              <div class="form-tip">页面加载时间超过此值将触发告警</div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveSystemSettings" :loading="saving">
                保存系统配置
              </el-button>
              <el-button @click="resetSystemSettings">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 监控配置 -->
      <div class="settings-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>监控配置</span>
            </div>
          </template>

          <el-form :model="monitoringSettings" label-width="150px" @submit.prevent>
            <el-form-item label="Web Vitals 监控">
              <el-switch
                v-model="monitoringSettings.webVitalsEnabled"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>
            <el-form-item label="监控页面">
              <el-input
                v-model="monitoringSettings.webVitalsPages"
                placeholder="例如: /dashboard,/login,/admin/*"
                clearable
              />
              <div class="form-tip">多个页面用逗号分隔，支持通配符 *</div>
            </el-form-item>

            <el-form-item label="微前端监控">
              <el-switch
                v-model="monitoringSettings.microFrontendEnabled"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>
            <el-form-item label="监控页面">
              <el-input
                v-model="monitoringSettings.microFrontendPages"
                placeholder="例如: /dashboard-app,/admin/*"
                clearable
              />
              <div class="form-tip">多个页面用逗号分隔，支持通配符 *</div>
            </el-form-item>

            <el-form-item label="错误监控">
              <el-switch
                v-model="monitoringSettings.errorMonitoringEnabled"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>
            <el-form-item label="监控页面">
              <el-input
                v-model="monitoringSettings.errorMonitoringPages"
                placeholder="例如: /*,/dashboard/*"
                clearable
              />
              <div class="form-tip">多个页面用逗号分隔，支持通配符 *</div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveMonitoringSettings" :loading="saving">
                保存监控配置
              </el-button>
              <el-button @click="resetMonitoringSettings">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 通知配置 -->
      <div class="settings-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Bell /></el-icon>
              <span>通知配置</span>
            </div>
          </template>

          <el-form :model="notificationSettings" label-width="150px" @submit.prevent>
            <el-form-item label="邮件通知">
              <el-switch
                v-model="notificationSettings.emailEnabled"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>
            <el-form-item label="邮件地址" v-if="notificationSettings.emailEnabled">
              <el-input
                v-model="notificationSettings.emailAddress"
                placeholder="admin@example.com"
                clearable
              />
            </el-form-item>

            <el-form-item label="Webhook 通知">
              <el-switch
                v-model="notificationSettings.webhookEnabled"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>
            <el-form-item label="Webhook URL" v-if="notificationSettings.webhookEnabled">
              <el-input
                v-model="notificationSettings.webhookUrl"
                placeholder="https://hooks.slack.com/services/..."
                clearable
              />
            </el-form-item>

            <el-form-item label="通知级别">
              <el-select
                v-model="notificationSettings.notificationLevel"
                placeholder="选择通知级别"
              >
                <el-option label="所有通知" value="all" />
                <el-option label="仅错误" value="error" />
                <el-option label="错误和警告" value="warning" />
                <el-option label="关闭通知" value="none" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveNotificationSettings" :loading="saving">
                保存通知配置
              </el-button>
              <el-button @click="resetNotificationSettings">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { onMounted, ref } from 'vue';
import { settingsApi } from '../api/settingsApi';
import AppNavigation from '../components/AppNavigation.vue';

// 响应式数据
const saving = ref(false);

// 监控配置
const monitoringSettings = ref({
  webVitalsEnabled: true,
  webVitalsPages: '/dashboard,/dashboard-app,/login',
  microFrontendEnabled: true,
  microFrontendPages: '/dashboard-app,/admin/*',
  errorMonitoringEnabled: true,
  errorMonitoringPages: '/*',
});

// 系统配置
const systemSettings = ref({
  autoRefreshInterval: 30,
  dataRetentionDays: 30,
  errorThreshold: 10,
  performanceThreshold: 2000,
});

// 通知配置
const notificationSettings = ref({
  emailEnabled: false,
  emailAddress: '',
  webhookEnabled: false,
  webhookUrl: '',
  notificationLevel: 'error',
});

// 保存监控配置
const saveMonitoringSettings = async () => {
  saving.value = true;
  try {
    const response = await settingsApi.saveMonitoringSettings(monitoringSettings.value);
    if (response.success) {
      ElMessage.success(response.message);
    } else {
      ElMessage.error('保存失败');
    }
  } catch (error: any) {
    console.error('保存监控配置失败:', error);
    ElMessage.error(`保存失败: ${error.message || '网络错误'}`);
  } finally {
    saving.value = false;
  }
};

// 保存系统配置
const saveSystemSettings = async () => {
  saving.value = true;
  try {
    const response = await settingsApi.saveSystemSettings(systemSettings.value);
    if (response.success) {
      ElMessage.success(response.message);
    } else {
      ElMessage.error('保存失败');
    }
  } catch (error: any) {
    console.error('保存系统配置失败:', error);
    ElMessage.error(`保存失败: ${error.message || '网络错误'}`);
  } finally {
    saving.value = false;
  }
};

// 保存通知配置
const saveNotificationSettings = async () => {
  saving.value = true;
  try {
    const response = await settingsApi.saveNotificationSettings(notificationSettings.value);
    if (response.success) {
      ElMessage.success(response.message);
    } else {
      ElMessage.error('保存失败');
    }
  } catch (error: any) {
    console.error('保存通知配置失败:', error);
    ElMessage.error(`保存失败: ${error.message || '网络错误'}`);
  } finally {
    saving.value = false;
  }
};

// 重置配置
const resetMonitoringSettings = () => {
  monitoringSettings.value = {
    webVitalsEnabled: true,
    webVitalsPages: '/dashboard,/dashboard-app,/login',
    microFrontendEnabled: true,
    microFrontendPages: '/dashboard-app,/admin/*',
    errorMonitoringEnabled: true,
    errorMonitoringPages: '/*',
  };
  ElMessage.info('监控配置已重置');
};

const resetSystemSettings = () => {
  systemSettings.value = {
    autoRefreshInterval: 30,
    dataRetentionDays: 30,
    errorThreshold: 10,
    performanceThreshold: 2000,
  };
  ElMessage.info('系统配置已重置');
};

const resetNotificationSettings = () => {
  notificationSettings.value = {
    emailEnabled: false,
    emailAddress: '',
    webhookEnabled: false,
    webhookUrl: '',
    notificationLevel: 'error',
  };
  ElMessage.info('通知配置已重置');
};

// 组件挂载时加载配置
onMounted(async () => {
  try {
    const response = await settingsApi.getSettings();
    if (response.success) {
      const config = response.data;
      systemSettings.value = config.system;
      monitoringSettings.value = config.monitoring;
      notificationSettings.value = config.notification;
      ElMessage.success('配置已加载');
    } else {
      ElMessage.error('加载配置失败，使用默认配置');
    }
  } catch (error: any) {
    console.error('加载配置失败:', error);
    ElMessage.error('加载配置失败，使用默认配置');
  }
});
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #303133;
  margin-bottom: 10px;
}

.page-header p {
  color: #606266;
  font-size: 16px;
}

.settings-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-section {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  font-weight: 600;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.unit {
  margin-left: 10px;
  color: #606266;
}

.el-form-item {
  margin-bottom: 25px;
}

.el-button {
  margin-right: 10px;
}
</style>
