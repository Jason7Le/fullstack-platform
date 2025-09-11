import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { routes } from './routes';

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫：检查认证状态
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 需要认证但未登录，跳转到登录页
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    // 已登录用户访问登录/注册页，跳转到Dashboard
    // 但需要检查token是否有效，避免无效token导致的循环
    const token = authStore.token;
    if (token && token.trim() !== '') {
      next('/dashboard');
    } else {
      // token为空，清理认证信息并停留在登录页
      authStore.clearAuthInfo();
      next();
    }
  } else {
    next();
  }
});

export default router;
