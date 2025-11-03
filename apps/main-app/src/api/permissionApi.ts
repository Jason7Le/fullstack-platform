import httpClient from '@/utils/httpClient';
// 权限矩阵数据类型
export interface PermissionMatrixData {
  role: string;
  permissions: Record<string, string>;
}

// 获取权限矩阵配置
export const getPermissionMatrixApi = async () => {
  return await httpClient.get('/auth/permission-matrix');
};

// 保存权限矩阵配置
export const savePermissionMatrixApi = async (matrixData: PermissionMatrixData[]) => {
  return await httpClient.post('/auth/permission-matrix', { matrixData });
};

// 获取角色列表
export const getRolesApi = async () => {
  return await httpClient.get('/auth/roles');
};

// 获取资源列表
export const getResourcesApi = async () => {
  return await httpClient.get('/auth/resources');
};
