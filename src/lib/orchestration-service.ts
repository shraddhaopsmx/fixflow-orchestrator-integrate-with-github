
import { orchestrationTestInputs } from "./orchestration-test-data";
import { codeRemediationService } from "./code-remediation-service";
import { iacRemediationService } from "./iac-remediation-service";
import { pipelineRemediationService } from "./pipeline-remediation-service";
import { cloudRemediationService } from "./cloud-remediation-service";
import {
  OrchestrationLogEntry,
  OrchestrationAgentResult,
  OrchestrationFinalReport,
  OrchestrationInputEvent,
} from "@/types/orchestration";

function nowIso() {
  return new Date().toISOString();
}

export async function simulateOrchestrationLifecycle(): Promise<OrchestrationFinalReport> {
  const logs: OrchestrationLogEntry[] = [];
  const agentResults: OrchestrationAgentResult[] = [];
  let received = 0, auto = 0, withApproval = 0, mttr = 0, totalReduction = 0;

  // Step 1: Receive and classify events
  for (const event of orchestrationTestInputs as OrchestrationInputEvent[]) {
    logs.push({
      timestamp: nowIso(),
      step: "Input",
      details: `Received event from ${event.source}`,
      samplePayload: event,
    });
    let agent: "Code" | "IaC" | "Pipeline" | "Cloud";
    let apiSampleRequest, apiSampleResponse, result, approvalRequired, approved = true, applied = false, humanApprovalSimulated = false;
    let riskReductionScore = 0;
    let start = Date.now();

    // Step 2: Classify and route
    switch (event.source) {
      case "SAST":
        agent = "Code";
        approvalRequired = false;
        logs.push({
          timestamp: nowIso(),
          step: "Route",
          details: "Classified as SAST. Routed to Code Remediation Agent.",
        });
        apiSampleRequest = event.finding;
        result = await codeRemediationService.generateFix(event.finding);
        riskReductionScore = result.success ? 30 : 0;
        break;
      case "IaC":
        agent = "IaC";
        approvalRequired = true;
        logs.push({
          timestamp: nowIso(),
          step: "Route",
          details: "Classified as IaC issue. Routed to IaC Agent.",
        });
        apiSampleRequest = event.finding;
        result = await iacRemediationService.remediateConfiguration(event.finding);
        riskReductionScore = result.success ? 25 : 0;
        break;
      case "Pipeline":
        agent = "Pipeline";
        approvalRequired = false;
        logs.push({
          timestamp: nowIso(),
          step: "Route",
          details: "Classified as Pipeline issue. Routed to Pipeline Agent.",
        });
        apiSampleRequest = event.finding;
        result = await pipelineRemediationService.remediatePipeline(event.finding);
        riskReductionScore = result.success ? 20 : 0;
        break;
      case "CSPM":
        agent = "Cloud";
        approvalRequired = true;
        logs.push({
          timestamp: nowIso(),
          step: "Route",
          details: "Classified as CSPM alert. Routed to Cloud Remediation Agent.",
        });
        apiSampleRequest = event.finding;
        result = await cloudRemediationService.remediate(event.finding);
        riskReductionScore = result.success ? 25 : 0;
        break;
    }
    const approveDecision = approvalRequired ? "Human-in-the-Loop (simulated approval)" : "Auto-remediation";
    if (approvalRequired) {
      humanApprovalSimulated = true;
      logs.push({
        timestamp: nowIso(),
        step: "Approval",
        details: "Simulated human reviewer approved remediation.",
        decisionPoint: "Approval required"
      });
      approved = true;
      withApproval++;
    } else {
      logs.push({
        timestamp: nowIso(),
        step: "Approval",
        details: "Auto-remediation: Proceeding without approval.",
        decisionPoint: "Auto-remediation"
      });
      auto++;
    }

    // Step 3: Agent executes and returns a result
    const completedTime = nowIso();
    apiSampleResponse = result;
    applied = approved && !!result.success;
    logs.push({
      timestamp: nowIso(),
      step: "Execution",
      details: `Agent ${agent} executed fix. Success: ${!!result.success}`,
      sampleResponse: result
    });

    // Step 4: Fix application and audit log
    if (applied) {
      logs.push({
        timestamp: nowIso(),
        step: "Fix Application",
        details: `Fix applied for ${agent} agent.`,
      });
    } else {
      logs.push({
        timestamp: nowIso(),
        step: "Fix Skipped",
        details: `Fix not applied for ${agent} agent due to previous step failure.`,
      });
    }
    // Record agent result
    agentResults.push({
      agent,
      proposedFix: result?.suggestedPatch || result?.updatedConfig || result?.remediation?.code || "",
      confidence: result?.success ? 0.95 : 0.5,
      explanation: result.explanation,
      rollback: result?.rollback?.code || undefined,
      approvalRequired,
      approved,
      applied,
      apiSampleRequest,
      apiSampleResponse,
      timeReceived: new Date(start).toISOString(),
      timeCompleted: completedTime,
      riskReductionScore,
      humanApprovalSimulated
    });
    received++;
    mttr += (Date.now() - start) / 1000;
    totalReduction += riskReductionScore;
  }

  // Step 5: Final summary
  const report: OrchestrationFinalReport = {
    issuesReceived: received,
    issuesFixedAuto: auto,
    issuesFixedWithApproval: withApproval,
    mttrSeconds: received ? Math.round(mttr / received) : 0,
    riskReduction: totalReduction,
    agentResults,
    logs,
  };
  return report;
}
