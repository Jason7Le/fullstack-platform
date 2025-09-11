import httpClient from '@/utils/httpClient';

/**
 * 用户认证相关API
 * 包含登录、注册、获取用户信息等功能
 */

// 登录接口
export const loginApi = (data: { email: string; password: string; rememberMe: boolean }) => {
  return httpClient.post('/auth/login', data) as Promise<{
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
  }>;
};

// 注册接口
export const registerApi = (data: {
  email: string;
  password: string;
  name: string;
  role?: string;
}) => {
  return httpClient.post('/auth/register', data) as Promise<{
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
  }>;
};

// 获取用户信息
export const getUserInfoApi = () => {
  return httpClient.get('/users/profile');
};
