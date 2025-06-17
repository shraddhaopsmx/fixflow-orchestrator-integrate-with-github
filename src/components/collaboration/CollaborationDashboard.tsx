
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCollaboration } from '@/hooks/useCollaboration';
import { DashboardSummary, FullIssueDetails } from '@/lib/collaboration-api';
import { Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export const CollaborationDashboard = () => {
  const { getDashboardSummary, getIssueDetails, isLoading } = useCollaboration();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<FullIssueDetails | null>(null);

  // Mock current user
  const currentUserId = 'user@example.com';

  useEffect(() => {
    loadDashboardSummary();
  }, []);

  const loadDashboardSummary = async () => {
    try {
      const data = await getDashboardSummary(currentUserId);
      setSummary(data);
    } catch (error) {
      console.error('Failed to load dashboard summary:', error);
    }
  };

  const loadIssueDetails = async (issueId: string) => {
    try {
      const details = await getIssueDetails(issueId);
      setSelectedIssue(details);
    } catch (error) {
      console.error('Failed to load issue details:', error);
    }
  };

  if (!summary) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading collaboration dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned to Me</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.assignedToMe}</div>
            <p className="text-xs text-muted-foreground">Active assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.waitingForApproval}</div>
            <p className="text-xs text-muted-foreground">Pending human review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved (7d)</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.approvedLast7Days}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Unassigned</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.unassignedHighRisk}</div>
            <p className="text-xs text-muted-foreground">Needs immediate attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Endpoints Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Available Endpoints:</h4>
            <div className="space-y-1 text-xs text-muted-foreground font-mono bg-gray-50 p-3 rounded">
              <div>GET /dashboard/summary - Returns dashboard counts</div>
              <div>GET /issues/:issueId - Returns full issue details</div>
              <div>GET /issues/:issueId/comments - Returns issue comments</div>
              <div>GET /issues/:issueId/history - Returns issue history</div>
              <div>POST /issues/:issueId/comments - Add new comment</div>
            </div>
          </div>

          <Button 
            onClick={loadDashboardSummary}
            disabled={isLoading}
            size="sm"
          >
            Refresh Dashboard Data
          </Button>
        </CardContent>
      </Card>

      {selectedIssue && (
        <Card>
          <CardHeader>
            <CardTitle>Issue Details: {selectedIssue.issueId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedIssue.type}</Badge>
                <Badge variant="outline">{selectedIssue.severity}</Badge>
                <Badge variant="outline">{selectedIssue.status}</Badge>
              </div>
              <p className="text-sm">{selectedIssue.description}</p>
              <div className="text-xs text-muted-foreground">
                Remediation Status: {selectedIssue.remediationStatus?.stage} 
                ({selectedIssue.remediationStatus?.progress}%)
              </div>
              <div className="text-xs">
                Comments: {selectedIssue.comments.length} | 
                History entries: {selectedIssue.history.length}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
