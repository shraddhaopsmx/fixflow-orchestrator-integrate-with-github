
// Simulated rich test data for orchestration lifecycle
import { codeTestCases } from "@/lib/code-test-data";
import { allTestCases } from "@/lib/iac-test-data";
import { allPipelineTestCases } from "@/lib/pipeline-test-data";
import { cloudTestCases } from "@/lib/cloud-test-data";

export const orchestrationTestInputs = [
  {
    source: "SAST",
    finding: codeTestCases.find(c => c.findingId === 'CODE-JS-001')
  },
  {
    source: "IaC",
    finding: allTestCases[0].input // public S3 bucket with no encryption
  },
  {
    source: "Pipeline",
    finding: allPipelineTestCases[0].input // GitHub Actions pipeline skips security checks
  },
  {
    source: "CSPM",
    finding: cloudTestCases.find(f => f.description.toLowerCase().includes('unrestricted port 22'))
  }
];
