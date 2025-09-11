import httpClient from '@/utils/httpClient';

// 房间信息接口
export interface RoomInfo {
  id: string;
  name: string;
  ownerId: number;
  ownerEmail: string;
  createdAt: string;
  memberCount: number;
  isPrivate: boolean;
  description?: string;
  members?: Array<{
    userId: number;
    userEmail: string;
    joinedAt: string;
  }>; // 房间成员列表，用于权限检查
}

// 创建房间请求接口
export interface CreateRoomRequest {
  name: string;
  description?: string;
  isPrivate?: boolean;
}

// 创建房间响应接口
export interface CreateRoomResponse {
  id: string;
  name: string;
  ownerId: number;
  ownerEmail: string;
  createdAt: string;
  members: Array<{
    userId: number;
    userEmail: string;
    joinedAt: string;
  }>;
  isPrivate: boolean;
  description?: string;
}

/**
 * 房间管理API
 */
export const roomApi = {
  /**
   * 创建房间
   */
  createRoom: (data: CreateRoomRequest): Promise<CreateRoomResponse> => {
    return httpClient.post('/api/rooms/createRoom', data);
  },

  /**
   * 获取房间列表
   */
  getRoomList: (): Promise<RoomInfo[]> => {
    return httpClient.get('/api/rooms/getRoomList');
  },

  /**
   * 获取房间详情
   */
  getRoomById: (id: string): Promise<RoomInfo> => {
    return httpClient.get(`/api/rooms/getRoomInfo/${id}`);
  },

  /**
   * 删除房间
   */
  deleteRoom: (id: string): Promise<void> => {
    return httpClient.delete(`/api/rooms/deleteRoom/${id}`);
  },
};
