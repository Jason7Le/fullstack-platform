<template>
  <div class="monitoring-container">
    <!-- 顶部导航栏 -->
    <AppNavigation />

    <!-- 主要内容区域 -->
    <el-main class="monitoring-main">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1>📊 性能监控中心</h1>
        <p>实时监控系统性能和用户体验指标</p>
      </div>

      <!-- 监控状态卡片 -->
      <div class="status-cards">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-card class="status-card">
              <div class="status-content">
                <div class="status-icon">
                  <el-icon
                    size="40"
                    :color="monitoringConfig.webVitalsEnabled ? '#67c23a' : '#909399'"
                  >
                    <TrendCharts />
                  </el-icon>
                </div>
                <div class="status-info">
                  <h3>Web Vitals</h3>
                  <p>{{ webVitalsStatus }}</p>
                  <div class="status-action">
                    <el-button
                      :type="monitoringConfig.webVitalsEnabled ? 'danger' : 'success'"
                      :loading="toggleLoading.webVitals"
                      size="small"
                      @click="toggleWebVitals"
                    >
                      {{ monitoringConfig.webVitalsEnabled ? '禁用' : '启用' }}
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6">
            <el-card class="status-card">
              <div class="status-content">
                <div class="status-icon">
                  <el-icon
                    size="40"
                    :color="monitoringConfig.microFrontendEnabled ? '#409eff' : '#909399'"
                  >
                    <Connection />
                  </el-icon>
                </div>
                <div class="status-info">
                  <h3>微前端监控</h3>
                  <p>{{ microFrontendStatus }}</p>
                  <div class="status-action">
                    <el-button
                      :type="monitoringConfig.microFrontendEnabled ? 'danger' : 'success'"
                      :loading="toggleLoading.microFrontend"
                      size="small"
                      @click="toggleMicroFrontend"
                    >
                      {{ monitoringConfig.microFrontendEnabled ? '禁用' : '启用' }}
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6">
            <el-card class="status-card">
              <div class="status-content">
                <div class="status-icon">
                  <el-icon
                    size="40"
                    :color="monitoringConfig.errorMonitoringEnabled ? '#e6a23c' : '#909399'"
                  >
                    <Warning />
                  </el-icon>
                </div>
                <div class="status-info">
                  <h3>错误监控</h3>
                  <p>{{ errorMonitoringStatus }}</p>
                  <div class="status-action">
                    <el-button
                      :type="monitoringConfig.errorMonitoringEnabled ? 'danger' : 'success'"
                      :loading="toggleLoading.errorMonitoring"
                      size="small"
                      @click="toggleErrorMonitoring"
                    >
                      {{ monitoringConfig.errorMonitoringEnabled ? '禁用' : '启用' }}
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6">
            <el-card class="status-card">
              <div class="status-content">
                <div class="status-icon">
                  <el-icon size="40" color="#f56c6c"><DataAnalysis /></el-icon>
                </div>
                <div class="status-info">
                  <h3>实时数据</h3>
                  <p>{{ realtimeDataStatus }}</p>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- Web Vitals 指标展示 -->
      <div class="metrics-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>Web Vitals 性能指标</span>
              <el-button type="primary" size="small" @click="refreshMetrics" :loading="loading">
                刷新数据
              </el-button>
            </div>
          </template>

          <div class="metrics-grid">
            <div class="metric-card" v-for="metric in webVitalsMetrics" :key="metric.name">
              <div class="metric-header">
                <h4>{{ metric.displayName }}</h4>
                <el-tag :type="getMetricTagType(metric.rating)">
                  {{ getMetricRatingText(metric.rating) }}
                </el-tag>
              </div>
              <div class="metric-value">
                <span class="value">{{ metric.value }}</span>
                <span class="unit">{{ metric.unit }}</span>
              </div>
              <div class="metric-description">
                {{ metric.description }}
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 微前端性能数据 -->
      <div class="microfrontend-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Connection /></el-icon>
              <span>微前端性能数据</span>
            </div>
          </template>

          <el-table :data="microFrontendData" stripe>
            <el-table-column prop="componentName" label="组件名称" width="200" />
            <el-table-column prop="loadTime" label="加载时间" width="120">
              <template #default="{ row }">
                <span>{{ row.loadTime }}ms</span>
              </template>
            </el-table-column>
            <el-table-column prop="renderTime" label="渲染时间" width="120">
              <template #default="{ row }">
                <span>{{ row.renderTime }}ms</span>
              </template>
            </el-table-column>
            <el-table-column prop="timestamp" label="时间戳" width="180">
              <template #default="{ row }">
                <span>{{ formatTimestamp(row.timestamp) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="url" label="页面URL" />
            <template #empty>
              <div class="empty-state">
                <el-icon size="48" color="#c0c4cc"><DataBoard /></el-icon>
                <p>暂无微前端性能数据</p>
              </div>
            </template>
          </el-table>
        </el-card>
      </div>

      <!-- 错误监控数据 -->
      <div class="error-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Warning /></el-icon>
              <span>错误监控数据</span>
            </div>
          </template>

          <el-table :data="errorData" stripe>
            <el-table-column prop="component" label="组件" width="150" />
            <el-table-column prop="type" label="错误类型" width="120" />
            <el-table-column prop="message" label="错误信息" />
            <el-table-column prop="severity" label="严重程度" width="100">
              <template #default="{ row }">
                <el-tag :type="getSeverityTagType(row.severity)">
                  {{ getSeverityText(row.severity) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="timestamp" label="时间" width="180">
              <template #default="{ row }">
                <span>{{ formatTimestamp(row.timestamp) }}</span>
              </template>
            </el-table-column>
            <template #empty>
              <div class="empty-state">
                <el-icon size="48" color="#67c23a"><SuccessFilled /></el-icon>
                <p>暂无错误数据</p>
              </div>
            </template>
          </el-table>
        </el-card>
      </div>

      <!-- 实时监控配置 -->
      <div class="config-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>监控配置</span>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="Web Vitals 监控">
              <el-tag :type="monitoringConfig.webVitalsEnabled ? 'success' : 'danger'">
                {{ monitoringConfig.webVitalsEnabled ? '已启用' : '已禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="监控页面">
              {{ monitoringConfig.webVitalsPages || '所有页面' }}
            </el-descriptions-item>
            <el-descriptions-item label="微前端监控">
              <el-tag :type="monitoringConfig.microFrontendEnabled ? 'success' : 'danger'">
                {{ monitoringConfig.microFrontendEnabled ? '已启用' : '已禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="错误监控">
              <el-tag :type="monitoringConfig.errorMonitoringEnabled ? 'success' : 'danger'">
                {{ monitoringConfig.errorMonitoringEnabled ? '已启用' : '已禁用' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { onMounted, ref } from 'vue';
import { monitoringApi } from '../api/monitoringApi';
import { settingsApi } from '../api/settingsApi';
import { formatTimestamp } from '../utils/dateUtils';

// 响应式数据
const loading = ref(false);
const webVitalsStatus = ref('已启用');
const microFrontendStatus = ref('已启用');
const errorMonitoringStatus = ref('已启用');
const realtimeDataStatus = ref('正常');

// 切换按钮加载状态
const toggleLoading = ref({
  webVitals: false,
  microFrontend: false,
  errorMonitoring: false,
});

// Web Vitals 指标数据
const webVitalsMetrics = ref([
  {
    name: 'TTFB',
    displayName: '首字节时间',
    value: '120',
    unit: 'ms',
    rating: 'good',
    description: '服务器响应时间',
  },
  {
    name: 'FCP',
    displayName: '首次内容绘制',
    value: '800',
    unit: 'ms',
    rating: 'good',
    description: '页面首次内容渲染时间',
  },
  {
    name: 'LCP',
    displayName: '最大内容绘制',
    value: '1200',
    unit: 'ms',
    rating: 'good',
    description: '最大内容元素渲染时间',
  },
  {
    name: 'INP',
    displayName: '交互到下次绘制',
    value: '100',
    unit: 'ms',
    rating: 'good',
    description: '用户交互响应时间',
  },
  {
    name: 'CLS',
    displayName: '累积布局偏移',
    value: '0.05',
    unit: '',
    rating: 'good',
    description: '页面布局稳定性',
  },
]);

// 微前端性能数据
const microFrontendData = ref([]);

// 错误监控数据
const errorData = ref([]);

// 监控配置
const monitoringConfig = ref({
  webVitalsEnabled: false,
  webVitalsPages: '',
  microFrontendEnabled: false,
  microFrontendPages: '',
  errorMonitoringEnabled: false,
  errorMonitoringPages: '',
});

// 方法
/**
 * 加载监控配置
 * 从设置服务获取监控相关的配置信息
 */
const loadMonitoringConfig = async () => {
  try {
    const response = await settingsApi.getSettings();
    if (response.success && response.data.monitoring) {
      const monitoring = response.data.monitoring;

      // 确保布尔值字段类型正确
      monitoringConfig.value = {
        webVitalsEnabled: Boolean(monitoring.webVitalsEnabled),
        webVitalsPages: monitoring.webVitalsPages || '/dashboard,/dashboard-app,/login',
        microFrontendEnabled: Boolean(monitoring.microFrontendEnabled),
        microFrontendPages: monitoring.microFrontendPages || '/dashboard-app,/admin/*',
        errorMonitoringEnabled: Boolean(monitoring.errorMonitoringEnabled),
        errorMonitoringPages: monitoring.errorMonitoringPages || '/*',
      };

      // 更新状态显示
      webVitalsStatus.value = monitoringConfig.value.webVitalsEnabled ? '已启用' : '已禁用';
      microFrontendStatus.value = monitoringConfig.value.microFrontendEnabled ? '已启用' : '已禁用';
      errorMonitoringStatus.value = monitoringConfig.value.errorMonitoringEnabled
        ? '已启用'
        : '已禁用';
    }
  } catch (error) {
    console.error('加载监控配置失败:', error);
    ElMessage.error('加载监控配置失败');
  }
};

/**
 * 切换 Web Vitals 监控状态
 */
const toggleWebVitals = async () => {
  toggleLoading.value.webVitals = true;
  try {
    // 切换状态
    monitoringConfig.value.webVitalsEnabled = !monitoringConfig.value.webVitalsEnabled;

    // 只传递监控相关的配置字段，确保布尔值类型正确
    const updatedConfig = {
      webVitalsEnabled: Boolean(monitoringConfig.value.webVitalsEnabled),
      webVitalsPages: monitoringConfig.value.webVitalsPages || '/dashboard,/dashboard-app,/login',
      microFrontendEnabled: Boolean(monitoringConfig.value.microFrontendEnabled),
      microFrontendPages: monitoringConfig.value.microFrontendPages || '/dashboard-app,/admin/*',
      errorMonitoringEnabled: Boolean(monitoringConfig.value.errorMonitoringEnabled),
      errorMonitoringPages: monitoringConfig.value.errorMonitoringPages || '/*',
    };

    await settingsApi.saveMonitoringSettings(updatedConfig);
    webVitalsStatus.value = monitoringConfig.value.webVitalsEnabled ? '已启用' : '已禁用';

    ElMessage.success(
      `Web Vitals 监控已${monitoringConfig.value.webVitalsEnabled ? '启用' : '禁用'}`,
    );
  } catch (error) {
    console.error('切换 Web Vitals 状态失败:', error);
    ElMessage.error('切换 Web Vitals 状态失败');
    // 恢复原状态
    monitoringConfig.value.webVitalsEnabled = !monitoringConfig.value.webVitalsEnabled;
  } finally {
    toggleLoading.value.webVitals = false;
  }
};

/**
 * 切换微前端监控状态
 */
const toggleMicroFrontend = async () => {
  toggleLoading.value.microFrontend = true;
  try {
    // 切换状态
    monitoringConfig.value.microFrontendEnabled = !monitoringConfig.value.microFrontendEnabled;

    // 只传递监控相关的配置字段，确保布尔值类型正确
    const updatedConfig = {
      webVitalsEnabled: Boolean(monitoringConfig.value.webVitalsEnabled),
      webVitalsPages: monitoringConfig.value.webVitalsPages || '/dashboard,/dashboard-app,/login',
      microFrontendEnabled: Boolean(monitoringConfig.value.microFrontendEnabled),
      microFrontendPages: monitoringConfig.value.microFrontendPages || '/dashboard-app,/admin/*',
      errorMonitoringEnabled: Boolean(monitoringConfig.value.errorMonitoringEnabled),
      errorMonitoringPages: monitoringConfig.value.errorMonitoringPages || '/*',
    };

    await settingsApi.saveMonitoringSettings(updatedConfig);
    microFrontendStatus.value = monitoringConfig.value.microFrontendEnabled ? '已启用' : '已禁用';

    ElMessage.success(
      `微前端监控已${monitoringConfig.value.microFrontendEnabled ? '启用' : '禁用'}`,
    );
  } catch (error) {
    console.error('切换微前端监控状态失败:', error);
    ElMessage.error('切换微前端监控状态失败');
    // 恢复原状态
    monitoringConfig.value.microFrontendEnabled = !monitoringConfig.value.microFrontendEnabled;
  } finally {
    toggleLoading.value.microFrontend = false;
  }
};

/**
 * 切换错误监控状态
 */
const toggleErrorMonitoring = async () => {
  toggleLoading.value.errorMonitoring = true;
  try {
    // 切换状态
    monitoringConfig.value.errorMonitoringEnabled = !monitoringConfig.value.errorMonitoringEnabled;

    // 只传递监控相关的配置字段，确保布尔值类型正确
    const updatedConfig = {
      webVitalsEnabled: Boolean(monitoringConfig.value.webVitalsEnabled),
      webVitalsPages: monitoringConfig.value.webVitalsPages || '/dashboard,/dashboard-app,/login',
      microFrontendEnabled: Boolean(monitoringConfig.value.microFrontendEnabled),
      microFrontendPages: monitoringConfig.value.microFrontendPages || '/dashboard-app,/admin/*',
      errorMonitoringEnabled: Boolean(monitoringConfig.value.errorMonitoringEnabled),
      errorMonitoringPages: monitoringConfig.value.errorMonitoringPages || '/*',
    };

    await settingsApi.saveMonitoringSettings(updatedConfig);
    errorMonitoringStatus.value = monitoringConfig.value.errorMonitoringEnabled
      ? '已启用'
      : '已禁用';

    ElMessage.success(
      `错误监控已${monitoringConfig.value.errorMonitoringEnabled ? '启用' : '禁用'}`,
    );
  } catch (error) {
    console.error('切换错误监控状态失败:', error);
    ElMessage.error('切换错误监控状态失败');
    // 恢复原状态
    monitoringConfig.value.errorMonitoringEnabled = !monitoringConfig.value.errorMonitoringEnabled;
  } finally {
    toggleLoading.value.errorMonitoring = false;
  }
};

const refreshMetrics = async () => {
  loading.value = true;
  try {
    // 调用真实的后端 API
    const [metricsResponse, microFrontendResponse, errorsResponse] = await Promise.all([
      monitoringApi.getMetrics(),
      monitoringApi.getMicroFrontendPerformance(),
      monitoringApi.getErrorStatistics(),
    ]);

    // 更新 Web Vitals 数据
    if (metricsResponse.success && metricsResponse.data.metrics.webVitals) {
      const webVitals = metricsResponse.data.metrics.webVitals;
      webVitalsMetrics.value = [
        {
          name: 'TTFB',
          displayName: '首字节时间',
          value: webVitals.TTFB.value.toString(),
          unit: webVitals.TTFB.unit,
          rating: webVitals.TTFB.rating,
          description: '服务器响应时间',
        },
        {
          name: 'FCP',
          displayName: '首次内容绘制',
          value: webVitals.FCP.value.toString(),
          unit: webVitals.FCP.unit,
          rating: webVitals.FCP.rating,
          description: '页面首次内容渲染时间',
        },
        {
          name: 'LCP',
          displayName: '最大内容绘制',
          value: webVitals.LCP.value.toString(),
          unit: webVitals.LCP.unit,
          rating: webVitals.LCP.rating,
          description: '最大内容元素渲染时间',
        },
        {
          name: 'INP',
          displayName: '交互到下次绘制',
          value: webVitals.INP.value.toString(),
          unit: webVitals.INP.unit,
          rating: webVitals.INP.rating,
          description: '用户交互响应时间',
        },
        {
          name: 'CLS',
          displayName: '累积布局偏移',
          value: webVitals.CLS.value.toString(),
          unit: webVitals.CLS.unit,
          rating: webVitals.CLS.rating,
          description: '页面布局稳定性',
        },
      ];
    }

    // 更新微前端性能数据
    if (microFrontendResponse.success && microFrontendResponse.data.performance) {
      const performanceData = microFrontendResponse.data.performance;
      // 确保数据是数组格式
      microFrontendData.value = Array.isArray(performanceData) ? performanceData : [];
    }

    // 更新错误监控数据
    if (errorsResponse.success && errorsResponse.data.statistics) {
      const statisticsData = errorsResponse.data.statistics;
      // 直接使用 statistics 数组
      errorData.value = Array.isArray(statisticsData) ? statisticsData : [];
    }

    // 更新实时数据状态
    realtimeDataStatus.value = '正常';

    ElMessage.success('监控数据已刷新');
  } catch (error: any) {
    console.error('刷新监控数据失败:', error);
    ElMessage.error(`刷新数据失败: ${error.message || '网络错误'}`);
  } finally {
    loading.value = false;
  }
};

const getMetricTagType = (rating: string) => {
  switch (rating) {
    case 'good':
      return 'success';
    case 'needs-improvement':
      return 'warning';
    case 'poor':
      return 'danger';
    default:
      return 'info';
  }
};

const getMetricRatingText = (rating: string) => {
  switch (rating) {
    case 'good':
      return '良好';
    case 'needs-improvement':
      return '需改进';
    case 'poor':
      return '较差';
    default:
      return '未知';
  }
};

const getSeverityTagType = (severity: string) => {
  switch (severity) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'danger';
    case 'critical':
      return 'danger';
    default:
      return 'info';
  }
};

const getSeverityText = (severity: string) => {
  switch (severity) {
    case 'low':
      return '低';
    case 'medium':
      return '中';
    case 'high':
      return '高';
    case 'critical':
      return '严重';
    default:
      return '未知';
  }
};

// 组件挂载时初始化
onMounted(async () => {
  // 页面加载时先获取监控配置，然后获取监控数据
  await loadMonitoringConfig();
  await refreshMetrics();
});
</script>

<style scoped>
.monitoring-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.monitoring-main {
  padding: 20px;
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

.status-cards {
  margin-bottom: 30px;
}

.status-card {
  height: 140px;
  transition: all 0.3s ease;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-content {
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
}

.status-icon {
  margin-right: 15px;
  transition: color 0.3s ease;
}

.status-info {
  flex: 1;
}

.status-info h3 {
  margin: 0 0 5px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.status-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.status-action {
  margin-top: 8px;
}

.status-action .el-button {
  width: 60px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header .el-button {
  margin-left: auto;
}

.metrics-section,
.microfrontend-section,
.error-section,
.config-section {
  margin-bottom: 30px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.metric-card {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.metric-header h4 {
  margin: 0;
  color: #303133;
}

.metric-value {
  margin-bottom: 10px;
}

.metric-value .value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.metric-value .unit {
  font-size: 14px;
  color: #909399;
  margin-left: 5px;
}

.metric-description {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-state p {
  margin-top: 16px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .status-cards .el-col {
    margin-bottom: 15px;
  }
}
</style>
