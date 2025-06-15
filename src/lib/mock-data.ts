
import { Risk, Agent } from "@/types";
import { Code, FileCode, CloudUpload, Cloud, Shield } from "lucide-react";
import { subDays } from 'date-fns';

export const agents: Agent[] = [
    { name: 'Code', icon: Code, description: "SAST/SCA findings" },
    { name: 'IaC', icon: FileCode, description: "Terraform/K8s misconfigs" },
    { name: 'Pipeline', icon: CloudUpload, description: "Risky delivery configs" },
    { name: 'Cloud', icon: Cloud, description: "Live cloud misconfigs" },
    { name: 'Runtime', icon: Shield, description: "Runtime threat detection" },
];

export const risks: Risk[] = [
  { id: 'RISK-001', title: 'SQL Injection Vulnerability', agent: 'Code', severity: 'Critical', status: 'Open', timestamp: subDays(new Date(), 2).toISOString(), resource: 'auth-service/login.go' },
  { id: 'RISK-002', title: 'S3 Bucket Publicly Accessible', agent: 'Cloud', severity: 'Critical', status: 'Open', timestamp: subDays(new Date(), 1).toISOString(), resource: 's3://prod-assets' },
  { id: 'RISK-003', title: 'Outdated "requests" library', agent: 'Code', severity: 'High', status: 'Open', timestamp: subDays(new Date(), 5).toISOString(), resource: 'payment-service/requirements.txt' },
  { id: 'RISK-004', title: 'EC2 Security Group Open to 0.0.0.0/0', agent: 'IaC', severity: 'High', status: 'In Progress', timestamp: subDays(new Date(), 3).toISOString(), resource: 'terraform/modules/main.tf' },
  { id: 'RISK-005', title: 'Hardcoded API Key in source', agent: 'Code', severity: 'High', status: 'Fixed', timestamp: subDays(new Date(), 10).toISOString(), resource: 'user-service/api.js' },
  { id: 'RISK-006', title: 'CI Pipeline allows skipping tests', agent: 'Pipeline', severity: 'Medium', status: 'Open', timestamp: subDays(new Date(), 7).toISOString(), resource: '.github/workflows/deploy.yml' },
  { id: 'RISK-007', title: 'Missing IAM MFA for admin user', agent: 'Cloud', severity: 'Medium', status: 'Open', timestamp: subDays(new Date(), 4).toISOString(), resource: 'arn:aws:iam::123:user/admin' },
  { id: 'RISK-008', title: 'Excessive Privileges in Dockerfile', agent: 'IaC', severity: 'Medium', status: 'Fixed', timestamp: subDays(new Date(), 15).toISOString(), resource: 'analytics-service/Dockerfile' },
  { id: 'RISK-009', title: 'Cross-Site Scripting (XSS)', agent: 'Code', severity: 'High', status: 'Open', timestamp: subDays(new Date(), 6).toISOString(), resource: 'frontend/views/search.jsx' },
  { id: 'RISK-010', title: 'Suspicious Network Outbound', agent: 'Runtime', severity: 'High', status: 'In Progress', timestamp: subDays(new Date(), 1).toISOString(), resource: 'pod/prod-worker-7b5' },
  { id: 'RISK-011', title: 'Log4j Vulnerability (CVE-2021-44228)', agent: 'Code', severity: 'Critical', status: 'Open', timestamp: subDays(new Date(), 8).toISOString(), resource: 'legacy-java-app/pom.xml' },
  { id: 'RISK-012', title: 'ECR Image Scan found 5 critical CVEs', agent: 'Pipeline', severity: 'High', status: 'Open', timestamp: subDays(new Date(), 2).toISOString(), resource: 'docker.io/library/node:14' },
];
