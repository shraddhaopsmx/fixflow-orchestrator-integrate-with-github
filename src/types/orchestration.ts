
import { CodeFinding, CodeRemediation } from './code';
import { CSPMFinding, RemediationPlan } from './cloud';
import { IaCInput, IaCRemediationResult } from './iac';
import { PipelineInput, PipelineRemediationResult } from './pipeline';

export type OrchestrationIssueType = 'sast' | 'sca' | 'iac' | 'pipeline' | 'cspm';

export interface OrchestrationIssue {
  id: string;
  type: OrchestrationIssueType;
  description: string;
  source: string;
  payload: CodeFinding | IaCInput | PipelineInput | CSPMFinding;
  policy: {
    requiresApproval: boolean;
  };
}

export interface LifecycleLogEntry {
  timestamp: string;
  issueId: string;
  step: 'Received' | 'Routed' | 'Agent Executed' | 'Pending Approval' | 'Approved' | 'Fix Applied' | 'Completed' | 'Failed';
  message: string;
  details?: any;
}

export interface FinalReport {
  totalIssues: number;
  remediatedAutomatically: number;
  remediatedWithApproval: number;
  failed: number;
  averageTimeToRemediateMs: number;
  riskReductionScore: number; // Simulated
}
