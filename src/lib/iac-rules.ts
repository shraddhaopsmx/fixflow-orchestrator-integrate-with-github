
import { RemediationRule } from '@/types/iac';

export const terraformRules: RemediationRule[] = [
  {
    id: 'tf-s3-public-read',
    name: 'S3 Bucket Public Read Access',
    category: 'terraform',
    pattern: /resource\s+"aws_s3_bucket_public_access_block"\s+"([^"]+)"\s*{[^}]*block_public_acls\s*=\s*false/g,
    fix: (config, match) => {
      const updatedConfig = config.replace(
        /block_public_acls\s*=\s*false/g,
        'block_public_acls = true'
      );
      return {
        updatedConfig,
        patches: [{
          op: 'replace',
          path: '/resource/aws_s3_bucket_public_access_block/block_public_acls',
          value: true
        }],
        explanation: 'Changed block_public_acls from false to true to prevent public access to S3 bucket objects.'
      };
    }
  },
  {
    id: 'tf-security-group-open',
    name: 'Security Group Open to Internet',
    category: 'terraform',
    pattern: /resource\s+"aws_security_group_rule"\s+"([^"]+)"\s*{[^}]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/g,
    fix: (config, match) => {
      const updatedConfig = config.replace(
        /cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/g,
        'cidr_blocks = ["10.0.0.0/8"]'
      );
      return {
        updatedConfig,
        patches: [{
          op: 'replace',
          path: '/resource/aws_security_group_rule/cidr_blocks',
          value: ['10.0.0.0/8']
        }],
        explanation: 'Restricted CIDR blocks from 0.0.0.0/0 (internet) to 10.0.0.0/8 (private network) to limit access.'
      };
    }
  },
  {
    id: 'tf-rds-public',
    name: 'RDS Instance Publicly Accessible',
    category: 'terraform',
    pattern: /resource\s+"aws_db_instance"\s+"([^"]+)"\s*{[^}]*publicly_accessible\s*=\s*true/g,
    fix: (config, match) => {
      const updatedConfig = config.replace(
        /publicly_accessible\s*=\s*true/g,
        'publicly_accessible = false'
      );
      return {
        updatedConfig,
        patches: [{
          op: 'replace',
          path: '/resource/aws_db_instance/publicly_accessible',
          value: false
        }],
        explanation: 'Changed publicly_accessible from true to false to prevent direct internet access to RDS instance.'
      };
    }
  }
];

export const kubernetesRules: RemediationRule[] = [
  {
    id: 'k8s-privileged-container',
    name: 'Privileged Container',
    category: 'kubernetes',
    pattern: /privileged:\s*true/g,
    fix: (config, match) => {
      const updatedConfig = config.replace(/privileged:\s*true/g, 'privileged: false');
      return {
        updatedConfig,
        patches: [{
          op: 'replace',
          path: '/spec/containers/0/securityContext/privileged',
          value: false
        }],
        explanation: 'Changed privileged from true to false to remove elevated privileges from container.'
      };
    }
  },
  {
    id: 'k8s-run-as-root',
    name: 'Container Running as Root',
    category: 'kubernetes',
    pattern: /runAsUser:\s*0/g,
    fix: (config, match) => {
      const updatedConfig = config.replace(/runAsUser:\s*0/g, 'runAsUser: 1000');
      return {
        updatedConfig,
        patches: [{
          op: 'replace',
          path: '/spec/containers/0/securityContext/runAsUser',
          value: 1000
        }],
        explanation: 'Changed runAsUser from 0 (root) to 1000 (non-root user) to improve security posture.'
      };
    }
  },
  {
    id: 'k8s-allow-privilege-escalation',
    name: 'Allow Privilege Escalation',
    category: 'kubernetes',
    pattern: /allowPrivilegeEscalation:\s*true/g,
    fix: (config, match) => {
      const updatedConfig = config.replace(/allowPrivilegeEscalation:\s*true/g, 'allowPrivilegeEscalation: false');
      return {
        updatedConfig,
        patches: [{
          op: 'replace',
          path: '/spec/containers/0/securityContext/allowPrivilegeEscalation',
          value: false
        }],
        explanation: 'Changed allowPrivilegeEscalation from true to false to prevent privilege escalation attacks.'
      };
    }
  }
];

export const allRules = [...terraformRules, ...kubernetesRules];
