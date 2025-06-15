
type ContextGraphMetadata = {
  issueId: string;
  appId?: string;
  applicationName?: string;
  owner?: {
    name: string;
    email: string;
    team: string;
  };
  ciJobs: {
    jobName: string;
    status: string;
    url: string;
  }[];
  iacResources: string[];
  runtimeLinks: string[];
  cloudResources: {
    resourceType: string;
    resourceId: string;
    region?: string;
    link?: string;
  }[];
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry = {
  fetchedAt: number;
  data: ContextGraphMetadata;
};

const contextCache = new Map<string, CacheEntry>();

// Simulate actual REST API call (replace with real fetch!)
async function fetchContextGraphViaREST(issueId: string): Promise<ContextGraphMetadata> {
  // Here you would use fetch or axios, etc.
  // For this simulation, we'll bake in a stubbed response.
  await new Promise((r) => setTimeout(r, 200));
  return {
    issueId,
    appId: "app-123",
    applicationName: "SampleApp",
    owner: {
      name: "Jane Doe",
      email: "jane.doe@example.com",
      team: "App Team"
    },
    ciJobs: [
      { jobName: "CI Build", status: "success", url: "https://ci.example.com/job/ci-build" },
      { jobName: "Deploy", status: "pending", url: "https://ci.example.com/job/deploy" }
    ],
    iacResources: ["terraform.aws_s3_bucket.public_data"],
    runtimeLinks: ["service/runtime-logs/123"],
    cloudResources: [
      { resourceType: "AWS::S3::Bucket", resourceId: "public_data", region: "us-east-1", link: "https://console.aws.amazon.com/s3/buckets/public_data" }
    ]
  };
}

export async function getContext(issueId: string): Promise<ContextGraphMetadata> {
  const now = Date.now();
  const cached = contextCache.get(issueId);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const result = await fetchContextGraphViaREST(issueId);
  contextCache.set(issueId, { fetchedAt: now, data: result });
  return result;
}
