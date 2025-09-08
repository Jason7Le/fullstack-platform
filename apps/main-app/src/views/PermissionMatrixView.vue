<template>
  <PageContainer
    title="权限矩阵管理"
    subtitle="管理角色与资源的权限关系"
    icon="Key"
    back-path="/dashboard"
  >
    <template #actions>
      <el-button @click="validatePermissions">
        <el-icon><View /></el-icon>
        验证
      </el-button>
      <el-button @click="handleResetPermissions">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
      <el-button @click="handleExportPermissions">
        <el-icon><Download /></el-icon>
        导出
      </el-button>
      <el-button type="primary" @click="handleSavePermissions" :loading="saving">
        <el-icon><Check /></el-icon>
        保存权限
      </el-button>
    </template>

    <!-- 权限矩阵表格 -->
    <div class="matrix-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <el-icon><Grid /></el-icon>
            <span>权限矩阵</span>
            <div class="matrix-info">
              <el-tag type="info">{{ roles.length }} 个角色 × {{ resources.length }} 个资源</el-tag>
              <el-tag type="success" class="stats-tag">
                已授权: {{ permissionStats.grantedPermissions }}/{{
                  permissionStats.totalPermissions
                }}
              </el-tag>
            </div>
          </div>
        </template>

        <div class="matrix-table">
          <el-table
            :data="matrixData"
            border
            style="width: 100%"
            :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
          >
            <!-- 角色列 -->
            <el-table-column prop="role" label="角色" width="120" fixed="left">
              <template #default="{ row }">
                <el-tag :type="getRoleTagType(row.role)">
                  {{ getRoleText(row.role) }}
                </el-tag>
              </template>
            </el-table-column>

            <!-- 动态资源列 -->
            <el-table-column
              v-for="resource in resources"
              :key="resource.key"
              :label="resource.name"
              :width="120"
              align="center"
            >
              <template #default="{ row }">
                <el-select
                  v-model="row.permissions[resource.key]"
                  size="small"
                  @change="handlePermissionChange(row, resource.key, $event)"
                >
                  <el-option label="无权限" value="none" />
                  <el-option label="只读" value="read" />
                  <el-option label="读写" value="write" />
                  <el-option label="完全控制" value="full" />
                </el-select>
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
            <el-icon><InfoFilled /></el-icon>
            <span>权限说明</span>
          </div>
        </template>
        <div class="legend-content">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="legend-item">
                <el-tag type="info">无权限</el-tag>
                <span>无法访问该资源</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="legend-item">
                <el-tag type="success">只读</el-tag>
                <span>只能查看，不能修改</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="legend-item">
                <el-tag type="warning">读写</el-tag>
                <span>可以查看和修改</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="legend-item">
                <el-tag type="danger">完全控制</el-tag>
                <span>所有权限包括删除</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { Check, Download, Grid, InfoFilled, Refresh, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { onMounted, ref } from 'vue';
import PageContainer from '../components/PageContainer.vue';

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
.matrix-section {
  padding: 20px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
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
}

.permission-legend {
  margin-top: 20px;
}

.legend-content {
  padding: 10px 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.legend-item span {
  font-size: 14px;
  color: #606266;
}

@media (max-width: 768px) {
  .permission-matrix-container {
    padding: 15px;
  }

  .header-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .page-title {
    font-size: 20px;
  }

  .legend-content .el-row {
    flex-direction: column;
  }

  .legend-content .el-col {
    width: 100%;
  }
}
</style>
