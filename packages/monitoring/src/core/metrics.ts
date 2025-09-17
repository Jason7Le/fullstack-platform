import { Counter, Gauge, Histogram, register } from 'prom-client';

export class MetricsRegistry {
  // HTTP 指标
  public readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  public readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  });

  // 业务指标
  public readonly businessOperationsTotal = new Counter({
    name: 'business_operations_total',
    help: 'Total number of business operations',
    labelNames: ['operation', 'service'],
  });

  // 用户相关指标
  public readonly userRegistrationsTotal = new Counter({
    name: 'user_registrations_total',
    help: 'Total number of user registrations',
    labelNames: ['service'],
  });

  public readonly userLoginsTotal = new Counter({
    name: 'user_logins_total',
    help: 'Total number of user logins',
    labelNames: ['service'],
  });

  public readonly activeUsersCurrent = new Gauge({
    name: 'active_users_current',
    help: 'Current number of active users',
    labelNames: ['service'],
  });

  // 数据库指标
  public readonly databaseQueryDuration = new Histogram({
    name: 'database_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'table', 'service'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  });

  public readonly databaseConnectionsActive = new Gauge({
    name: 'database_connections_active',
    help: 'Number of active database connections',
    labelNames: ['service'],
  });

  // 系统指标
  public readonly memoryUsage = new Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['service'],
  });

  public readonly cpuUsage = new Gauge({
    name: 'cpu_usage_percent',
    help: 'CPU usage percentage',
    labelNames: ['service'],
  });

  // 错误指标
  public readonly applicationErrorsTotal = new Counter({
    name: 'application_errors_total',
    help: 'Total number of application errors',
    labelNames: ['error_type', 'service', 'severity'],
  });

  public readonly databaseErrorsTotal = new Counter({
    name: 'database_errors_total',
    help: 'Total number of database errors',
    labelNames: ['operation', 'service', 'error_type'],
  });

  constructor() {
    // 注册所有指标
    register.registerMetric(this.httpRequestsTotal);
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.businessOperationsTotal);
    register.registerMetric(this.userRegistrationsTotal);
    register.registerMetric(this.userLoginsTotal);
    register.registerMetric(this.activeUsersCurrent);
    register.registerMetric(this.databaseQueryDuration);
    register.registerMetric(this.databaseConnectionsActive);
    register.registerMetric(this.memoryUsage);
    register.registerMetric(this.cpuUsage);
    register.registerMetric(this.applicationErrorsTotal);
    register.registerMetric(this.databaseErrorsTotal);
  }
}

export const metricsRegistry = new MetricsRegistry();
