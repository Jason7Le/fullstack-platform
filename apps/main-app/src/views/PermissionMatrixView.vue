<template>
  <div class="permission-matrix-container">
    <!-- 页面头部 -->
    <PageHeader
      title="权限矩阵管理"
      subtitle="管理角色与资源的权限关系"
      :icon="Key"
      theme="purple"
    />

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 权限提示 -->
      <div v-if="!authStore.isAdmin" class="permission-notice">
        <el-alert title="只读模式" type="info" :closable="false" show-icon>
          <template #default>
            <p>您当前以非管理员身份访问权限矩阵，只能查看权限配置，无法进行修改操作。</p>
          </template>
        </el-alert>
      </div>

      <!-- 权限矩阵表格 -->
      <div class="matrix-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <span
                ><el-icon><Grid /></el-icon>权限矩阵表格</span
              >
              <div class="toolbar-right" v-if="authStore.isAdmin">
                <el-button @click="validatePermissions" :icon="View"> 验证权限 </el-button>
                <el-button @click="handleResetPermissions" :icon="Refresh"> 重置权限 </el-button>
                <el-button @click="handleExportPermissions" :icon="Download"> 导出配置 </el-button>
                <el-button
                  type="primary"
                  @click="handleSavePermissions"
                  :loading="saving"
                  :icon="Check"
                >
                  保存权限
                </el-button>
              </div>
            </div>
          </template>

          <div class="matrix-table">
            <el-table
              :data="matrixData"
              border
              style="width: 100%"
              :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
              table-layout="fixed"
            >
              <!-- 角色列 -->
              <el-table-column prop="role" label="角色" width="140" fixed="left">
                <template #default="{ row }">
                  <el-tag :type="getRoleTagType(row.role)" size="small">
                    {{ getRoleText(row.role) }}
                  </el-tag>
                </template>
              </el-table-column>

              <!-- 动态资源列 -->
              <el-table-column
                v-for="resource in resources"
                :key="resource.key"
                :label="resource.name"
                :min-width="140"
                align="center"
              >
                <template #default="{ row }">
                  <el-select
                    v-if="authStore.isAdmin"
                    v-model="row.permissions[resource.key]"
                    size="small"
                    @change="handlePermissionChange(row, resource.key, $event)"
                  >
                    <el-option label="无权限" value="none" />
                    <el-option label="只读" value="read" />
                    <el-option label="读写" value="write" />
                    <el-option label="完全控制" value="full" />
                  </el-select>
                  <el-tag
                    v-else
                    :type="getPermissionTagType(row.permissions[resource.key])"
                    size="small"
                  >
                    {{ getPermissionText(row.permissions[resource.key]) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </div>

      <!-- 权限说明 -->
      <div class="permission-legend">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>
                <el-icon><InfoFilled /></el-icon>
                权限级别说明
              </span>
            </div>
          </template>
          <div class="legend-content">
            <div class="legend-grid">
              <div class="legend-item">
                <div class="legend-icon">
                  <el-icon><Lock /></el-icon>
                </div>
                <div class="legend-info">
                  <el-tag type="info" size="large">无权限</el-tag>
                  <p>无法访问该资源</p>
                </div>
              </div>
              <div class="legend-item">
                <div class="legend-icon">
                  <el-icon><View /></el-icon>
                </div>
                <div class="legend-info">
                  <el-tag type="success" size="large">只读</el-tag>
                  <p>只能查看，不能修改</p>
                </div>
              </div>
              <div class="legend-item">
                <div class="legend-icon">
                  <el-icon><Edit /></el-icon>
                </div>
                <div class="legend-info">
                  <el-tag type="warning" size="large">读写</el-tag>
                  <p>可以查看和修改</p>
                </div>
              </div>
              <div class="legend-item">
                <div class="legend-icon">
                  <el-icon><Key /></el-icon>
                </div>
                <div class="legend-info">
                  <el-tag type="danger" size="large">完全控制</el-tag>
                  <p>所有权限包括删除</p>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Check,
  Download,
  Edit,
  Grid,
  InfoFilled,
  Key,
  Lock,
  Refresh,
  View,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { onMounted, ref } from 'vue';
import PageHeader from '../components/PageHeader.vue';
import { useAuthStore } from '../stores/auth';

// Auth store
const authStore = useAuthStore();

// 角色定义
const roles = ref([
  { key: 'admin', name: '管理员' },
  { key: 'user', name: '普通用户' },
  { key: 'guest', name: '访客' },
]);

// 资源定义
const resources = ref([
  { key: 'user_management', name: '用户管理' },
  { key: 'data_view', name: '数据查看' },
  { key: 'file_upload', name: '文件上传' },
  { key: 'system_config', name: '系统配置' },
  { key: 'report_generate', name: '报表生成' },
  { key: 'permission_matrix', name: '权限矩阵' },
]);

// 权限矩阵数据
const matrixData = ref<any[]>([]);
const saving = ref(false);

// 权限统计信息
const permissionStats = ref({
  totalPermissions: 0,
  grantedPermissions: 0,
  deniedPermissions: 0,
});

// 初始化矩阵数据
const initMatrixData = () => {
  matrixData.value = roles.value.map((role) => {
    const permissions: any = {};
    resources.value.forEach((resource) => {
      // 设置默认权限
      permissions[resource.key] = getDefaultPermission(role.key, resource.key);
    });

    return {
      role: role.key,
      permissions,
    };
  });

  // 计算权限统计
  calculatePermissionStats();
};

// 计算权限统计
const calculatePermissionStats = () => {
  const total = roles.value.length * resources.value.length;
  let granted = 0;

  matrixData.value.forEach((row) => {
    Object.values(row.permissions).forEach((permission) => {
      if (permission !== 'none') {
        granted++;
      }
    });
  });

  permissionStats.value = {
    totalPermissions: total,
    grantedPermissions: granted,
    deniedPermissions: total - granted,
  };
};

// 获取默认权限
const getDefaultPermission = (role: string, resource: string) => {
  // 管理员默认拥有所有权限
  if (role === 'admin') return 'full';

  // 普通用户默认权限
  if (role === 'user') {
    switch (resource) {
      case 'data_view':
      case 'file_upload':
        return 'write';
      case 'report_generate':
        return 'read';
      default:
        return 'none';
    }
  }

  // 访客默认权限
  if (role === 'guest') {
    return resource === 'data_view' ? 'read' : 'none';
  }

  return 'none';
};

// 处理权限变更
const handlePermissionChange = (row: any, resourceKey: string, newPermission: string) => {
  console.log(`角色 ${row.role} 对资源 ${resourceKey} 的权限变更为: ${newPermission}`);
  // 重新计算权限统计
  calculatePermissionStats();
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
  const roleMap: Record<string, string> = {
    admin: '管理员',
    user: '普通用户',
    guest: '访客',
  };
  return roleMap[role] || role;
};

// 保存权限
const handleSavePermissions = async () => {
  try {
    saving.value = true;
    // 这里调用后端API保存权限配置
    // await savePermissionMatrixApi(matrixData.value);

    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000));

    ElMessage.success('权限配置保存成功');
  } catch (error) {
    ElMessage.error('权限配置保存失败');
  } finally {
    saving.value = false;
  }
};

