
import { OpsMxApiResponse, OpsMxIssue } from "@/types/opsmx";

class OpsMxApiClient {
  private baseUrl: string;
  private retryCount = 0;
  private maxRetries = 3;

  constructor(baseUrl: string = 'https://api.opsmx.com') {
    this.baseUrl = baseUrl;
  }

  async fetchRiskAssessmentIssues(): Promise<OpsMxIssue[]> {
    try {
      console.log('[OpsMxApiClient] Fetching risk assessment issues...');
      
      // Simulate API call with mock data for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockResponse: OpsMxApiResponse = {
        issues: [
          {
            issueId: `opsmx-${crypto.randomUUID()}`,
            type: 'SAST',
            severity: 'High',
            riskScore: 0.85,
            sourceLocation: {
              repository: 'https://github.com/example/security-app',
              filePath: 'src/auth/login.js',
              branch: 'main'
            },
            status: 'open',
            description: 'SQL injection vulnerability detected in login function',
            timestamp: new Date().toISOString()
          },
          {
            issueId: `opsmx-${crypto.randomUUID()}`,
            type: 'CSPM',
            severity: 'Critical',
            riskScore: 0.95,
            sourceLocation: {
              resourceId: 's3-bucket-public-access',
              region: 'us-west-2'
            },
            status: 'open',
            description: 'S3 bucket with public read access detected',
            timestamp: new Date().toISOString()
          },
          {
            issueId: `opsmx-${crypto.randomUUID()}`,
            type: 'SCA',
            severity: 'Medium',
            riskScore: 0.65,
            sourceLocation: {
              repository: 'https://github.com/example/frontend-app',
              filePath: 'package.json',
              branch: 'develop'
            },
            status: 'open',
            description: 'Vulnerable dependency lodash@4.17.20 detected',
            timestamp: new Date().toISOString()
          }
        ],
        totalCount: 3,
        lastUpdated: new Date().toISOString()
      };

      this.retryCount = 0; // Reset on success
      console.log(`[OpsMxApiClient] Fetched ${mockResponse.issues.length} issues`);
      return mockResponse.issues;
      
    } catch (error: any) {
      console.error('[OpsMxApiClient] Error fetching issues:', error.message);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`[OpsMxApiClient] Retrying... Attempt ${this.retryCount}/${this.maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
        return this.fetchRiskAssessmentIssues();
      }
      
      throw error;
    }
  }
}

export const opsMxApiClient = new OpsMxApiClient();
