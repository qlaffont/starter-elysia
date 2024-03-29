import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { NodeSDK } from '@opentelemetry/sdk-node';

const sdk = new NodeSDK({
  traceExporter: new ZipkinExporter({}),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
