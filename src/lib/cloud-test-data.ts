
import { CSPMFinding } from '@/types/cloud';

export const cloudTestCases: CSPMFinding[] = [
  {
    findingId: 'CSPM-AWS-001',
    provider: 'AWS',
    resourceType: 'S3_BUCKET',
    resourceId: 'my-sensitive-data-bucket',
    region: 'us-east-1',
    description: 'S3 Bucket has public read access.',
    severity: 'Critical',
    issueDetails: {
      grantee: 'AllUsers'
    }
  },
  {
    findingId: 'CSPM-AWS-002',
    provider: 'AWS',
    resourceType: 'EC2_SECURITY_GROUP',
    resourceId: 'sg-0123456789abcdef0',
    region: 'us-west-2',
    description: 'Security Group has port 22 open to 0.0.0.0/0.',
    severity: 'Critical',
    issueDetails: {
      protocol: 'tcp',
      port: 22,
      source: '0.0.0.0/0'
    }
  },
  {
    findingId: 'CSPM-AWS-003',
    provider: 'AWS',
    resourceType: 'IAM_USER_POLICY',
    resourceId: 'dev-user-bob',
    region: 'global',
    description: 'IAM user has administrative privileges.',
    severity: 'High',
    issueDetails: {
      policyName: 'AdministratorAccess',
      policyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
      policy: {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": "*",
                "Resource": "*"
            }
        ]
      }
    }
  }
];
