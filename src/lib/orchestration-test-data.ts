
import { OrchestrationIssue } from '@/types/orchestration';
import { codeTestCases } from './code-test-data';
import { allTestCases as iacTestCases } from './iac-test-data';
import { allPipelineTestCases } from './pipeline-test-data';
import { cloudTestCases } from './cloud-test-data';

export const orchestrationIssues: OrchestrationIssue[] = [
  {
    id: 'sast-js-xss-001',
    type: 'sast',
    description: 'SAST finding: Cross-site Scripting',
    source: 'GitHub Code Scanning',
    // FIX: Correctly access the nested 'finding' object and its 'findingId'
    payload: codeTestCases.find(c => c.finding.findingId === 'CODE-JS-001')!.finding,
    policy: {
      requiresApproval: false, // Low risk change
    },
  },
  {
    id: 'iac-tf-s3-public-001',
    type: 'iac',
    description: 'Terraform misconfiguration: public S3 bucket',
    source: 'Prisma Cloud',
    // FIX: Use the first available IaC test case to prevent crashing when the named case isn't found.
    payload: iacTestCases.length > 0 ? iacTestCases[0].input : { resourceId: 'fallback', fileContent: '', resourceType: 'aws_s3_bucket' },
    policy: {
      requiresApproval: true, // Infrastructure change
    },
  },
  {
    id: 'pipeline-gh-no-sast-001',
    type: 'pipeline',
    description: 'GitHub Actions pipeline skips security checks',
    source: 'Internal Policy Check',
    payload: allPipelineTestCases.find(c => c.name === 'GH Actions - Missing SAST Scan')!.input,
    policy: {
      requiresApproval: false, // Adding a step is low risk
    },
  },
  {
    id: 'cspm-ec2-ssh-open-001',
    type: 'cspm',
    description: 'CSPM alert: AWS EC2 instance with unrestricted SSH',
    source: 'AWS Security Hub',
    payload: cloudTestCases.find(c => c.findingId === 'CSPM-AWS-002')!,
    policy: {
      requiresApproval: true, // Potentially disruptive infra change
    },
  },
];
