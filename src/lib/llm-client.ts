
import { LLMResponse, IssueMetadata, IssueType } from "@/types/workflow";

const promptTemplates = {
    SCA: (context: any, description: string) => `Context: ${JSON.stringify(context, null, 2)}\n\nIssue: A vulnerable JS dependency was found. ${description}. Propose a secure upgrade in package.json and generate a conventional commit style PR body.`,
    IaC: (context: any, description: string) => `Context: ${JSON.stringify(context, null, 2)}\n\nIssue: An IaC misconfiguration was found. ${description}. Propose a fix for the configuration file.`,
    Cloud: (context: any, description:string) => `Context: ${JSON.stringify(context, null, 2)}\n\nIssue: A cloud resource misconfiguration was found. ${description}. Propose a fix as a CLI command.`,
    Pipeline: (context: any, description:string) => `Context: ${JSON.stringify(context, null, 2)}\n\nIssue: A CI/CD pipeline security risk was found. ${description}. Propose a fix for the pipeline configuration file.`,
    Runtime: (context: any, description:string) => `Context: ${JSON.stringify(context, null, 2)}\n\nIssue: A runtime security alert was triggered. ${description}. Propose a single remediation action keyword (e.g. 'isolate-pod', 'block-ip').`,
};

const mapIssueTypeToPromptType = (issue: IssueMetadata): keyof typeof promptTemplates => {
    switch (issue.type) {
        case 'SCA':
        case 'SAST':
            return 'SCA';
        case 'CSPM':
            return issue.location.filePath ? 'IaC' : 'Cloud';
        case 'PIPELINE':
            return 'Pipeline';
        case 'RUNTIME':
            return 'Runtime';
        default:
            return 'SCA';
    }
}

export const llmClient = {
  generateFix: async (prompt: string): Promise<LLMResponse> => {
    console.log('[LLMClient] Generating fix for prompt:', prompt);
    await new Promise(resolve => setTimeout(resolve, 1200)); // simulate LLM processing time

    const confidence = 75 + Math.random() * 25; // Random confidence between 75 and 100
    
    return {
      confidence,
      proposedFix: `--- a/package.json
+++ b/package.json
@@ -5,7 +5,7 @@
   "dependencies": {
     "react": "^18.3.1",
-    "lodash": "4.17.20"
+    "lodash": "4.17.21"
   }
 }`,
      rationale: `The version of 'lodash' was outdated and had a known vulnerability (CVE-2021-41720). I have updated it to the latest patched version. The confidence score is high as this is a simple dependency bump.`,
    };
  },
  getPrompt: (issue: IssueMetadata, context: any): string => {
    const promptType = mapIssueTypeToPromptType(issue);
    const template = promptTemplates[promptType];
    return template(context, issue.description);
  }
};
