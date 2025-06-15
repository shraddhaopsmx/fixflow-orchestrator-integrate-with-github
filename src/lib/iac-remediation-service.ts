
import { IaCInput, IaCRemediationResult, RemediationRule } from '@/types/iac';
import { allRules } from './iac-rules';

export class IaCRemediationService {
  private rules: RemediationRule[];

  constructor(customRules: RemediationRule[] = []) {
    this.rules = [...allRules, ...customRules];
  }

  async remediateConfiguration(input: IaCInput): Promise<IaCRemediationResult> {
    try {
      console.log(`Processing ${input.issueMetadata.category} configuration for: ${input.issueMetadata.title}`);
      
      // Find applicable rules based on category and content
      const applicableRules = this.rules.filter(rule => 
        rule.category === input.issueMetadata.category &&
        rule.pattern.test(input.config)
      );

      if (applicableRules.length === 0) {
        return {
          success: false,
          explanation: `No remediation rules found for issue: ${input.issueMetadata.title}`,
          appliedRules: [],
          error: 'No applicable rules found'
        };
      }

      let updatedConfig = input.config;
      const allPatches: any[] = [];
      const appliedRuleIds: string[] = [];
      const explanations: string[] = [];

      // Apply each applicable rule
      for (const rule of applicableRules) {
        const matches = Array.from(input.config.matchAll(rule.pattern));
        
        for (const match of matches) {
          try {
            const result = rule.fix(updatedConfig, match);
            updatedConfig = result.updatedConfig;
            allPatches.push(...result.patches);
            explanations.push(`${rule.name}: ${result.explanation}`);
            appliedRuleIds.push(rule.id);
          } catch (error) {
            console.error(`Error applying rule ${rule.id}:`, error);
          }
        }
      }

      if (appliedRuleIds.length === 0) {
        return {
          success: false,
          explanation: 'No rules could be successfully applied',
          appliedRules: [],
          error: 'Rule application failed'
        };
      }

      return {
        success: true,
        updatedConfig,
        jsonPatch: allPatches,
        explanation: explanations.join('\n\n'),
        appliedRules: appliedRuleIds
      };

    } catch (error) {
      console.error('IaC Remediation failed:', error);
      return {
        success: false,
        explanation: 'Internal error during remediation',
        appliedRules: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getAvailableRules(category?: 'terraform' | 'kubernetes'): RemediationRule[] {
    return category 
      ? this.rules.filter(rule => rule.category === category)
      : this.rules;
  }

  addCustomRule(rule: RemediationRule): void {
    this.rules.push(rule);
  }
}

export const iacRemediationService = new IaCRemediationService();
