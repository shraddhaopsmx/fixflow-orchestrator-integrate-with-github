
import { CloudRemediationRule, CSPMFinding, RemediationPlan } from '@/types/cloud';

const s3PublicReadRule: CloudRemediationRule = {
  issueType: 'S3_BUCKET',
  appliesTo: (finding) => finding.description.toLowerCase().includes('public read'),
  generatePlan: (finding: CSPMFinding): RemediationPlan => {
    const awsCliFix = `aws s3api put-public-access-block --bucket ${finding.resourceId} --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"`;
    
    return {
      success: true,
      explanation: `The S3 bucket '${finding.resourceId}' allows public read access. The remediation applies a Public Access Block to prevent unintended public exposure.`,
      remediation: {
        type: 'AWS_CLI',
        code: awsCliFix,
        description: 'Apply S3 Public Access Block using AWS CLI.'
      },
      rollback: {
        type: 'AWS_CLI',
        code: `aws s3api delete-public-access-block --bucket ${finding.resourceId}`,
        description: 'Removes the S3 Public Access Block. WARNING: This may expose the bucket publicly again.'
      }
    };
  }
};

const ec2OpenSshRule: CloudRemediationRule = {
  issueType: 'EC2_SECURITY_GROUP',
  appliesTo: (finding) => finding.issueDetails.port === 22 && finding.issueDetails.source === '0.0.0.0/0',
  generatePlan: (finding: CSPMFinding): RemediationPlan => {
    const awsCliFix = `aws ec2 revoke-security-group-ingress --group-id ${finding.resourceId} --protocol tcp --port 22 --cidr 0.0.0.0/0`;
    
    return {
      success: true,
      explanation: `The Security Group '${finding.resourceId}' has SSH port (22) open to the internet (0.0.0.0/0). This is a high-risk exposure. The remediation removes this rule.`,
      remediation: {
        type: 'AWS_CLI',
        code: awsCliFix,
        description: 'Revoke the insecure rule using AWS CLI. You may need to add a new, more restrictive rule for legitimate access.'
      },
      rollback: {
        type: 'AWS_CLI',
        code: `aws ec2 authorize-security-group-ingress --group-id ${finding.resourceId} --protocol tcp --port 22 --cidr 0.0.0.0/0`,
        description: 'Re-authorizes SSH access from the internet. WARNING: This will re-introduce the security risk.'
      }
    };
  }
};

const iamAdminAccessRule: CloudRemediationRule = {
    issueType: 'IAM_USER_POLICY',
    appliesTo: (finding) => finding.issueDetails.policy?.Statement[0]?.Effect === 'Allow' && finding.issueDetails.policy.Statement[0].Action === '*' && finding.issueDetails.policy.Statement[0].Resource === '*',
    generatePlan: (finding: CSPMFinding): RemediationPlan => {
        const policyArn = finding.issueDetails.policyArn;
        const terraformFix = `
resource "aws_iam_policy" "restricted_policy" {
    name        = "RestrictedPolicyFor-${finding.resourceId}"
    description = "A more restricted policy."
    policy      = jsonencode({
        Version   = "2012-10-17"
        Statement = [
            {
                Action   = ["s3:GetObject", "ec2:Describe*"]
                Effect   = "Allow"
                Resource = "*"
            },
        ]
    })
}

resource "aws_iam_user_policy_attachment" "attachment" {
    user       = "${finding.resourceId}"
    policy_arn = aws_iam_policy.restricted_policy.arn
}
`;
        return {
            success: true,
            explanation: `The IAM user '${finding.resourceId}' has a policy with full administrative privileges ('*:*'). The principle of least privilege is violated. The proposed fix replaces this with a restrictive, example policy using Terraform.`,
            remediation: {
                type: 'TERRAFORM',
                code: terraformFix,
                description: 'Apply a new, more restrictive IAM policy and attach it to the user. The overly permissive policy should be detached separately.'
            },
            rollback: {
                type: 'TERRAFORM',
                code: `resource "aws_iam_user_policy_attachment" "rollback_attachment" {\n  user       = "${finding.resourceId}"\n  policy_arn = "${policyArn}"\n}`,
                description: 'Re-attach the original administrative policy. WARNING: This restores excessive permissions.'
            }
        };
    }
};

export const allCloudRules: CloudRemediationRule[] = [s3PublicReadRule, ec2OpenSshRule, iamAdminAccessRule];

