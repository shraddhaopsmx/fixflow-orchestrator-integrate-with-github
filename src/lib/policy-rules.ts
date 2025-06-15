
export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    source: string[];
    severity: string[];
  };
  decision: {
    autoRemediate: boolean;
    requiresApproval: boolean;
  };
}
