
export type IssueType = 'SAST' | 'SCA' | 'CSPM' | 'PIPELINE' | 'RUNTIME';

export interface IssueMetadata {
  id: string;
  type: IssueType;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  location: {
    filePath?: string;
    repository?: string;
    branch?: string;
    resourceId?: string;
    region?: string;
  };
  description: string;
  riskScore?: number;
  codeSnippet?: string;
  language?: string;
  fileOwner?: string;
}

export interface ContextGraphData {
  application: {
    name: string;
    structure: string;
  };
  ownership: {
    team: string;
    owner: string;
  };
  iacReferences: string[];
  cicdConfigs: string[];
  git: {
    repoUrl: string;
    commitHistory: string[];
  };
}

export interface LLMResponse {
  proposedFix: string;
  confidence: number;
  rationale: string;
}

export interface MCPPayload {
  type: 'gitops/apply-patch' | 'iac/commit-patch' | 'pipeline/update-config' | 'cloud/apply-remediation' | 'runtime/isolate';
  payload: Record<string, any>;
}

export interface MCPResponse {
  jobId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  details: string;
}

export interface AuditLogEntry {
  timestamp: string;
  actor: string;
  action: string;
  details: any;
}

export interface RemediationMetrics {
  timeToFix: number; // in milliseconds
  successRate: number;
  llmAccuracy: number;
  workflowStartTime: number;
  workflowEndTime: number;
}

export interface AutoFixResult {
  workflowId: string;
  issueId: string;
  status: 'COMPLETED_AUTOMATIC' | 'AWAITING_APPROVAL' | 'FAILED';
  decision: string;
  context?: ContextGraphData;
  llmResponse?: LLMResponse;
  mcpResponse?: MCPResponse;
  approvalPayload?: any;
  auditLog: AuditLogEntry[];
  error?: string;
  metrics?: RemediationMetrics;
}
