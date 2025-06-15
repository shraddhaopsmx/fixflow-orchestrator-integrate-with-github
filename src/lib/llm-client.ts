
export type LLMPromptTemplate = (context: any) => string;

export type LLMResponse = {
  patch: string;
  confidence: number;
  rationale: string;
};

// Mock prompt templates for now
const promptTemplates: Record<string, LLMPromptTemplate> = {
  code: (context) => `Here’s a vulnerable dependency '${context.vulnerability.name}' in ${context.filePath}. The current version is ${context.vulnerability.version}. Propose a secure version upgrade as a diff patch.`,
  iac: (context) => `The following Terraform resource in ${context.filePath} is misconfigured: ${context.issue.title}. \n\n${context.config}\n\nPropose a fix as a diff patch.`,
  cloud: (context) => `A cloud resource ${context.resourceId} has a finding: ${context.description}. Propose a remediation via AWS CLI commands.`,
  pipeline: (context) => `The CI/CD pipeline at ${context.filePath} has a security issue: ${context.issue.title}. Propose a fix for the pipeline configuration.`,
};

class LLMClient {
  // In a real app, this would be an API key from a secure store
  private apiKey: string;

  constructor(apiKey: string = "mock-api-key") {
    this.apiKey = apiKey;
    if (apiKey === "mock-api-key") {
      console.warn("LLMClient is using a mock API key.");
    }
  }

  /**
   * Generates a remediation fix using an LLM.
   * @param domain The domain of the issue (e.g., 'code', 'iac').
   * @param context The detailed context of the issue.
   * @returns A promise that resolves to the LLM's response.
   */
  async generateFix(domain: "code" | "iac" | "cloud" | "pipeline", context: any): Promise<LLMResponse> {
    const promptTemplate = promptTemplates[domain];
    if (!promptTemplate) {
      throw new Error(`No prompt template for domain: ${domain}`);
    }

    const prompt = promptTemplate(context);
    console.log("--- LLM PROMPT ---", prompt);
    
    // Log the prompt for tuning/auditing
    // In a real system, this would go to a secure logging service.
    this.logPrompt(prompt, context);

    // --- MOCK LLM API CALL ---
    // Simulating a network call to an LLM service like OpenAI.
    await new Promise(res => setTimeout(res, 800));
    
    const mockResponse = this.getMockResponse(domain, context);
    console.log("--- LLM RESPONSE ---", mockResponse);

    return mockResponse;
  }

  private logPrompt(prompt: string, context: any) {
    // In a real app, send this to a secure, queryable datastore.
    console.log("Logging LLM interaction:", {
      timestamp: new Date().toISOString(),
      prompt,
      context,
    });
  }

  private getMockResponse(domain: string, context: any): LLMResponse {
    const confidence = Math.random() * 0.4 + 0.6; // Random confidence between 60% and 100%
    switch (domain) {
      case 'code':
        return {
          patch: `--- a/package.json\n+++ b/package.json\n@@ -10,7 +10,7 @@\n   "dependencies": {\n-    "express": "4.17.1",\n+    "express": "4.18.2",\n     "lodash": "4.17.21"\n   }\n }`,
          confidence,
          rationale: "Upgrading express from 4.17.1 to 4.18.2 resolves known vulnerabilities.",
        };
      case 'iac':
        return {
          patch: `--- a/main.tf\n+++ b/main.tf\n@@ -5,6 +5,6 @@\n resource "aws_s3_bucket" "b" {\n   bucket = "my-tf-test-bucket"\n-  acl    = "public-read"\n+  acl    = "private"\n }`,
          confidence,
          rationale: "Changed S3 bucket ACL from public-read to private to restrict public access.",
        };
      default:
        return {
          patch: "# Mock patch content",
          confidence,
          rationale: "This is a mock rationale for the generated fix.",
        };
    }
  }
}

export const llmClient = new LLMClient();
