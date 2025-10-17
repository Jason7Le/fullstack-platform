import { Histogram } from 'prom-client';

export function TrackPerformance(metricName: string, labels?: Record<string, string>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const histogram = new Histogram({
      name: metricName,
      help: `Performance metric for ${metricName}`,
      labelNames: Object.keys(labels || {}),
    });

    descriptor.value = async function (...args: any[]) {
      const timer = histogram.startTimer(labels);

      try {
        const result = await method.apply(this, args);
        timer({ success: 'true' });
        return result;
      } catch (error) {
        timer({ success: 'false' });
        throw error;
      }
    };
  };
}
