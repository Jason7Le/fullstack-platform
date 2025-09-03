import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 构建统一的错误响应格式
    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message,
      error: typeof exceptionResponse === 'object' 
        ? (exceptionResponse as any).error 
        : exception.name,
    };

    // 如果是验证错误，添加详细的错误信息
    if (status === 400 && typeof exceptionResponse === 'object' && (exceptionResponse as any).message) {
      errorResponse['details'] = (exceptionResponse as any).message;
    }

    response.status(status).json(errorResponse);
  }
}