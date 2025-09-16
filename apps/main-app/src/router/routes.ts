import ChatRoomView from '@/views/ChatRoomView.vue';
import DashboardView from '@/views/DashboardView.vue';
import LoginView from '@/views/LoginView.vue';
import PermissionMatrixView from '@/views/PermissionMatrixView.vue';
import RegisterView from '@/views/RegisterView.vue';
import UserManagementView from '@/views/UserManagementView.vue';
import WebSocketDemo from '@/views/WebSocketDemo.vue';
import type { RouteRecordRaw } from 'vue-router';

// 路由配置
export const routes: RouteRecordRaw[] = [
  {
    path: '/dashboard-remote',
    name: 'DashboardRemote',
    component: () => import('dashboard-app/RemotePage'),
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
];
