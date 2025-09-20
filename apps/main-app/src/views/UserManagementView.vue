<template>
  <div class="user-management-container">
    <!-- 页面头部 -->
    <PageHeader title="用户管理" subtitle="管理系统用户和权限" :icon="User" theme="green" />

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 用户列表 -->
      <div class="user-list-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>
                <el-icon><List /></el-icon>
                用户列表
              </span>
              <div class="header-right">
                <el-tag type="info" class="user-count">共 {{ userList.length }} 个用户</el-tag>
                <el-button v-if="authStore.isAdmin" type="primary" @click="handleCreateUser">
                  <el-icon><Plus /></el-icon>
                  新增用户
                </el-button>
              </div>
            </div>
          </template>

          <!-- 搜索和筛选 -->
          <div class="search-section">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索用户邮箱或姓名"
                  prefix-icon="Search"
                  clearable
                  @input="handleSearch"
                />
              </el-col>
              <el-col :span="6">
                <el-select
                  v-model="roleFilter"
                  placeholder="筛选角色"
                  clearable
                  @change="handleRoleFilter"
                >
                  <el-option label="全部" value="" />
                  <el-option label="管理员" value="admin" />
                  <el-option label="普通用户" value="user" />
                  <el-option label="访客" value="guest" />
                </el-select>
              </el-col>
              <el-col :span="4">
                <el-button @click="handleRefresh">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </el-col>
            </el-row>
          </div>

          <!-- 用户表格 -->
          <el-table
            :data="filteredUserList"
            v-loading="loading"
            stripe
            style="width: 100%"
            @sort-change="handleSortChange"
            resizable
          >
            <el-table-column prop="id" label="ID" width="80" sortable="custom" resizable />
            <el-table-column
              prop="email"
              label="邮箱"
              min-width="200"
              sortable="custom"
              resizable
            />
            <el-table-column prop="name" label="姓名" min-width="120" sortable="custom" resizable />
            <el-table-column prop="role" label="角色" width="100" resizable>
              <template #default="{ row }">
                <el-tag :type="getRoleTagType(row.role)">
                  {{ getRoleText(row.role) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="createdAt"
              label="创建时间"
              width="180"
              sortable="custom"
              resizable
            >
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="updatedAt"
              label="更新时间"
              width="180"
              sortable="custom"
              resizable
            >
              <template #default="{ row }">
                {{ formatDate(row.updatedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="170" fixed="right" resizable>
              <template #default="{ row }">
                <el-button
                  v-if="authStore.isAdmin"
                  type="primary"
                  size="small"
                  @click="handleEditUser(row)"
                >
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button
                  v-if="authStore.isAdmin"
                  type="danger"
                  size="small"
                  @click="handleDeleteUser(row)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-section">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="totalUsers"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>

      <!-- 编辑用户对话框 -->
      <el-dialog
        v-model="editDialogVisible"
        :title="isEditMode ? '编辑用户' : '新增用户'"
        width="500px"
        @close="handleDialogClose"
      >
        <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="80px">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="editForm.email" placeholder="请输入邮箱" :disabled="isEditMode" />
          </el-form-item>
          <el-form-item label="姓名" prop="name">
            <el-input v-model="editForm.name" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="角色" prop="role">
            <el-select v-model="editForm.role" placeholder="选择角色" style="width: 100%">
              <el-option label="管理员" value="admin" />
              <el-option label="普通用户" value="user" />
              <el-option label="访客" value="guest" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="!isEditMode" label="密码" prop="password">
            <el-input
              v-model="editForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="editDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
              {{ isEditMode ? '更新' : '创建' }}
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Delete, Edit, List, Plus, Refresh, User } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';
import { createUserApi, deleteUserApi, getUserListApi, updateUserApi } from '../api/userApi';
import PageHeader from '../components/PageHeader.vue';
import { useAuthStore } from '../stores/auth';

// Auth store
const authStore = useAuthStore();

// 响应式数据
const loading = ref(false);
const submitLoading = ref(false);
const editDialogVisible = ref(false);

const isEditMode = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalUsers = ref(0);
const searchKeyword = ref('');
const roleFilter = ref('');

// 用户列表
const userList = ref<any[]>([]);
const editFormRef = ref<FormInstance>();

// 编辑表单
const editForm = reactive({
  id: null as number | null,
  email: '',
  name: '',
  role: 'user',
  password: '',
});

// 表单验证规则
const editRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, message: '姓名长度不能少于2位', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
};

// 计算属性：过滤后的用户列表
const filteredUserList = computed(() => {
  let filtered = userList.value;

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    filtered = filtered.filter(
      user =>
        user.email.toLowerCase().includes(keyword) || user.name.toLowerCase().includes(keyword),
    );
  }

  // 按角色筛选
  if (roleFilter.value) {
    filtered = filtered.filter(user => user.role === roleFilter.value);
  }

  return filtered;
});

// 获取用户列表
const getUserList = async () => {
  try {
    loading.value = true;
    const response = await getUserListApi();
    userList.value = response || [];
    totalUsers.value = userList.value.length;
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

// 处理角色筛选
const handleRoleFilter = () => {
  // 筛选逻辑已在计算属性中处理
};

// 处理刷新
const handleRefresh = () => {
  getUserList();
};

// 处理排序
const handleSortChange = ({ prop, order }: any) => {
  if (order === 'ascending') {
    userList.value.sort((a, b) => (a[prop] > b[prop] ? 1 : -1));
  } else if (order === 'descending') {
    userList.value.sort((a, b) => (a[prop] < b[prop] ? 1 : -1));
  }
};

// 处理分页
const handleSizeChange = (val: number) => {
  pageSize.value = val;
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
};

// 处理新增用户
const handleCreateUser = () => {
  isEditMode.value = false;
  editForm.id = null;
  editForm.email = '';
  editForm.name = '';
  editForm.role = 'user';
  editForm.password = '';
  editDialogVisible.value = true;
};

// 处理编辑用户
const handleEditUser = (user: any) => {
  isEditMode.value = true;
  editForm.id = user.id;
  editForm.email = user.email;
  editForm.name = user.name;
  editForm.role = user.role;
  editForm.password = '';
  editDialogVisible.value = true;
};

// 处理删除用户
const handleDeleteUser = async (user: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${user.name}" 吗？此操作不可撤销。`, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      draggable: true,
    });

    await deleteUserApi(user.id);
    ElMessage.success('用户删除成功');
    getUserList();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error);
      ElMessage.error('删除用户失败');
    }
  }
};

