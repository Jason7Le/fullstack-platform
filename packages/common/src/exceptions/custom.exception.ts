import { HttpException } from '@nestjs/common';
import { ErrorCodes } from '../errors/error-codes.enum';

/**
 * HTTP状态码枚举
 * 为了避免依赖问题，在common包中定义常用的HTTP状态码
 */
export enum HttpStatus {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * 自定义异常类
 * 提供统一的错误处理格式，包含错误码、消息和详细信息
 */
export class CustomException extends HttpException {
  constructor(
    public readonly code: ErrorCodes, // 错误码
    message: string, // 错误消息
    status: HttpStatus = HttpStatus.BAD_REQUEST, // HTTP状态码，默认400
    public readonly details?: any, // 错误详细信息
  ) {
    super({ code, message, details }, status);
  }
}
