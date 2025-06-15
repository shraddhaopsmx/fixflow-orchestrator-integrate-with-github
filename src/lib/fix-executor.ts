
import { RemediationJob, updateJobStatus, getJob } from './queue';
import { logEvent } from './auditor';

/**
 * Defines the function signature for a rollback hook.
 * These can be registered per domain to handle cleanup after a failed fix.
 */
export type RollbackHook = (job: RemediationJob, error: any) => Promise<void>;

/**
 * Defines the result of an execution attempt.
 */
export type FixExecutionResult = {
  success: boolean;
  error?: string;
  details?: any;
};

// A private map to store registered rollback hooks.
const rollbackHooks = new Map<string, RollbackHook>();

/**
 * Registers a rollback hook for a specific remediation domain.
 * @param domain The domain ('code', 'iac', etc.) the hook applies to.
 * @param hook The async function to execute on rollback.
 */
export function registerRollbackHook(domain: "code" | "iac" | "pipeline" | "cloud", hook: RollbackHook) {
  rollbackHooks.set(domain, hook);
  console.log(`Registered rollback hook for domain: ${domain}`);
}

/**
 * Executes a remediation fix for a given job.
 * It is agent-agnostic and relies on the job's domain to perform actions.
 * @param jobId The ID of the job to execute.
 * @returns A promise that resolves with the execution result.
 */
export async function executeFix(jobId: string): Promise<FixExecutionResult> {
  const job = getJob(jobId);
  if (!job) {
    const errorMsg = `Job ${jobId} not found for execution.`;
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  logEvent({ jobId, action: 'fix_execution_started', details: { domain: job.domain, confidence: 'high' } });

  try {
    // --- This block simulates applying the actual fix ---
    // In a real system, this might involve calling an agent-specific API.
    await new Promise(r => setTimeout(r, 400)); // Simulate async work

    // We'll introduce a random failure to demonstrate error handling and rollbacks.
    if (job.domain === 'cloud' && Math.random() < 0.25) { // 25% chance of failure for cloud fixes
        throw new Error("Simulated IAM permission error during cloud resource update.");
    }
    // --- End of simulation ---

    updateJobStatus(jobId, 'executed');
    logEvent({
      jobId,
      action: 'fix_executed_successfully',
      details: { summary: 'Fix applied as per proposed remediation.', policy: 'auto-remediate-on-approval' },
    });

    return { success: true, details: "Fix applied successfully." };

  } catch (error: any) {
    console.error(`Execution failed for job ${jobId}:`, error.message);
    updateJobStatus(jobId, 'failed');
    logEvent({
      jobId,
      action: 'fix_execution_failed',
      details: { error: error.message },
    });

    // Check for and trigger a corresponding rollback hook.
    const rollback = rollbackHooks.get(job.domain);
    if (rollback) {
      logEvent({ jobId, action: 'rollback_initiated', details: { reason: 'Execution failure' } });
      try {
        await rollback(job, error);
        logEvent({ jobId, action: 'rollback_completed', details: {} });
      } catch (rollbackError: any) {
        logEvent({ jobId, action: 'rollback_failed', details: { error: rollbackError.message } });
      }
    }

    return { success: false, error: error.message };
  }
}