// 处理提交
const handleSubmit = async () => {
  // 检查表单引用是否存在
  if (!editFormRef.value) {
    ElMessage.error('表单初始化失败，请刷新页面重试');
    return;
  }

  try {
    // 表单验证：根据rules规则验证所有必填字段
    await editFormRef.value.validate();

    // 验证通过，开始提交
    submitLoading.value = true;

    if (isEditMode.value && editForm.id) {
      // 更新用户
      await updateUserApi(editForm.id, {
        name: editForm.name,
        role: editForm.role,
      });
      ElMessage.success('用户更新成功');
    } else {
      // 创建用户
      await createUserApi({
        email: editForm.email,
        name: editForm.name,
        role: editForm.role,
        password: editForm.password,
      });
      ElMessage.success('用户创建成功');
    }

    // 提交成功，关闭对话框并刷新列表
    editDialogVisible.value = false;
    getUserList();
  } catch (error: any) {
    console.log('提交失败:', error);

    // 检查是否是表单验证错误
    if (error && typeof error === 'object' && !error.response && !error.message) {
      // 这是表单验证错误，不显示错误提示（Element Plus会自动显示）
      return;
    }

    // 只处理API错误
    ElMessage.error(
      (isEditMode.value ? '更新' : '创建') +
        '用户失败：' +
        (error.response?.data?.message || error.message || '未知错误'),
    );
  } finally {
    submitLoading.value = false;
  }
};

// 处理对话框关闭
const handleDialogClose = () => {
  editFormRef.value?.resetFields();
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

// 组件挂载时获取用户列表
onMounted(() => {
  getUserList();
});
</script>

<style scoped>
.user-management-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.user-list-section {
  padding: 20px;
}

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

.user-count {
  font-size: 13px;
}

.search-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-right {
    justify-content: center;
    flex-wrap: wrap;
  }

  .search-section .el-row {
    flex-direction: column;
  }

  .search-section .el-col {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>
