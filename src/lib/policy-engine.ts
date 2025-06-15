
export type PolicyDecision = {
  autoRemediate: boolean;
  requiresApproval: boolean;
  policyId: string;
};

export function evaluatePolicy(issue: { severity: string, source: string }): PolicyDecision {
  if (issue.severity === "Critical") {
    return { autoRemediate: false, requiresApproval: true, policyId: "manual-critical" };  
  }

  if (issue.source === "SAST" || issue.source === "Pipeline") {
    return { autoRemediate: true, requiresApproval: false, policyId: "auto-safe-code" };
  }

  return { autoRemediate: false, requiresApproval: true, policyId: "default-approval" };
}
