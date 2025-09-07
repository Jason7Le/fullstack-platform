import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}'),
    token: localStorage.getItem('access_token'),
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.userInfo.role === 'admin',
  },
  actions: {
    login(token: string, userInfo: any) {
      this.token = token;
      this.userInfo = userInfo;
      localStorage.setItem('access_token', token);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    },
    logout() {
      this.token = null;
      this.userInfo = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('userInfo');
    },
  },
});
