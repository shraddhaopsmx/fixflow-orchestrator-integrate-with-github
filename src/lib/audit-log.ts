
import { OrchestrationEvent } from "@/types/orchestration-job";

const auditLog: OrchestrationEvent[] = [];

export function logEvent(event: OrchestrationEvent) {
  auditLog.push(event);
  // In real application, persist to DB or external log
  console.log(`[AUDIT]`, event);
}

export function getAuditLog(jobId?: string): OrchestrationEvent[] {
  if (jobId) return auditLog.filter(e => e.jobId === jobId);
  return auditLog;
}
