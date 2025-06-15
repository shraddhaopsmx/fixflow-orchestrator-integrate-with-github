import { fetchPrioritizedRisks, RiskIssue } from "./risk-api-client";
import { fetchContextGraph } from "./context-graph-client";
import { evaluatePolicy } from "./policy-engine";
import { logEvent } from "./auditor";
import { enqueueJob, updateJobStatus, getJob, allJobs, RemediationJob, RemediationJobStatus } from "./queue";
import { executeFix } from "./fix-executor";

// Domain classifier
function classifyDomain(source: string): "code" | "iac" | "pipeline" | "cloud" {
  if (source === "SAST") return "code";
  if (source === "IaC") return "iac";
  if (source === "Pipeline") return "pipeline";
  if (source === "CSPM") return "cloud";
  return "code";
}

// Simulate remediation agent (normally would call internal API or send to queue)
async function routeToAgent(domain: string, job: RemediationJob) {
  // Simulate async agent processing
  await new Promise(r => setTimeout(r, 500));
  // Mark job as proposed (remediation ready)
  updateJobStatus(job.jobId, "proposed");
  logEvent({ jobId: job.jobId, action: "agent_propose_fix", details: { domain }});
}

export async function orchestrateRemediation() {
  // 1. Fetch from Risk API
  const risks = await fetchPrioritizedRisks();
  for (const issue of risks) {
    // 2. Fetch context
    const context = await fetchContextGraph(issue.id);

    // 3. Classify domain
    const domain = classifyDomain(issue.source);

    // 4. Policy decision
    const policy = evaluatePolicy(issue);

    // 5. Create Remediation Job
    const jobId = `job-${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const job: RemediationJob = {
      jobId,
      issueId: issue.id,
      domain,
      status: "queued",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requiresApproval: policy.requiresApproval,
      severity: issue.severity,
      summary: issue.summary,
      context,
    };

    enqueueJob(job);
    logEvent({ jobId, action: "job_queued", details: { domain, policy } });

    // 6. Route to agent (async queue sim)
    routeToAgent(domain, job).then(() => {
      // If auto, auto approve & execute
      if (policy.autoRemediate) {
        updateJobStatus(jobId, "approved");
        logEvent({ jobId, action: "job_auto_approved", details: {} });
        // The fix executor now handles the execution and its logging
        executeFix(jobId);
      }
    });
  }
}

// RESTful endpoint handlers (to be routed in your server framework)
export async function getJobsHandler(req: any, res: any) {
  res.json(allJobs());
}

export async function getJobHandler(req: any, res: any) {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
}

export async function syncHandler(req: any, res: any) {
  await orchestrateRemediation();
  res.json({ message: "Sync started" });
}

export async function approveJobHandler(req: any, res: any) {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (!job.requiresApproval) return res.status(400).json({ error: "Approval not required" });
  updateJobStatus(job.jobId, "approved");
  logEvent({ jobId: job.jobId, action: "job_approved", details: { by: "human" }});
  
  // The fix executor handles the execution and returns the outcome
  const result = await executeFix(job.jobId);
  
  if (result.success) {
    res.json({ success: true, message: "Job executed successfully." });
  } else {
    res.status(500).json({ success: false, message: "Job execution failed.", error: result.error });
  }
}

export async function auditLogHandler(req: any, res: any) {
  // Optionally filter by job ID
  const logs = require('./auditor').getAuditLog(req.query.jobId);
  res.json(logs);
}
