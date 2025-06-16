
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
  status: 'open' | 'approved' | 'mitigated';
  description: string;
  timestamp: string;
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
