import httpClient from '@/utils/httpClient';
import websocketService from '@/utils/websocket';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}'),
    token: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    isRefreshing: false,
  }),
  getters: {
    isAuthenticated: state => {
      // 检查token是否存在且不为空
      if (!state.token || state.token.trim() === '') {
        return false;
      }

      // 可以在这里添加token过期时间检查
      // 例如检查JWT token的exp字段
      try {
        const payload = JSON.parse(atob(state.token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          // token已过期，返回false，让调用方处理清理
          return false;
        }
        return true;
      } catch (error) {
        // token格式错误，返回false
        console.error('Token解析失败:', error);
        return false;
      }
    },
    isAdmin: state => state.userInfo.role === 'admin',
  },
  actions: {
    // 设置认证信息（登录时使用）
    setAuthInfo(token: string, refreshToken: string, userInfo: any) {
      this.token = token;
      this.refreshToken = refreshToken;
      this.userInfo = userInfo;
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    },
    // 登录
    login(token: string, userInfo: any) {
      this.setAuthInfo(token, '', userInfo);
    },
    // 登出
    async logout() {
      try {
        // 先断开WebSocket连接
        try {
          websocketService.disconnect();
          console.log('用户退出登录，已断开WebSocket连接');
        } catch (error) {
          console.error('断开WebSocket连接失败:', error);
        }

        await httpClient.post('/auth/logout');
      } catch (error) {
        console.error('登出失败', error);
      } finally {
        // 清除认证信息
        this.clearAuthInfo();
      }
    },
    // 清除认证
    clearAuthInfo() {
      // 先断开WebSocket连接
      try {
        websocketService.disconnect();
        console.log('清除认证信息时断开WebSocket连接');
      } catch (error) {
        console.error('断开WebSocket连接失败:', error);
      }

      this.token = null;
      this.refreshToken = null;
      this.userInfo = null;
      this.isRefreshing = false;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('userInfo');
    },
    // 刷新令牌
    async refreshAccessToken() {
      if (!this.refreshToken) {
        throw new Error('没有刷新令牌');
      }
      // 防止重复刷新
      if (this.isRefreshing) {
        return this.token;
      }

      this.isRefreshing = true;
      try {
        const response = (await httpClient.post('/auth/refreshToken', {
          refresh_token: this.refreshToken,
        })) as {
          access_token: string;
          refresh_token: string;
          user: {
            id: number;
            email: string;
            name: string;
            role: string;
            createdAt: Date;
            updatedAt: Date;
          };
        };
        this.setAuthInfo(response.access_token, response.refresh_token, response.user);
        return response.access_token;
      } catch (error) {
        console.error('刷新令牌失败', error);
        throw error;
      } finally {
        this.isRefreshing = false;
      }
    },
  },
});
