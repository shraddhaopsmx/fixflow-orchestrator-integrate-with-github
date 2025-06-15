
export type ContextGraph = {
  issueId: string;
  linkedApps: string[];
  iacResources?: string[];
  pipelines?: string[];
};

export async function fetchContextGraph(issueId: string): Promise<ContextGraph> {
  // Simulate fetching context graph metadata for the issueId.
  await new Promise((res) => setTimeout(res, 200));
  return {
    issueId,
    linkedApps: ["App1", "App2"],
    iacResources: ["aws_s3_bucket.public_data"],
    pipelines: [".github/workflows/ci.yml"]
  };
}
