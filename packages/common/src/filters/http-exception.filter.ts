import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomException } from '../exceptions/custom.exception';
import { ErrorResponse } from '../interfaces/error-response.interface';

/**
 * HTTP异常过滤器
 * 处理NestJS的HttpException，提供统一的错误响应格式
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * 处理HTTP异常
   * @param exception HTTP异常对象
   * @param host 请求上下文
   */
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 如果是自定义异常，使用统一的错误响应格式
    if (exception instanceof CustomException) {
      const customException = exception as CustomException;
      const errorResponse: ErrorResponse = {
        success: false,
        code: customException.code,
        message: customException.message,
        details: customException.details,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
      response.status(status).json(errorResponse);
      return;
    }

    // 原有的错误响应格式（保留作为注释）
    // const errorResponse: any = {
    //   success: false,
    //   statusCode: status,
    //   timestamp: new Date().toISOString(),
    //   path: request.url,
    //   message:
    //     typeof exceptionResponse === 'string'
    //       ? exceptionResponse
    //       : (exceptionResponse as any).message,
    //   error:
    //     typeof exceptionResponse === 'object' ? (exceptionResponse as any).error : exception.name,
    // };

    // 如果是验证错误，添加详细的错误信息
    // if (
    //   status === 400 &&
    //   typeof exceptionResponse === 'object' &&
    //   (exceptionResponse as any).message
    // ) {
    //   errorResponse.details = (exceptionResponse as any).message;
    // }

    // 使用新的统一错误响应格式
    const errorResponse: ErrorResponse = {
      success: false,
      code: exception.name || 'HTTP_EXCEPTION',
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message,
      details:
        status === 400 && typeof exceptionResponse === 'object'
          ? (exceptionResponse as any).message
          : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
