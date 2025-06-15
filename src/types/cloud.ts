
export type CloudProvider = 'AWS';
export type ResourceType = 'S3_BUCKET' | 'EC2_SECURITY_GROUP' | 'IAM_USER_POLICY';
export type RemediationType = 'TERRAFORM' | 'AWS_CLI';

export interface CSPMFinding {
  findingId: string;
  provider: CloudProvider;
  resourceType: ResourceType;
  resourceId: string;
  region: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  issueDetails: Record<string, any>;
}

export interface RemediationPlan {
  success: boolean;
  explanation: string;
  remediation: {
    type: RemediationType;
    code: string;
    description: string;
  };
  rollback?: {
    type: RemediationType;
    code: string;
    description: string;
  };
  error?: string;
}

export interface CloudRemediationRule {
  issueType: ResourceType;
  appliesTo: (finding: CSPMFinding) => boolean;
  generatePlan: (finding: CSPMFinding) => RemediationPlan;
}
