
import { PolicyTest } from '@/types/iac';

export const terraformTestCases: PolicyTest[] = [
  {
    name: 'S3 Bucket Public Access Block',
    input: {
      filePath: 'terraform/s3.tf',
      config: `
resource "aws_s3_bucket" "example" {
  bucket = "my-example-bucket"
}

resource "aws_s3_bucket_public_access_block" "example" {
  bucket = aws_s3_bucket.example.id

  block_public_acls       = false
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`,
      issueMetadata: {
        issueId: 'TF-001',
        title: 'S3 Bucket allows public ACLs',
        severity: 'High',
        description: 'S3 bucket is configured to allow public ACLs',
        category: 'terraform',
        ruleId: 'tf-s3-public-read'
      }
    },
    expectedOutput: {
      success: true,
      appliedRules: ['tf-s3-public-read']
    }
  },
  {
    name: 'Security Group Open to Internet',
    input: {
      filePath: 'terraform/security-groups.tf',
      config: `
resource "aws_security_group_rule" "web_ingress" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.web.id
}`,
      issueMetadata: {
        issueId: 'TF-002',
        title: 'Security Group allows access from internet',
        severity: 'Critical',
        description: 'Security group rule allows access from 0.0.0.0/0',
        category: 'terraform',
        ruleId: 'tf-security-group-open'
      }
    },
    expectedOutput: {
      success: true,
      appliedRules: ['tf-security-group-open']
    }
  }
];

export const kubernetesTestCases: PolicyTest[] = [
  {
    name: 'Privileged Container',
    input: {
      filePath: 'k8s/deployment.yaml',
      config: `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  containers:
  - name: nginx
    image: nginx:1.20
    securityContext:
      privileged: true
      runAsUser: 0`,
      issueMetadata: {
        issueId: 'K8S-001',
        title: 'Container running in privileged mode',
        severity: 'Critical',
        description: 'Container has privileged access to host',
        category: 'kubernetes',
        ruleId: 'k8s-privileged-container'
      }
    },
    expectedOutput: {
      success: true,
      appliedRules: ['k8s-privileged-container', 'k8s-run-as-root']
    }
  },
  {
    name: 'Allow Privilege Escalation',
    input: {
      filePath: 'k8s/pod.yaml',
      config: `
apiVersion: v1
kind: Pod
metadata:
  name: security-context-demo
spec:
  containers:
  - name: sec-ctx-demo
    image: busybox
    securityContext:
      allowPrivilegeEscalation: true`,
      issueMetadata: {
        issueId: 'K8S-002',
        title: 'Container allows privilege escalation',
        severity: 'High',
        description: 'Container can escalate privileges',
        category: 'kubernetes',
        ruleId: 'k8s-allow-privilege-escalation'
      }
    },
    expectedOutput: {
      success: true,
      appliedRules: ['k8s-allow-privilege-escalation']
    }
  }
];

export const allTestCases = [...terraformTestCases, ...kubernetesTestCases];
