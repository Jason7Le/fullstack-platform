import { microFrontendMonitor } from '@/utils/microFrontendMonitor';
import ChatRoomView from '@/views/ChatRoomView.vue';
import DashboardView from '@/views/DashboardView.vue';
import LoginView from '@/views/LoginView.vue';
import MonitoringView from '@/views/MonitoringView.vue';
import PermissionMatrixView from '@/views/PermissionMatrixView.vue';
import RegisterView from '@/views/RegisterView.vue';
import SettingsView from '@/views/SettingsView.vue';
import UserManagementView from '@/views/UserManagementView.vue';
import WebSocketDemo from '@/views/WebSocketDemo.vue';
import type { RouteRecordRaw } from 'vue-router';

// 路由配置
export const routes: RouteRecordRaw[] = [
  {
    path: '/dashboard-app',
    name: 'DashboardRemote',
    component: () => {
      const startTime = performance.now();
      return import('dashboard-app/RemotePage')
        .then(module => {
          const endTime = performance.now();
          microFrontendMonitor.recordLoadTime('DashboardRemote', endTime - startTime);
          return module;
        })
        .catch(error => {
          microFrontendMonitor.recordError('DashboardRemote', error);
          throw error;
        });
    },
    meta: {
      title: 'Dashboard Remote',
    },
  },
  {
    path: '/',
    name: 'Home',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/user-management',
    name: 'UserManagement',
    component: UserManagementView,
    meta: { requiresAuth: true },
  },
  {
    path: '/permission-matrix',
    name: 'PermissionMatrix',
    component: PermissionMatrixView,
    meta: { requiresAuth: true },
  },
  {
    path: '/websocket-demo',
    name: 'WebSocketDemo',
    component: WebSocketDemo,
    meta: { requiresAuth: true },
  },
  {
    path: '/chat-room',
    name: 'ChatRoom',
    component: ChatRoomView,
    meta: { requiresAuth: true },
  },
  {
    path: '/monitoring',
    name: 'Monitoring',
    component: MonitoringView,
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    meta: { requiresAuth: true },
  },
];
