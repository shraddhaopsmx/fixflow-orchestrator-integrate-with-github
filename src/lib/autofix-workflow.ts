
import {
  AuditLogEntry,
  AutoFixResult,
  IssueMetadata,
  MCPPayload,
  RemediationMetrics,
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
  const startTime = Date.now();
  
  const log = (action: string, details: any) => {
    auditLog.push({ timestamp: new Date().toISOString(), actor: 'AutoFixWorkflow', action, details });
  };

  log('Workflow started', { workflowId, issueId: issue.id, riskScore: issue.riskScore });

  try {
    // Risk-based processing
    if (issue.riskScore && issue.riskScore >= 0.8) {
      log('High risk score detected - proceeding with auto-remediation', { riskScore: issue.riskScore });
    } else if (issue.riskScore && issue.riskScore >= 0.5) {
      log('Medium risk score detected - will require approval', { riskScore: issue.riskScore });
    }

    log('Fetching context', { issueId: issue.id });
    const context = await contextGraphAPI.fetchEnrichment(issue);
    log('Context received', context);

    // Enhanced prompt with enriched issue data
    const prompt = llmClient.getPrompt('SCA', context, issue.description, {
      riskScore: issue.riskScore,
      codeSnippet: issue.codeSnippet,
      language: issue.language,
      fileOwner: issue.fileOwner,
      filePath: issue.location.filePath
    });
    
    log('Generating LLM prompt', { prompt });
    const llmResponse = await llmClient.generateFix(prompt);
    log('LLM response received', llmResponse);

    const endTime = Date.now();
    const metrics: RemediationMetrics = {
      timeToFix: endTime - startTime,
      successRate: 0, // Will be calculated based on historical data
      llmAccuracy: llmResponse.confidence,
      workflowStartTime: startTime,
      workflowEndTime: endTime
    };

    // Auto-remediation for high risk scores
    if (issue.riskScore && issue.riskScore >= 0.8 && llmResponse.confidence >= CONFIDENCE_THRESHOLD) {
      log('Auto-remediating high risk issue', { confidence: llmResponse.confidence, riskScore: issue.riskScore });
      
      const mcpPayload: MCPPayload = {
        type: 'gitops/apply-patch',
        payload: {
          repository: issue.location.repository,
          branch: 'main',
          patch: llmResponse.proposedFix,
          commitMessage: `fix: auto-remediate ${issue.id} (risk: ${issue.riskScore})`,
          fileOwner: issue.fileOwner
        }
      };
      
      log('Sending fix to MCP', mcpPayload);
      const mcpResponse = await mcpClient.applyPatch(mcpPayload.type, mcpPayload.payload);
      log('MCP response received', mcpResponse);

      // Send status to orchestrator
      log('Sending status to orchestrator', { status: 'AUTO_REMEDIATED', workflowId });

      metrics.successRate = mcpResponse.status === 'SUCCESS' ? 100 : 0;

      return {
        workflowId,
        issueId: issue.id,
        status: 'COMPLETED_AUTOMATIC',
        decision: `Auto-remediated high risk issue (${issue.riskScore}) with confidence ${llmResponse.confidence.toFixed(2)}%`,
        context,
        llmResponse,
        mcpResponse,
        auditLog,
        metrics,
      };

    } else if (issue.riskScore && issue.riskScore >= 0.5) {
      log('Medium risk - generating fix draft for approval', { confidence: llmResponse.confidence, riskScore: issue.riskScore });
      
      const approvalPayload = {
        issue,
        context,
        llmResponse,
        suggestedAction: 'Apply Git patch',
        approvalRequired: true,
        riskAssessment: {
          riskScore: issue.riskScore,
          autoRemediationEligible: false,
          reason: 'Risk score below auto-remediation threshold'
        }
      };
      
      log('Sending to approval queue with orchestrator notification', { approvalPayload, approvalRequired: true });

      return {
        workflowId,
        issueId: issue.id,
        status: 'AWAITING_APPROVAL',
        decision: `Fix draft generated for risk score ${issue.riskScore} - requires manual approval`,
        context,
        llmResponse,
        approvalPayload,
        auditLog,
        metrics,
      };

    } else {
      log('Low risk or insufficient confidence', { confidence: llmResponse.confidence, riskScore: issue.riskScore });
      
      const approvalPayload = {
        issue,
        context,
        llmResponse,
        suggestedAction: 'Manual review recommended',
        approvalRequired: true
      };
      
      return {
        workflowId,
        issueId: issue.id,
        status: 'AWAITING_APPROVAL',
        decision: `Manual review required - risk score: ${issue.riskScore}, confidence: ${llmResponse.confidence.toFixed(2)}%`,
        context,
        llmResponse,
        approvalPayload,
        auditLog,
        metrics,
      };
    }
    
  } catch (error: any) {
    const endTime = Date.now();
    log('Workflow failed', { error: error.message });
    
    const metrics: RemediationMetrics = {
      timeToFix: endTime - startTime,
      successRate: 0,
      llmAccuracy: 0,
      workflowStartTime: startTime,
      workflowEndTime: endTime
    };

    return {
      workflowId,
      issueId: issue.id,
      status: 'FAILED',
      decision: 'An unexpected error occurred during the workflow.',
      auditLog,
      error: error.message,
      metrics,
    };
  }
};
