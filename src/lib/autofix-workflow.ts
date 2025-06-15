
import {
  AuditLogEntry,
  AutoFixResult,
  IssueMetadata,
  MCPPayload,
  LLMResponse,
} from "@/types/workflow";
import { contextGraphAPI } from "./context-graph-api";
import { llmClient } from "./llm-client";
import { mcpClient } from "./mcp-client";

const CONFIDENCE_THRESHOLD = 90;

const getMcpActionAndPayload = (issue: IssueMetadata, llmResponse: LLMResponse): MCPPayload => {
  const commitMessage = `fix: remediate ${issue.id} - ${issue.description.slice(0, 50)}`;

  switch (issue.type) {
    case 'SCA':
    case 'SAST':
      return {
        type: 'gitops/apply-patch',
        payload: {
          repository: issue.location.repository,
          branch: issue.location.branch || 'main',
          patch: llmResponse.proposedFix,
          commitMessage,
        },
      };
    case 'CSPM':
      if (issue.location.filePath) { // This implies IaC
        return {
          type: 'iac/commit-patch',
          payload: {
            repository: issue.location.repository,
            branch: issue.location.branch || 'main',
            filePath: issue.location.filePath,
            patch: llmResponse.proposedFix,
            commitMessage,
          },
        };
      }
      // This implies a cloud resource
      return {
        type: 'cloud/apply-remediation',
        payload: {
          resourceId: issue.location.resourceId,
          region: issue.location.region,
          remediationScript: llmResponse.proposedFix,
        },
      };
    case 'PIPELINE':
      return {
        type: 'pipeline/update-config',
        payload: {
          repository: issue.location.repository,
          branch: issue.location.branch || 'main',
          filePath: issue.location.filePath,
          patch: llmResponse.proposedFix,
          commitMessage,
        },
      };
    case 'RUNTIME':
      return {
        type: 'runtime/isolate',
        payload: {
          resourceId: issue.location.resourceId,
          reason: llmResponse.rationale,
          action: llmResponse.proposedFix,
        },
      };
    default:
      const unhandledType: never = issue.type;
      throw new Error(`Unsupported issue type for MCP action: ${unhandledType}`);
  }
};


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

    const prompt = llmClient.getPrompt(issue, context);
    log('Generating LLM prompt', { prompt });
    const llmResponse = await llmClient.generateFix(prompt);
    log('LLM response received', llmResponse);

    if (llmResponse.confidence >= CONFIDENCE_THRESHOLD) {
      log('Confidence above threshold', { confidence: llmResponse.confidence, threshold: CONFIDENCE_THRESHOLD });
      
      const mcpPayload = getMcpActionAndPayload(issue, llmResponse);

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
