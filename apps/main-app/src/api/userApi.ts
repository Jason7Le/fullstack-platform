import httpClient from '@/utils/httpClient';

/**
 * 用户管理相关API
 * 包含用户CRUD操作、列表查询等功能
 */

// 获取用户列表
export const getUserListApi = () => {
  return httpClient.get('/users/list');
};

// 创建用户
export const createUserApi = (data: {
  email: string;
  password: string;
  name: string;
  role?: string;
}) => {
  return httpClient.post('/users/create', data);
};

// 更新用户信息
export const updateUserApi = (id: number, data: { name: string; role: string }) => {
  return httpClient.patch(`/users/update${id}`, data);
};

// 删除用户
export const deleteUserApi = (id: number) => {
  return httpClient.delete(`/users/remove/${id}`);
};
