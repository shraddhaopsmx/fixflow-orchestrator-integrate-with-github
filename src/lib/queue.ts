
export type RemediationJobStatus = "queued" | "proposed" | "approved" | "executed" | "failed";

export interface RemediationJob {
  jobId: string;
  issueId: string;
  domain: "code" | "iac" | "pipeline" | "cloud";
  status: RemediationJobStatus;
  createdAt: string;
  updatedAt: string;
  requiresApproval: boolean;
  [k: string]: any;
}

const jobStore: Record<string, RemediationJob> = {};

export function enqueueJob(job: RemediationJob) {
  jobStore[job.jobId] = job;
}

export function updateJobStatus(jobId: string, status: RemediationJobStatus) {
  if (jobStore[jobId]) {
    jobStore[jobId].status = status;
    jobStore[jobId].updatedAt = new Date().toISOString();
  }
}

export function getJob(jobId: string) {
  return jobStore[jobId];
}

export function allJobs(): RemediationJob[] {
  return Object.values(jobStore);
}
