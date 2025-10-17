import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  jaegerEndpoint?: string;
  prometheusPort?: number;
  environment?: string;
}

export function createTelemetrySDK(config: TelemetryConfig): NodeSDK {
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment || 'development',
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter: config.jaegerEndpoint
      ? new JaegerExporter({ endpoint: config.jaegerEndpoint })
      : undefined,
    metricReader: config.prometheusPort
      ? new PrometheusExporter({ port: config.prometheusPort })
      : undefined,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  return sdk;
}
