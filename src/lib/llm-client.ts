
import { LLMResponse } from "@/types/workflow";

const promptTemplates = {
    SCA: (context: any, description: string) => `Context: ${JSON.stringify(context, null, 2)}\n\nIssue: A vulnerable JS dependency was found. ${description}. Propose a secure upgrade in package.json and generate a conventional commit style PR body.`,
};

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
  getPrompt: (type: 'SCA' | 'IaC' | 'Cloud' | 'Pipeline', context: any, description: string): string => {
    if (type === 'SCA') {
        return promptTemplates.SCA(context, description);
    }
    return `Context: ${JSON.stringify(context, null, 2)}\n\nIssue: ${description}. Propose a fix.`
  }
};

