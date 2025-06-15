
export type PolicyDecision = {
  autoRemediate: boolean;
  requiresApproval: boolean;
  policyId: string;
};

export type PolicyRule = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    severity?: ('Critical' | 'High' | 'Medium' | 'Low')[];
    source?: ('SAST' | 'IaC' | 'Pipeline' | 'CSPM')[];
  };
  decision: {
    autoRemediate: boolean;
    requiresApproval: boolean;
  };
};

// In a real app, this would be stored in a database or config file
const policies: PolicyRule[] = [
  {
    id: "manual-critical",
    name: "Manual Review for Critical Severity",
    description: "All critical severity issues require manual approval before remediation.",
    enabled: true,
    conditions: {
      severity: ["Critical"],
    },
    decision: {
      autoRemediate: false,
      requiresApproval: true,
    },
  },
  {
    id: "auto-safe-code",
    name: "Auto-remediate Safe Code Scans",
    description: "Automatically remediate non-critical issues found by SAST and Pipeline scanners.",
    enabled: true,
    conditions: {
      source: ["SAST", "Pipeline"],
    },
    decision: {
      autoRemediate: true,
      requiresApproval: false,
    },
  },
  {
    id: "default-approval",
    name: "Default to Manual Approval",
    description: "All other issues require manual approval by default.",
    enabled: true,
    conditions: {}, // Empty conditions to act as a catch-all
    decision: {
      autoRemediate: false,
      requiresApproval: true,
    },
  },
];

export function getPolicies(): PolicyRule[] {
  return policies;
}

export function evaluatePolicy(issue: { severity: string, source: string }): PolicyDecision {
  const applicablePolicy = policies.find(policy => {
    if (!policy.enabled) return false;

    const { conditions } = policy;
    // If a condition is undefined or empty, it's considered a match for that category.
    const severityMatch = !conditions.severity || conditions.severity.length === 0 || conditions.severity.includes(issue.severity as any);
    const sourceMatch = !conditions.source || conditions.source.length === 0 || conditions.source.includes(issue.source as any);

    return severityMatch && sourceMatch;
  });

  if (applicablePolicy) {
    return { ...applicablePolicy.decision, policyId: applicablePolicy.id };
  }

  // Fallback if no policy matches (should be caught by the default policy)
  return { autoRemediate: false, requiresApproval: true, policyId: "fallback-default" };
}