// 重置权限到默认值
const handleResetPermissions = () => {
  initMatrixData();
  ElMessage.success('权限已重置为默认配置');
};

// 导出权限配置
const handleExportPermissions = () => {
  const dataStr = JSON.stringify(matrixData.value, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'permission-matrix.json';
  link.click();
  URL.revokeObjectURL(url);
  ElMessage.success('权限配置已导出');
};

// 获取权限标签类型
const getPermissionTagType = (permission: string) => {
  switch (permission) {
    case 'none':
      return 'info';
    case 'read':
      return 'success';
    case 'write':
      return 'warning';
    case 'full':
      return 'danger';
    default:
      return 'info';
  }
};

// 获取权限文本
const getPermissionText = (permission: string) => {
  switch (permission) {
    case 'none':
      return '无权限';
    case 'read':
      return '只读';
    case 'write':
      return '读写';
    case 'full':
      return '完全控制';
    default:
      return '无权限';
  }
};

// 验证权限配置
const validatePermissions = () => {
  const issues: string[] = [];

  // 检查是否有管理员角色
  const adminRole = matrixData.value.find((row) => row.role === 'admin');
  if (!adminRole) {
    issues.push('缺少管理员角色');
  } else {
    // 检查管理员是否有所有权限
    const adminPermissions = Object.values(adminRole.permissions);
    const hasAllPermissions = adminPermissions.every((permission) => permission !== 'none');
    if (!hasAllPermissions) {
      issues.push('管理员应该拥有所有资源的权限');
    }
  }

  // 检查是否有资源没有任何权限
  resources.value.forEach((resource) => {
    const hasAnyPermission = matrixData.value.some(
      (row) => row.permissions[resource.key] !== 'none',
    );
    if (!hasAnyPermission) {
      issues.push(`资源 "${resource.name}" 没有任何角色可以访问`);
    }
  });

  if (issues.length === 0) {
    ElMessage.success('权限配置验证通过');
  } else {
    ElMessage.warning(`权限配置存在问题：${issues.join('；')}`);
  }
};

// 组件挂载时初始化
onMounted(() => {
  initMatrixData();
});
</script>

<style scoped>
.permission-matrix-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 权限提示样式 */
.permission-notice {
  margin-bottom: 10px;
}

.permission-notice .el-alert {
  border-radius: 8px;
}

.permission-notice .el-alert p {
  margin: 8px 0 0 0;
  font-size: 14px;
  line-height: 1.5;
}

/* 矩阵表格样式 */
.matrix-section {
  margin-bottom: 10px;
}

.matrix-section .el-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.toolbar-right .el-button {
  font-size: 13px;
  padding: 8px 12px;
  height: 32px;
}

.matrix-info {
  margin-left: auto;
  display: flex;
  gap: 8px;
  align-items: center;
}

.stats-tag {
  font-size: 12px;
}

.matrix-table {
  overflow-x: auto;
  width: 100%;
}

.matrix-table .el-table {
  width: 100% !important;
}

.matrix-table .el-table__body-wrapper {
  overflow-x: auto;
}

.matrix-table .el-table__header-wrapper {
  overflow-x: auto;
}

/* 权限说明样式 */
.permission-legend {
  margin-top: 10px;
}

.permission-legend .el-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.legend-content {
  padding: 20px 0;
}

.legend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.legend-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.legend-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
}

