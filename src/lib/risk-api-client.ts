
export type RiskIssue = {
  id: string;
  summary: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  location: string;
  source: string; // SAST, IaC, Pipeline, CSPM, etc.
};

export async function fetchPrioritizedRisks(): Promise<RiskIssue[]> {
  // Stub: Simulate an async API call.
  await new Promise((res) => setTimeout(res, 300));
  return [
    {
      id: "risk-1",
      summary: "Stored XSS in user profile",
      severity: "High",
      location: "src/views/Profile.js",
      source: "SAST",
    },
    {
      id: "risk-2",
      summary: "S3 bucket is public",
      severity: "Critical",
      location: "iac/main.tf",
      source: "IaC",
    }
    // ...add more as needed
  ];
}
