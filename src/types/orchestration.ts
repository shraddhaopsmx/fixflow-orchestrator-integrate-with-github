
export type OrchestrationInputEvent =
  | { source: 'SAST'; finding: any }
  | { source: 'IaC'; finding: any }
  | { source: 'Pipeline'; finding: any }
  | { source: 'CSPM'; finding: any };

export type OrchestrationLogEntry = {
  timestamp: string;
  step: string;
  details: string;
  samplePayload?: any;
  sampleResponse?: any;
  decisionPoint?: string;
};

export type OrchestrationAgentResult = {
  agent: 'Code' | 'IaC' | 'Pipeline' | 'Cloud';
  proposedFix: string | object;
  confidence: number;
  explanation: string;
  rollback?: string | object;
  approvalRequired: boolean;
  approved: boolean;
  applied: boolean;
  apiSampleRequest?: any;
  apiSampleResponse?: any;
  timeReceived: string;
  timeCompleted: string;
  riskReductionScore: number;
  humanApprovalSimulated?: boolean;
};

export type OrchestrationFinalReport = {
  issuesReceived: number;
  issuesFixedAuto: number;
  issuesFixedWithApproval: number;
  mttrSeconds: number;
  riskReduction: number;
  agentResults: OrchestrationAgentResult[];
  logs: OrchestrationLogEntry[];
};

