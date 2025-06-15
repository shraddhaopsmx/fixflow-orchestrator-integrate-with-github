
export type SecurityIssue = {
  id: string;
  source: "SAST" | "IaC" | "Pipeline" | "CSPM";
  type: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  context: Record<string, any>;
};

export type ContextGraphMetadata = {
  application?: Record<string, any>;
  iac?: Record<string, any>;
  ciCd?: Record<string, any>;
};

export type Domain = "code" | "iac" | "pipeline" | "cloud";

export type RemediationJobStatus = "queued" | "proposed" | "awaiting_approval" | "approved" | "executed" | "failed";

export interface RemediationJob {
  jobId: string;
  issue: SecurityIssue;
  enrichedContext: ContextGraphMetadata;
  domain: Domain;
  routeTarget: string;
  status: RemediationJobStatus;
  approvalRequired: boolean;
  approved: boolean;
  events: OrchestrationEvent[];
}

export interface OrchestrationEvent {
  timestamp: string;
  jobId: string;
  action: string;
  details: string;
  data?: any;
}
