
export type CodeLanguage = 'JavaScript' | 'Python';

export interface CodeFinding {
  findingId: string;
  filePath: string;
  language: CodeLanguage;
  vulnerability: {
    id: string; // e.g., CWE-79, Snyk-JS-123
    name: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
  };
  snippet: string;
  startLine: number;
  endLine: number;
}

export interface CodeRemediation {
  success: boolean;
  explanation: string;
  suggestedPatch: string;
  githubPr: {
    url: string;
    title: string;
    body: string;
    labels: string[];
  } | null;
  error?: string;
}
