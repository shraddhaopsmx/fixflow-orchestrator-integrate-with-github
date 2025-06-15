
import { CSPMFinding, RemediationPlan, CloudRemediationRule } from '@/types/cloud';
import { allCloudRules } from './cloud-remediation-rules';

export class CloudRemediationService {
  private rules: CloudRemediationRule[];

  constructor() {
    this.rules = allCloudRules;
  }

  async remediate(finding: CSPMFinding): Promise<RemediationPlan> {
    const rule = this.rules.find(r => r.issueType === finding.resourceType && r.appliesTo(finding));

    if (!rule) {
      return {
        success: false,
        explanation: 'No remediation rule found for this specific issue.',
        remediation: { type: 'AWS_CLI', code: '# No action taken', description: '' },
        error: `No applicable rule for finding ${finding.findingId}`
      };
    }

    try {
      const plan = rule.generatePlan(finding);
      console.log(`Generated plan for ${finding.findingId}`, plan);
      return plan;
    } catch (error) {
      console.error('Cloud Remediation failed:', error);
      return {
        success: false,
        explanation: 'An internal error occurred during remediation plan generation.',
        remediation: { type: 'AWS_CLI', code: '# Error', description: ''},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const cloudRemediationService = new CloudRemediationService();
