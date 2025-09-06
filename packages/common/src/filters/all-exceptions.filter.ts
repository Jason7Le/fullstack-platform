import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCodes } from '../errors/error-codes.enum';
import { ErrorResponse } from '../interfaces/error-response.interface';

/**
 * 全局异常过滤器
 * 捕获所有未处理的异常，提供统一的错误响应格式
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  /**
   * 处理异常
   * @param exception 异常对象
   * @param host 请求上下文
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = ErrorCodes.SYSTEM_ERROR;

    if (exception instanceof Error) {
      message = exception.message;

      // 根据不同的错误类型设置不同的状态码和错误码
      if (exception instanceof TypeError) {
        status = HttpStatus.BAD_REQUEST;
        code = ErrorCodes.VALIDATION_ERROR;
      } else if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        code = ErrorCodes.VALIDATION_ERROR;
      } else if (exception.name === 'CastError') {
        status = HttpStatus.BAD_REQUEST;
        code = ErrorCodes.VALIDATION_ERROR;
      }
    }

    // 原有的错误响应格式（保留作为注释）
    // response.status(status).json({
    //   success: false,
    //   statusCode: status,
    //   timestamp: new Date().toISOString(),
    //   path: request.url,
    //   message: message,
    //   error: 'Internal Server Error',
    // });

    // 使用新的统一错误响应格式
    const errorResponse: ErrorResponse = {
      success: false,
      code: code,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
