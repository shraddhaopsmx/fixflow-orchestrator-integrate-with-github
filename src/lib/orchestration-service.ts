
import { OrchestrationIssue, LifecycleLogEntry, FinalReport } from '@/types/orchestration';
import { codeRemediationService } from './code-remediation-service';
import { iacRemediationService } from './iac-remediation-service';
import { pipelineRemediationService } from './pipeline-remediation-service';
import { cloudRemediationService } from './cloud-remediation-service';
import { CodeFinding } from '@/types/code';
import { IaCInput } from '@/types/iac';
import { PipelineInput } from '@/types/pipeline';
import { CSPMFinding } from '@/types/cloud';

const randomDelay = (min = 500, max = 1500) => new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

class OrchestrationService {
  async runSimulation(issues: OrchestrationIssue[]): Promise<{ logs: LifecycleLogEntry[], report: FinalReport }> {
    const logs: LifecycleLogEntry[] = [];
    let completedCount = 0;
    let autoRemediatedCount = 0;
    let approvalRemediatedCount = 0;
    let failedCount = 0;
    const startTime = Date.now();

    const log = (entry: Omit<LifecycleLogEntry, 'timestamp'>) => {
      const newEntry = { ...entry, timestamp: new Date().toISOString() };
      logs.push(newEntry);
      console.log(`[Orchestrator] ${newEntry.step}: ${newEntry.message}`);
    };

    for (const issue of issues) {
      try {
        log({ issueId: issue.id, step: 'Received', message: `Received issue: ${issue.description}` });
        await randomDelay(100, 200);

        log({ issueId: issue.id, step: 'Routed', message: `Routing to ${issue.type.toUpperCase()} Agent.` });
        await randomDelay(100, 200);

        let result: any;
        switch (issue.type) {
          case 'sast':
          case 'sca':
            result = await codeRemediationService.generateFix(issue.payload as CodeFinding);
            break;
          case 'iac':
            result = await iacRemediationService.remediateConfiguration(issue.payload as IaCInput);
            break;
          case 'pipeline':
            result = await pipelineRemediationService.remediatePipeline(issue.payload as PipelineInput);
            break;
          case 'cspm':
            result = await cloudRemediationService.remediate(issue.payload as CSPMFinding);
            break;
        }

        log({ issueId: issue.id, step: 'Agent Executed', message: `Agent returned a fix. Success: ${result.success}`, details: result });

        if (!result.success) {
          throw new Error(result.error || 'Agent failed to generate a fix.');
        }

        if (issue.policy.requiresApproval) {
          log({ issueId: issue.id, step: 'Pending Approval', message: 'Fix requires manual approval.' });
          await randomDelay(1000, 2000); // Simulate human review time
          log({ issueId: issue.id, step: 'Approved', message: 'Fix approved by reviewer.' });
          approvalRemediatedCount++;
        } else {
          log({ issueId: issue.id, step: 'Approved', message: 'Fix auto-approved by policy.' });
          autoRemediatedCount++;
        }

        await randomDelay(200, 500);
        log({ issueId: issue.id, step: 'Fix Applied', message: 'Remediation has been applied.' });
        completedCount++;
        log({ issueId: issue.id, step: 'Completed', message: 'Issue lifecycle complete.' });
      } catch (error) {
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log({ issueId: issue.id, step: 'Failed', message: `Lifecycle failed: ${errorMessage}`, details: error });
      }
    }

    const endTime = Date.now();
    const totalTimeMs = endTime - startTime;
    const averageTimeToRemediateMs = completedCount > 0 ? totalTimeMs / completedCount : 0;
    
    // Simplified risk reduction score
    const riskReductionScore = (autoRemediatedCount * 10) + (approvalRemediatedCount * 5);

    const report: FinalReport = {
      totalIssues: issues.length,
      remediatedAutomatically: autoRemediatedCount,
      remediatedWithApproval: approvalRemediatedCount,
      failed: failedCount,
      averageTimeToRemediateMs,
      riskReductionScore,
    };

    return { logs, report };
  }
}

export const orchestrationService = new OrchestrationService();
