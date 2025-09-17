import { Injectable } from '@nestjs/common';
import { metricsRegistry } from '../core/metrics';

@Injectable()
export class MonitoringService {
  // HTTP 请求监控
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    metricsRegistry.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });
    metricsRegistry.httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode.toString(),
      },
      duration,
    );
  }

  // 业务操作监控
  recordBusinessOperation(operation: string, service: string) {
    metricsRegistry.businessOperationsTotal.inc({ operation, service });
  }

  // 用户相关指标
  recordUserRegistration(service: string) {
    metricsRegistry.userRegistrationsTotal.inc({ service });
  }

  recordUserLogin(service: string) {
    metricsRegistry.userLoginsTotal.inc({ service });
  }

  setActiveUsers(service: string, count: number) {
    metricsRegistry.activeUsersCurrent.set({ service }, count);
  }

  // 数据库指标
  recordDatabaseQuery(operation: string, table: string, service: string, duration: number) {
    metricsRegistry.databaseQueryDuration.observe({ operation, table, service }, duration);
  }

  setDatabaseConnections(service: string, count: number) {
    metricsRegistry.databaseConnectionsActive.set({ service }, count);
  }

  // 系统资源监控
  recordMemoryUsage(service: string, usage: number) {
    metricsRegistry.memoryUsage.set({ service }, usage);
  }

  recordCpuUsage(service: string, usage: number) {
    metricsRegistry.cpuUsage.set({ service }, usage);
  }

  // 获取所有指标
  async getMetrics(): Promise<string> {
    const register = require('prom-client').register;
    return register.metrics();
  }
}
