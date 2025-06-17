export interface OpsMxIssue {
  issueId: string;
  type: 'SAST' | 'SCA' | 'IaC' | 'CSPM' | 'PIPELINE' | 'RUNTIME';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  riskScore: number;
  sourceLocation: {
    repository?: string;
    filePath?: string;
    branch?: string;
    resourceId?: string;
    region?: string;
  };
  status: 'open' | 'assigned' | 'in_progress' | 'waiting_for_approval' | 'approved' | 'rejected' | 'resolved' | 'mitigated';
  assignedTo?: string;
  assignedAt?: string;
  description: string;
  timestamp: string;
  approvalData?: ApprovalData;
}

export interface ApprovalData {
  approverId?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  approvalComment?: string;
}

export interface ApprovalRequest {
  issueId: string;
  approverId: string;
  comment?: string;
}

export interface RejectionRequest {
  issueId: string;
  approverId: string;
  reason: string;
}

export interface OpsMxApiResponse {
  issues: OpsMxIssue[];
  totalCount: number;
  lastUpdated: string;
}

export interface OrchestratorConfig {
  apiEndpoint: string;
  pollInterval: number;
  backoffInterval: number;
  maxRetries: number;
}

export interface IssueAssignment {
  issueId: string;
  assigneeId: string;
  assignedAt: string;
  assignedBy: string;
}

export interface AssignmentRequest {
  issueId: string;
  assigneeId: string;
  assignedBy?: string;
}

export interface AuditLogEntry {
  timestamp: string;
  issueId: string;
  action: 'created' | 'assigned' | 'status_changed' | 'resolved';
  actor: string;
  fromStatus?: string;
  toStatus?: string;
  details: any;
}
