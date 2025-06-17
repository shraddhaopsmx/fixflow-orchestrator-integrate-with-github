
import React, { useState } from 'react';
import { OpsMxIssue, ApprovalRequest, RejectionRequest } from '@/types/opsmx';
import { useApproval } from '@/hooks/useApproval';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X } from 'lucide-react';

interface ApprovalDialogProps {
  issue: OpsMxIssue;
  type: 'approve' | 'reject';
  onSubmit: (request: ApprovalRequest | RejectionRequest) => Promise<void>;
  isLoading: boolean;
}

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({ issue, type, onSubmit, isLoading }) => {
  const [comment, setComment] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    const approverId = 'current-user'; // This would come from auth context in real app
    
    if (type === 'approve') {
      await onSubmit({
        issueId: issue.issueId,
        approverId,
        comment
      } as ApprovalRequest);
    } else {
      await onSubmit({
        issueId: issue.issueId,
        approverId,
        reason: comment
      } as RejectionRequest);
    }
    
    setComment('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={type === 'approve' ? 'default' : 'destructive'} 
          size="sm"
          disabled={isLoading}
        >
          {type === 'approve' ? <Check className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}
          {type === 'approve' ? 'Approve' : 'Reject'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'approve' ? 'Approve Issue' : 'Reject Issue'}
          </DialogTitle>
          <DialogDescription>
            {type === 'approve' 
              ? 'Add an optional comment for this approval.'
              : 'Please provide a reason for rejection.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="comment">
              {type === 'approve' ? 'Comment (Optional)' : 'Rejection Reason'}
            </Label>
            <Textarea
              id="comment"
              placeholder={type === 'approve' 
                ? 'Add any additional notes...'
                : 'Explain why this issue is being rejected...'
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required={type === 'reject'}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || (type === 'reject' && !comment.trim())}
              variant={type === 'approve' ? 'default' : 'destructive'}
            >
              {type === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ApprovalWorkflow: React.FC = () => {
  const { waitingIssues, isLoading, approveIssue, rejectIssue, getApprovalStats } = useApproval();
  const stats = getApprovalStats();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Approval Workflow</h2>
        <p className="text-muted-foreground">
          Review and approve or reject issues waiting for human verification.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Waiting for Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waitingForApproval}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProcessed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Issues Waiting for Approval</h3>
        {waitingIssues.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No issues waiting for approval</p>
            </CardContent>
          </Card>
        ) : (
          waitingIssues.map((issue) => (
            <Card key={issue.issueId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{issue.issueId}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getSeverityColor(issue.severity)}>
                      {issue.severity}
                    </Badge>
                    <Badge variant="outline">{issue.type}</Badge>
                  </div>
                </div>
                <CardDescription>{issue.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Risk Score:</strong> {issue.riskScore}
                    </div>
                    <div>
                      <strong>Assigned To:</strong> {issue.assignedTo || 'Unassigned'}
                    </div>
                    {issue.sourceLocation.repository && (
                      <div>
                        <strong>Repository:</strong> {issue.sourceLocation.repository}
                      </div>
                    )}
                    {issue.sourceLocation.filePath && (
                      <div>
                        <strong>File:</strong> {issue.sourceLocation.filePath}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <ApprovalDialog
                      issue={issue}
                      type="reject"
                      onSubmit={rejectIssue}
                      isLoading={isLoading}
                    />
                    <ApprovalDialog
                      issue={issue}
                      type="approve"
                      onSubmit={approveIssue}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
