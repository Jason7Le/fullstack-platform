import httpClient from '@/utils/httpClient';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}'),
    token: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    isRefreshing: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.userInfo.role === 'admin',
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
        const response = await httpClient.post('/auth/refreshToken', {
          refresh_token: this.refreshToken,
        });
        this.setAuthInfo(
          response.data.access_token,
          response.data.refresh_token,
          response.data.user,
        );
        return response.data.access_token;
      } catch (error) {
        console.error('刷新令牌失败', error);
        throw error;
      } finally {
        this.isRefreshing = false;
      }
    },
  },
});
