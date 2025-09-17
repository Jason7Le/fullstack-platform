import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorMonitoringService } from '../services/error-monitoring.service';

@Injectable()
export class ErrorTrackingInterceptor implements NestInterceptor {
  constructor(private readonly errorMonitoringService: ErrorMonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const serviceName = request.route?.path?.split('/')[1] || 'unknown';

    return next.handle().pipe(
      catchError((error) => {
        // 根据错误类型进行分类
        if (error.name === 'ValidationError') {
          this.errorMonitoringService.recordValidationError(error, serviceName);
        } else if (error.name === 'UnauthorizedException') {
          this.errorMonitoringService.recordAuthenticationError(error, serviceName);
        } else if (error.name === 'ForbiddenException') {
          this.errorMonitoringService.recordAuthorizationError(error, serviceName);
        } else if (error.name === 'HttpException') {
          this.errorMonitoringService.recordNetworkError(error, serviceName);
        } else {
          this.errorMonitoringService.recordError(error, serviceName);
        }

        return throwError(() => error);
      }),
    );
  }
}
