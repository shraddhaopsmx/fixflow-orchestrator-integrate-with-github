
import { RuntimeAlert } from '@/types/runtime';

export const runtimeAlerts: RuntimeAlert[] = [
  {
    id: 'unauthorized-shell',
    description: 'Unauthorized shell access detected in container "prod-api-123"',
    suggestedAction: 'ISOLATE_CONTAINER',
    defaultConfidence: 95,
  },
  {
    id: 'suspicious-outbound',
    description: 'Suspicious outbound connection from pod "billing-service-abc" to unknown IP',
    suggestedAction: 'ISOLATE_CONTAINER',
    defaultConfidence: 85,
  },
  {
    id: 'brute-force-login',
    description: 'Multiple failed login attempts for user "admin"',
    suggestedAction: 'DISABLE_USER',
    defaultConfidence: 98,
  },
  {
    id: 'high-cpu-crypto',
    description: 'Anomalous high CPU usage consistent with crypto mining in process "kworker/u16:0"',
    suggestedAction: 'TERMINATE_PROCESS',
    defaultConfidence: 75,
  },
  {
    id: 'potential-data-exfiltration',
    description: 'Potential data exfiltration pattern detected from "db-primary" replica',
    suggestedAction: 'ISOLATE_CONTAINER',
    defaultConfidence: 60,
  }
];
