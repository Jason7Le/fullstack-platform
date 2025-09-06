/**
 * 错误响应接口
 * 统一的错误响应格式
 */
export interface ErrorResponse {
  success: false; // 固定为false
  code: string; // 错误码
  message: string; // 错误消息
  details?: any; // 错误详细信息（可选）
  timestamp: string; // 时间戳
  path?: string; // 请求路径（可选）
}

/**
 * 成功响应接口
 * 统一的成功响应格式
 */
export interface SuccessResponse<T> {
  success: true; // 固定为true
  data: T; // 响应数据
  timestamp: string; // 时间戳
}
