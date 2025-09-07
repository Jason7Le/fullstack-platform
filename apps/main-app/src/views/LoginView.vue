<template>
  <div class="login-container">
    <div class="login-box">
      <!-- 登录标题 -->
      <div class="login-header">
        <h2 class="login-title">
          <el-icon class="title-icon"><User /></el-icon>
          {{ appTitle }}
        </h2>
        <p class="login-subtitle">欢迎使用全栈微前端数据平台</p>
      </div>

      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        size="large"
        @keyup.enter="handleLogin"
      >
        <!-- 邮箱输入框 -->
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="请输入邮箱地址"
            prefix-icon="Message"
            clearable
            type="email"
          />
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            clearable
            type="password"
          />
        </el-form-item>

        <!-- 记住我和忘记密码 -->
        <el-form-item class="login-options">
          <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
          <el-link type="primary" :underline="false" class="forgot-password"> 忘记密码？ </el-link>
        </el-form-item>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button type="primary" class="login-button" :loading="loading" @click="handleLogin">
            <el-icon v-if="!loading"><Right /></el-icon>
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 注册链接 -->
      <div class="login-footer">
        <p class="register-tip">
          还没有账号？
          <el-link type="primary" :underline="false" @click="goToRegister"> 立即注册 </el-link>
        </p>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="login-background">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Right, User } from '@element-plus/icons-vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginApi } from '../api/authApi';
import { useAuthStore } from '../stores/auth';

// 路由
const router = useRouter();

// Auth store
const authStore = useAuthStore();

// 应用标题
const appTitle = import.meta.env.VITE_APP_TITLE || '全栈微前端数据平台';

// 表单引用
const loginFormRef = ref<FormInstance>();

// 加载状态
const loading = ref(false);

// 登录表单数据
const loginForm = reactive({
  email: '',
  password: '',
  rememberMe: false,
});

// 表单验证规则
const loginRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
};

// 处理登录
const handleLogin = async () => {
  // 检查表单引用是否存在
  if (!loginFormRef.value) {
    ElMessage.error('表单初始化失败，请刷新页面重试');
    return;
  }

  try {
    // 表单验证：根据rules规则验证所有必填字段
    await loginFormRef.value.validate();

    // 验证通过，开始登录
    loading.value = true;

    // 调用登录API
    const response = await loginApi({
      email: loginForm.email,
      password: loginForm.password,
    });

    // 登录成功
    ElMessage.success('登录成功！');

    // 使用auth store保存登录信息
    authStore.login(response.data.access_token, response.data.user);

    // 跳转到首页
    router.push('/');
  } catch (error: any) {
    console.error('登录失败:', error);

    // 检查是否是表单验证错误
    if (error && typeof error === 'object' && !error.response && !error.message) {
      // 这是表单验证错误，不显示错误提示（Element Plus会自动显示）
      return;
    }

    // 只处理API错误
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message);
    } else {
      ElMessage.error('登录失败，请检查邮箱和密码');
    }
  } finally {
    loading.value = false;
  }
};

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register');
};
</script>

<style scoped>
.login-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.login-box {
  position: relative;
  z-index: 10;
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-title {
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
  color: #409eff;
}

.login-subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.login-form {
  margin-top: 30px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.forgot-password {
  font-size: 14px;
}

.login-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}

.register-tip {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

/* 背景装饰 */
.login-background {
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
  .login-box {
    width: 90%;
    padding: 30px 20px;
  }

  .login-title {
    font-size: 24px;
  }
}
</style>
