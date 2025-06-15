import {
  SecurityIssue,
  ContextGraphMetadata,
  RemediationJob,
  OrchestrationEvent,
  Domain,
  RemediationJobStatus,
} from "@/types/orchestration-job";
import { requiresApproval } from "./policy-engine";
import { logEvent } from "./audit-log";
import { enqueue } from "./queue";

// In-memory store for example purposes
const jobs: Record<string, RemediationJob> = {};

function classifyDomain(issue: SecurityIssue): Domain {
  switch (issue.source) {
    case "SAST": return "code";
    case "IaC": return "iac";
    case "Pipeline": return "pipeline";
    case "CSPM": return "cloud";
    default: return "code";
  }
}

function selectRoute(domain: Domain) {
  switch (domain) {
    case "code": return "CodeRemediationAgent";
    case "iac": return "IaCRemediationAgent";
    case "pipeline": return "PipelineRemediationAgent";
    case "cloud": return "CloudRemediationAgent";
  }
}

async function fetchRiskAssessmentIssues(): Promise<SecurityIssue[]> {
  // Placeholder: Replace with fetch to Risk Assessment API
  return [
    {
      id: "ISSUE-001",
      source: "SAST",
      type: "XSS",
      severity: "High",
      context: { file: "UserView.js" },
    },
    {
      id: "ISSUE-002",
      source: "CSPM",
      type: "S3 Public",
      severity: "Critical",
      context: { bucket: "public-bucket" },
    },
  ];
}

async function fetchContextGraph(issue: SecurityIssue): Promise<ContextGraphMetadata> {
  // Placeholder: Replace with call to Context Graph API
  return {
    application: { appName: "ExampleApp" },
    iac: {},
    ciCd: {},
  };
}

// Simulate internal API for remediation agent routing
async function routeToAgent(domain: Domain, issue: SecurityIssue, context: ContextGraphMetadata) {
  // Simulate agent task handling
  await new Promise(res => setTimeout(res, 500));
  return { agentResponse: "success" };
}

// Main orchestration sync cycle
export async function syncRisksAndEnqueueJobs() {
  const issues = await fetchRiskAssessmentIssues();
  for (const issue of issues) {
    const enrichedContext = await fetchContextGraph(issue);
    const domain = classifyDomain(issue);
    const routeTarget = selectRoute(domain);
    const approvalRequired = requiresApproval(issue);

    const jobId = `job-${issue.id}`;
    const job: RemediationJob = {
      jobId,
      issue,
      enrichedContext,
      domain,
      routeTarget,
      status: "queued",
      approvalRequired,
      approved: !approvalRequired,
      events: [],
    };
    jobs[jobId] = job;

    logEvent({
      timestamp: new Date().toISOString(),
      jobId,
      action: "job_queued",
      details: `Job created for issue ${issue.id}`,
      data: { issue, enrichedContext, domain, routeTarget, approvalRequired },
    });

    enqueue(async () => await handleJob(jobId));
  }
  return Object.values(jobs);
}

async function handleJob(jobId: string) {
  const job = jobs[jobId];
  if (!job) return;
  job.status = "proposed";
  logEvent({
    timestamp: new Date().toISOString(),
    jobId,
    action: "job_proposed",
    details: `Job proposed for remediation.`,
    data: { job },
  });
  if (job.approvalRequired && !job.approved) {
    job.status = "awaiting_approval";
    logEvent({
      timestamp: new Date().toISOString(),
      jobId,
      action: "awaiting_approval",
      details: `Waiting for manual approval.`,
    });
    return;
  }

  // Now execute
  job.status = "executed";
  await routeToAgent(job.domain, job.issue, job.enrichedContext);
  logEvent({
    timestamp: new Date().toISOString(),
    jobId,
    action: "remediation_executed",
    details: `Remediation executed by agent.`,
  });
}

// Manual approval function
export async function approveJob(jobId: string) {
  const job = jobs[jobId];
  if (!job) throw new Error("Job not found");
  job.approved = true;
  if (job.status === "awaiting_approval") {
    enqueue(async () => await handleJob(jobId));
  }
  logEvent({
    timestamp: new Date().toISOString(),
    jobId,
    action: "approved",
    details: "Job approved by user.",
  });
}

export function getJob(jobId: string) {
  return jobs[jobId];
}

export function getAllJobs() {
  return Object.values(jobs);
}
