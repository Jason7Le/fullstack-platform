import { MonitoringService } from '../services/monitoring.service';

export function MonitorMethod(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const serviceName = target.constructor.name;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await method.apply(this, args);
        const duration = (Date.now() - startTime) / 1000;

        // 记录成功操作 - 通过依赖注入获取服务
        const monitoringService = (this as any).monitoringService as MonitoringService;
        if (monitoringService) {
          monitoringService.recordBusinessOperation(operation, serviceName);
        }

        return result;
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000;

        // 记录错误 - 通过依赖注入获取服务
        const errorMonitoringService = (this as any).errorMonitoringService;
        if (errorMonitoringService) {
          errorMonitoringService.recordError(error, serviceName);
        }

        throw error;
      }
    };
  };
}
