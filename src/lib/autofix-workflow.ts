
import {
  AuditLogEntry,
  AutoFixResult,
  IssueMetadata,
  MCPPayload,
} from "@/types/workflow";
import { contextGraphAPI } from "./context-graph-api";
import { llmClient } from "./llm-client";
import { mcpClient } from "./mcp-client";

const CONFIDENCE_THRESHOLD = 90;

export const runAutoFixWorkflow = async (
  issue: IssueMetadata
): Promise<AutoFixResult> => {
  const workflowId = `wf-${crypto.randomUUID()}`;
  const auditLog: AuditLogEntry[] = [];
  
  const log = (action: string, details: any) => {
    auditLog.push({ timestamp: new Date().toISOString(), actor: 'AutoFixWorkflow', action, details });
  };

  log('Workflow started', { workflowId, issueId: issue.id });

  try {
    log('Fetching context', { issueId: issue.id });
    const context = await contextGraphAPI.fetchEnrichment(issue);
    log('Context received', context);

    const prompt = llmClient.getPrompt('SCA', context, issue.description);
    log('Generating LLM prompt', { prompt });
    const llmResponse = await llmClient.generateFix(prompt);
    log('LLM response received', llmResponse);

    if (llmResponse.confidence >= CONFIDENCE_THRESHOLD) {
      log('Confidence above threshold', { confidence: llmResponse.confidence, threshold: CONFIDENCE_THRESHOLD });
      
      const mcpPayload: MCPPayload = {
        type: 'gitops/apply-patch',
        payload: {
          repository: issue.location.repository,
          branch: 'main',
          patch: llmResponse.proposedFix,
          commitMessage: `fix: remediate ${issue.id}`,
        }
      };
      log('Sending fix to MCP', mcpPayload);
      const mcpResponse = await mcpClient.applyPatch(mcpPayload.type, mcpPayload.payload);
      log('MCP response received', mcpResponse);

      return {
        workflowId,
        issueId: issue.id,
        status: 'COMPLETED_AUTOMATIC',
        decision: `Auto-remediated based on confidence score of ${llmResponse.confidence.toFixed(2)}%`,
        context,
        llmResponse,
        mcpResponse,
        auditLog,
      };

    } else {
      log('Confidence below threshold', { confidence: llmResponse.confidence, threshold: CONFIDENCE_THRESHOLD });
      const approvalPayload = {
        issue,
        context,
        llmResponse,
        suggestedAction: 'Apply Git patch',
      };
      log('Sending to human approval queue', approvalPayload);
      
      return {
        workflowId,
        issueId: issue.id,
        status: 'AWAITING_APPROVAL',
        decision: `Fix requires manual approval due to confidence score of ${llmResponse.confidence.toFixed(2)}%`,
        context,
        llmResponse,
        approvalPayload,
        auditLog,
      };
    }
  } catch (error: any) {
    log('Workflow failed', { error: error.message });
    return {
      workflowId,
      issueId: issue.id,
      status: 'FAILED',
      decision: 'An unexpected error occurred during the workflow.',
      auditLog,
      error: error.message,
    };
  }
};
