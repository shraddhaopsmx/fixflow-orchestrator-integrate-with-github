
export interface IaCInput {
  filePath: string;
  config: string;
  issueMetadata: {
    issueId: string;
    title: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    description: string;
    category: 'terraform' | 'kubernetes';
    ruleId: string;
  };
}

export interface IaCRemediationResult {
  success: boolean;
  updatedConfig?: string;
  jsonPatch?: JsonPatch[];
  explanation: string;
  appliedRules: string[];
  error?: string;
}

export interface JsonPatch {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  value?: any;
  from?: string;
}

export interface RemediationRule {
  id: string;
  name: string;
  category: 'terraform' | 'kubernetes';
  pattern: RegExp;
  fix: (config: string, match: RegExpMatchArray) => {
    updatedConfig: string;
    patches: JsonPatch[];
    explanation: string;
  };
}

export interface PolicyTest {
  name: string;
  input: IaCInput;
  expectedOutput: Partial<IaCRemediationResult>;
}
