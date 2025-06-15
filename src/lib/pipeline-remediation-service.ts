
import { PipelineInput, PipelineRemediationResult, PipelineRule } from '@/types/pipeline';
import { allPipelineRules } from './pipeline-rules';

export class PipelineRemediationService {
  private rules: PipelineRule[];

  constructor(customRules: PipelineRule[] = []) {
    this.rules = [...allPipelineRules, ...customRules];
  }

  async remediatePipeline(input: PipelineInput): Promise<PipelineRemediationResult> {
    try {
      console.log(`Processing ${input.pipelineType} pipeline: ${input.filePath}`);
      
      // Find applicable rules based on pipeline type
      const applicableRules = this.rules.filter(rule => 
        rule.pipelineType === input.pipelineType || rule.pipelineType === 'both'
      );

      if (applicableRules.length === 0) {
        return {
          success: false,
          explanation: `No remediation rules found for ${input.pipelineType} pipelines`,
          appliedRules: [],
          insertedSteps: [],
          error: 'No applicable rules found'
        };
      }

      let updatedConfig = input.config;
      const allPatches: any[] = [];
      const appliedRuleIds: string[] = [];
      const explanations: string[] = [];
      const insertedSteps: string[] = [];

      // Apply each applicable rule that matches the content
      for (const rule of applicableRules) {
        const matches = Array.from(input.config.matchAll(rule.pattern));
        
        for (const match of matches) {
          try {
            const result = rule.fix(updatedConfig, match);
            updatedConfig = result.updatedConfig;
            allPatches.push(...result.patches);
            explanations.push(`${rule.name} (${rule.riskLevel}): ${result.explanation}`);
            appliedRuleIds.push(rule.id);
            
            if (result.insertedSteps) {
              insertedSteps.push(...result.insertedSteps);
            }
          } catch (error) {
            console.error(`Error applying rule ${rule.id}:`, error);
          }
        }
      }

      if (appliedRuleIds.length === 0) {
        return {
          success: true,
          updatedConfig: input.config,
          explanation: 'Pipeline configuration appears secure - no issues found.',
          appliedRules: [],
          insertedSteps: []
        };
      }

      return {
        success: true,
        updatedConfig,
        jsonPatch: allPatches,
        explanation: explanations.join('\n\n'),
        appliedRules: appliedRuleIds,
        insertedSteps
      };

    } catch (error) {
      console.error('Pipeline Remediation failed:', error);
      return {
        success: false,
        explanation: 'Internal error during pipeline remediation',
        appliedRules: [],
        insertedSteps: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getAvailableRules(pipelineType?: 'github-actions' | 'jenkins'): PipelineRule[] {
    return pipelineType 
      ? this.rules.filter(rule => rule.pipelineType === pipelineType || rule.pipelineType === 'both')
      : this.rules;
  }

  addCustomRule(rule: PipelineRule): void {
    this.rules.push(rule);
  }

  getRulesByRiskLevel(riskLevel: 'Critical' | 'High' | 'Medium' | 'Low'): PipelineRule[] {
    return this.rules.filter(rule => rule.riskLevel === riskLevel);
  }
}

export const pipelineRemediationService = new PipelineRemediationService();
