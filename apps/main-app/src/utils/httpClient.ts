import axios from 'axios';

/**
 * HTTP客户端配置
 * 提供统一的axios实例，包含请求/响应拦截器
 */
const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

// 请求拦截器：自动添加 token
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一处理响应数据
httpClient.interceptors.response.use(
  (response) => response.data, // 返回响应数据而不是完整响应对象
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default httpClient as any;
