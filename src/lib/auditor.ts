
type AuditEvent = {
  timestamp: string;
  jobId: string;
  action: string;
  details: any;
};

const events: AuditEvent[] = [];

export function logEvent(event: Omit<AuditEvent, "timestamp">) {
  events.push({
    ...event,
    timestamp: new Date().toISOString(),
  });
}

export function getAuditLog(jobId?: string): AuditEvent[] {
  return jobId ? events.filter(e => e.jobId === jobId) : [...events];
}