.legend-item:nth-child(1) .legend-icon {
  background: linear-gradient(135deg, #909399 0%, #606266 100%);
}

.legend-item:nth-child(2) .legend-icon {
  background: linear-gradient(135deg, #67c23a 0%, #529b2e 100%);
}

.legend-item:nth-child(3) .legend-icon {
  background: linear-gradient(135deg, #e6a23c 0%, #b88230 100%);
}

.legend-item:nth-child(4) .legend-icon {
  background: linear-gradient(135deg, #f56c6c 0%, #c45656 100%);
}

.legend-info {
  flex: 1;
}

.legend-info p {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .toolbar-right {
    justify-content: center;
    flex-wrap: wrap;
  }

  .toolbar-right .el-button {
    font-size: 12px;
    padding: 6px 10px;
    height: 28px;
  }

  .matrix-table {
    font-size: 12px;
  }

  .matrix-table .el-table-column {
    min-width: 100px !important;
  }

  .legend-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .legend-item {
    padding: 12px;
  }

  .legend-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .matrix-table {
    font-size: 11px;
  }

  .matrix-table .el-table-column {
    min-width: 80px !important;
  }

  .matrix-table .el-tag {
    font-size: 10px;
    padding: 2px 6px;
  }

  .matrix-table .el-select {
    font-size: 11px;
  }
}
</style>
