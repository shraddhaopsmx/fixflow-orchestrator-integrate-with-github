
import { OpsMxIssue, OrchestratorConfig } from "@/types/opsmx";
import { IssueMetadata } from "@/types/workflow";
import { opsMxApiClient } from "./opsmx-api-client";
import { issueStore } from "./issue-store";
import { runAutoFixWorkflow } from "./autofix-workflow";

class Orchestrator {
  private config: OrchestratorConfig;
  private isPolling = false;
  private pollTimeout: NodeJS.Timeout | null = null;
  private consecutiveErrors = 0;
  private maxConsecutiveErrors = 5;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = {
      apiEndpoint: '/risk-assessment/issues',
      pollInterval: 30000, // 30 seconds
      backoffInterval: 10000, // 10 seconds
      maxRetries: 3,
      ...config
    };
  }

  async start(): Promise<void> {
    if (this.isPolling) {
      console.log('[Orchestrator] Already polling, ignoring start request');
      return;
    }

    this.isPolling = true;
    console.log('[Orchestrator] Starting issue polling...');
    
    // Start immediate poll
    await this.poll();
  }

  stop(): void {
    this.isPolling = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    console.log('[Orchestrator] Stopped issue polling');
  }

  private async poll(): Promise<void> {
    if (!this.isPolling) return;

    try {
      console.log('[Orchestrator] Polling for new issues...');
      
      const issues = await opsMxApiClient.fetchRiskAssessmentIssues();
      const newIssueCount = issueStore.addIssues(issues);
      
      if (newIssueCount > 0) {
        console.log(`[Orchestrator] Processing ${newIssueCount} new issues`);
        await this.processNewIssues(issues);
      }
      
      this.consecutiveErrors = 0;
      this.scheduleNextPoll(this.config.pollInterval);
      
    } catch (error: any) {
      this.consecutiveErrors++;
      console.error(`[Orchestrator] Poll error (${this.consecutiveErrors}/${this.maxConsecutiveErrors}):`, error.message);
      
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        console.error('[Orchestrator] Max consecutive errors reached, stopping polling');
        this.stop();
        return;
      }
      
      // Use backoff interval for errors
      this.scheduleNextPoll(this.config.backoffInterval);
    }
  }

  private scheduleNextPoll(delay: number): void {
    if (!this.isPolling) return;
    
    this.pollTimeout = setTimeout(() => {
      this.poll();
    }, delay);
  }

  private async processNewIssues(issues: OpsMxIssue[]): Promise<void> {
    const openIssues = issues.filter(issue => issue.status === 'open');
    
    for (const issue of openIssues) {
      try {
        console.log(`[Orchestrator] Processing issue: ${issue.issueId} (${issue.type})`);
        
        // Convert OpsMx issue to workflow issue metadata
        const issueMetadata: IssueMetadata = {
          id: issue.issueId,
          type: issue.type as IssueMetadata['type'],
          severity: issue.severity,
          location: {
            filePath: issue.sourceLocation.filePath,
            repository: issue.sourceLocation.repository,
            branch: issue.sourceLocation.branch,
            resourceId: issue.sourceLocation.resourceId,
            region: issue.sourceLocation.region,
          },
          description: issue.description,
          riskScore: issue.riskScore,
          // Additional enriched data could be added here
        };
        
        // Trigger the auto-fix workflow
        const result = await runAutoFixWorkflow(issueMetadata);
        
        console.log(`[Orchestrator] Workflow completed for ${issue.issueId}:`, result.status);
        
        // Update issue status based on workflow result
        if (result.status === 'COMPLETED_AUTOMATIC') {
          issueStore.updateIssueStatus(issue.issueId, 'mitigated');
        } else if (result.status === 'AWAITING_APPROVAL') {
          issueStore.updateIssueStatus(issue.issueId, 'approved');
        }
        
      } catch (error: any) {
        console.error(`[Orchestrator] Error processing issue ${issue.issueId}:`, error.message);
      }
    }
  }

  getStats() {
    return {
      isPolling: this.isPolling,
      consecutiveErrors: this.consecutiveErrors,
      config: this.config,
      issueStats: issueStore.getStats()
    };
  }

  async processIssue(issueId: string): Promise<void> {
    const issue = issueStore.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }
    
    await this.processNewIssues([issue]);
  }
}

export const orchestrator = new Orchestrator();
