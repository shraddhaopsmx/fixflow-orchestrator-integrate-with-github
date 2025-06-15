
import { ContextGraphData, IssueMetadata } from "@/types/workflow";

const mockContext: ContextGraphData = {
  application: {
    name: 'Monitored-App-1',
    structure: 'Microservices architecture with React frontend',
  },
  ownership: {
    team: 'Platform Security',
    owner: 'jane.doe@example.com',
  },
  iacReferences: ['s3.tf', 'iam.tf'],
  cicdConfigs: ['.github/workflows/deploy.yml'],
  git: {
    repoUrl: 'https://github.com/example/monitored-app',
    commitHistory: ['feat: add new login page', 'fix: button alignment'],
  },
};

export const contextGraphAPI = {
  fetchEnrichment: async (issue: IssueMetadata): Promise<ContextGraphData> => {
    console.log('[ContextGraphAPI] Fetching enrichment for issue:', issue.id);
    await new Promise(resolve => setTimeout(resolve, 300)); // simulate network delay
    return {
        ...mockContext,
        git: {
            ...mockContext.git,
            repoUrl: issue.location.repository || mockContext.git.repoUrl
        }
    };
  },
};

