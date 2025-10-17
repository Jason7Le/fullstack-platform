import { Injectable, Logger } from '@nestjs/common';
import { metricsRegistry } from '../core/metrics';

@Injectable()
export class ErrorMonitoringService {
  private readonly logger = new Logger(ErrorMonitoringService.name);

  recordError(error: Error, service: string, severity: 'low' | 'medium' | 'high' = 'medium') {
    const errorType = error.constructor.name;

    metricsRegistry.applicationErrorsTotal.inc({
      error_type: errorType,
      service,
      severity,
    });

    this.logger.error(`Error recorded: ${errorType}`, {
      message: error.message,
      stack: error.stack,
      service,
      severity,
    });
  }

  recordDatabaseError(error: Error, operation: string, service: string) {
    const errorType = error.constructor.name;

    metricsRegistry.databaseErrorsTotal.inc({
      operation,
      service,
      error_type: errorType,
    });

    this.logger.error(`Database error in ${operation}`, {
      error: error.message,
      operation,
      service,
    });
  }

  recordValidationError(error: Error, service: string) {
    this.recordError(error, service, 'low');
  }

  recordAuthenticationError(error: Error, service: string) {
    this.recordError(error, service, 'high');
  }

  recordAuthorizationError(error: Error, service: string) {
    this.recordError(error, service, 'high');
  }

  recordNetworkError(error: Error, service: string) {
    this.recordError(error, service, 'medium');
  }
}
