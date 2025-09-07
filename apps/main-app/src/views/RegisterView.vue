<template>
  <div class="register-container">
    <div class="register-box">
      <!-- 注册标题 -->
      <div class="register-header">
        <h2 class="register-title">
          <el-icon class="title-icon"><UserFilled /></el-icon>
          {{ appTitle }}<br />注册
        </h2>
        <p class="register-subtitle">创建您的账户，开始使用全栈微前端数据平台</p>
      </div>

      <!-- 注册表单 -->
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        size="large"
        @keyup.enter="handleRegister"
      >
        <!-- 姓名输入框 -->
        <el-form-item prop="name">
          <el-input
            v-model="registerForm.name"
            placeholder="请输入您的姓名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <!-- 邮箱输入框 -->
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱地址"
            prefix-icon="Message"
            clearable
            type="email"
          />
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            placeholder="请输入密码（至少6位）"
            prefix-icon="Lock"
            show-password
            clearable
            type="password"
          />
        </el-form-item>

        <!-- 确认密码输入框 -->
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            placeholder="请再次输入密码"
            prefix-icon="Lock"
            show-password
            clearable
            type="password"
          />
        </el-form-item>

        <!-- 用户角色选择 -->
        <el-form-item prop="role">
          <el-select v-model="registerForm.role" placeholder="选择用户角色" style="width: 100%">
            <el-option label="普通用户" value="user" />
            <el-option label="访客" value="guest" />
          </el-select>
        </el-form-item>

        <!-- 用户协议 -->
        <el-form-item class="agreement-section">
          <el-checkbox v-model="registerForm.agreedToTerms">
            我已阅读并同意
            <el-link type="primary" :underline="false" @click="showTerms">
              《用户服务协议》
            </el-link>
            和
            <el-link type="primary" :underline="false" @click="showPrivacy"> 《隐私政策》 </el-link>
          </el-checkbox>
        </el-form-item>

        <!-- 注册按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            class="register-button"
            :loading="loading"
            @click="handleRegister"
          >
            <el-icon v-if="!loading"><Check /></el-icon>
            {{ loading ? '注册中...' : '立即注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 登录链接 -->
      <div class="register-footer">
        <p class="login-tip">
          已有账号？
          <el-link type="primary" :underline="false" @click="goToLogin"> 立即登录 </el-link>
        </p>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="register-background">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, UserFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { registerApi } from '../api/authApi';
import { useAuthStore } from '../stores/auth';

// 路由
const router = useRouter();

// Auth store
const authStore = useAuthStore();

// 应用标题
const appTitle = import.meta.env.VITE_APP_TITLE || '全栈微前端数据平台';

// 表单引用
const registerFormRef = ref<FormInstance>();

// 加载状态
const loading = ref(false);

// 注册表单数据
const registerForm = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'user',
  agreedToTerms: false,
});

// 自定义验证器：确认密码
const validateConfirmPassword = (_rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

// 自定义验证器：用户协议
const validateAgreement = (_rule: any, value: any, callback: any) => {
  if (!value) {
    callback(new Error('请阅读并同意用户协议和隐私政策'));
  } else {
    callback();
  }
};

// 表单验证规则
const registerRules: FormRules = {
  name: [
    { required: true, message: '请输入您的姓名', trigger: 'blur' },
    { min: 2, message: '姓名长度不能少于2位', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }],
  role: [{ required: true, message: '请选择用户角色', trigger: 'change' }],
  agreedToTerms: [{ required: true, validator: validateAgreement, trigger: 'change' }],
};

// 处理注册
const handleRegister = async () => {
  // 检查表单引用是否存在
  if (!registerFormRef.value) {
    ElMessage.error('表单初始化失败，请刷新页面重试');
    return;
  }

  try {
    // 表单验证：根据rules规则验证所有必填字段
    await registerFormRef.value.validate();

    // 验证通过，开始注册
    loading.value = true;

    // 调用注册API
    const response = await registerApi({
      name: registerForm.name,
      email: registerForm.email,
      password: registerForm.password,
      role: registerForm.role,
    });

    // 注册成功
    ElMessage.success('注册成功！正在自动登录...');

    // 使用auth store保存登录信息
    authStore.login(response.data.access_token, response.data.user);

    // 跳转到Dashboard页面
    router.push('/dashboard');
  } catch (error: any) {
    console.error('注册失败:', error);

    // 检查是否是表单验证错误
    if (error && typeof error === 'object' && !error.response && !error.message) {
      // 这是表单验证错误，不显示错误提示（Element Plus会自动显示）
      return;
    }

    // 只处理API错误
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message);
    } else {
      ElMessage.error('注册失败，请检查输入信息');
    }
  } finally {
    loading.value = false;
  }
};

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login');
};

// 显示用户协议
const showTerms = () => {
  ElMessageBox.alert(
    '用户服务协议内容...\n\n1. 服务条款\n2. 用户责任\n3. 平台责任\n4. 免责声明',
    '用户服务协议',
    {
      confirmButtonText: '我知道了',
      type: 'info',
    },
  );
};

// 显示隐私政策
const showPrivacy = () => {
  ElMessageBox.alert(
    '隐私政策内容...\n\n1. 信息收集\n2. 信息使用\n3. 信息保护\n4. 信息共享',
    '隐私政策',
    {
      confirmButtonText: '我知道了',
      type: 'info',
    },
  );
};
</script>

<style scoped>
.register-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  padding: 20px 0;
}

.register-box {
  position: relative;
  z-index: 10;
  width: 450px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
}

.title-icon {
  font-size: 32px;
  color: #67c23a;
}

.register-subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.register-form {
  margin-top: 30px;
}

.agreement-section {
  margin-bottom: 20px;
}

.register-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(135deg, #67c23a 0%, #409eff 100%);
  border: none;
  transition: all 0.3s ease;
}

.register-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(103, 194, 58, 0.3);
}

.register-footer {
  text-align: center;
  margin-top: 20px;
}

.login-tip {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

/* 背景装饰 */
.register-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 10%;
  animation-delay: 2s;
}

.circle-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .register-box {
    width: 90%;
    padding: 30px 20px;
  }

  .register-title {
    font-size: 24px;
  }
}
</style>
