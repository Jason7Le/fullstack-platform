import httpClient from '@/utils/httpClient';

/**
 * 用户认证相关API
 * 包含登录、注册、获取用户信息等功能
 */

// 登录接口
export const loginApi = (data: { email: string; password: string; rememberMe: boolean }) => {
  return httpClient.post('/auth/login', data);
};

// 注册接口
export const registerApi = (data: {
  email: string;
  password: string;
  name: string;
  role?: string;
}) => {
  return httpClient.post('/auth/register', data);
};

// 获取用户信息
export const getUserInfoApi = () => {
  return httpClient.get('/users/profile');
};
