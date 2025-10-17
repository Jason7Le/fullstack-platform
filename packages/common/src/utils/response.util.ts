/**
 * 响应工具类
 * 提供统一的API响应格式
 */
export class ResponseUtil {
  /**
   * 成功响应
   * @param data 响应数据
   * @param message 成功消息，默认为'Success'
   * @returns 成功响应对象
   */
  static success<T>(data: T, message = 'Success') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 错误响应
   * @param message 错误消息
   * @param error 错误对象或错误信息
   * @param statusCode HTTP状态码，默认为500
   * @returns 错误响应对象
   */
  static error(message: string, error?: any, statusCode?: number) {
    return {
      success: false,
      message,
      error: error?.message || error,
      statusCode: statusCode || 500,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 分页响应
   * @param data 分页数据
   * @param total 总记录数
   * @param page 当前页码
   * @param limit 每页记录数
   * @returns 分页响应对象
   */
  static paginate<T>(data: T[], total: number, page: number, limit: number) {
    return {
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
