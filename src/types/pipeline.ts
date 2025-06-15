
export interface PipelineInput {
  filePath: string;
  config: string;
  pipelineType: 'github-actions' | 'jenkins';
  metadata: {
    repository?: string;
    branch?: string;
    framework?: string;
  };
}

export interface PipelineRemediationResult {
  success: boolean;
  updatedConfig?: string;
  jsonPatch?: PipelinePatch[];
  explanation: string;
  appliedRules: string[];
  insertedSteps: string[];
  error?: string;
}

export interface PipelinePatch {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  value?: any;
  from?: string;
}

export interface PipelineRule {
  id: string;
  name: string;
  pipelineType: 'github-actions' | 'jenkins' | 'both';
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  pattern: RegExp;
  fix: (config: string, match: RegExpMatchArray) => {
    updatedConfig: string;
    patches: PipelinePatch[];
    explanation: string;
    insertedSteps?: string[];
  };
}

export interface PipelineTest {
  name: string;
  input: PipelineInput;
  expectedOutput: Partial<PipelineRemediationResult>;
}
