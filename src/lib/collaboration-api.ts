
import { OpsMxIssue } from '@/types/opsmx';
import { issueStore } from './issue-store';
import { assignmentService } from './assignment-service';
import { approvalService } from './approval-service';

export interface DashboardSummary {
  assignedToMe: number;
  waitingForApproval: number;
  approvedLast7Days: number;
  unassignedHighRisk: number;
}

export interface IssueComment {
  id: string;
  issueId: string;
  userId: string;
  userEmail: string;
  comment: string;
  timestamp: string;
  type: 'comment' | 'status_change' | 'assignment' | 'approval' | 'rejection';
}

export interface IssueHistoryEntry {
  id: string;
  issueId: string;
  timestamp: string;
  action: string;
  actor: string;
  fromStatus?: string;
  toStatus?: string;
  details: Record<string, any>;
}

export interface FullIssueDetails extends OpsMxIssue {
  comments: IssueComment[];
  history: IssueHistoryEntry[];
  remediationStatus?: {
    stage: 'pending' | 'analyzing' | 'generating_fix' | 'applying' | 'completed' | 'failed';
    progress: number;
    lastUpdate: string;
    error?: string;
  };
}

class CollaborationAPI {
  private comments = new Map<string, IssueComment[]>();
  private commentIdCounter = 1;

  getDashboardSummary(userId: string): DashboardSummary {
    const allIssues = issueStore.getAllIssues();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const assignedToMe = allIssues.filter(issue => 
      issue.assignedTo === userId && 
      (issue.status === 'assigned' || issue.status === 'in_progress')
    ).length;

    const waitingForApproval = allIssues.filter(issue => 
      issue.status === 'waiting_for_approval'
    ).length;

    const approvedLast7Days = allIssues.filter(issue => 
      issue.status === 'approved' && 
      issue.approvalData?.approvedAt && 
      issue.approvalData.approvedAt >= sevenDaysAgo
    ).length;

    const unassignedHighRisk = allIssues.filter(issue => 
      issue.status === 'open' && 
      !issue.assignedTo && 
      (issue.severity === 'Critical' || issue.severity === 'High')
    ).length;

    return {
      assignedToMe,
      waitingForApproval,
      approvedLast7Days,
      unassignedHighRisk
    };
  }

  getIssueDetails(issueId: string): FullIssueDetails | null {
    const issue = issueStore.getIssue(issueId);
    if (!issue) {
      return null;
    }

    const comments = this.getIssueComments(issueId);
    const history = this.getIssueHistory(issueId);
    
    // Mock remediation status based on issue status
    const remediationStatus = this.getRemediationStatus(issue);

    return {
      ...issue,
      comments,
      history,
      remediationStatus
    };
  }

  getIssueComments(issueId: string): IssueComment[] {
    return this.comments.get(issueId) || [];
  }

  addComment(issueId: string, userId: string, userEmail: string, comment: string, type: IssueComment['type'] = 'comment'): IssueComment {
    const newComment: IssueComment = {
      id: `comment-${this.commentIdCounter++}`,
      issueId,
      userId,
      userEmail,
      comment,
      timestamp: new Date().toISOString(),
      type
    };

    const existingComments = this.comments.get(issueId) || [];
    this.comments.set(issueId, [...existingComments, newComment]);

    console.log(`[CollaborationAPI] Added comment to issue ${issueId} by ${userEmail}`);
    return newComment;
  }

  getIssueHistory(issueId: string): IssueHistoryEntry[] {
    const auditLog = assignmentService.getAuditLog(issueId);
    
    return auditLog.map((entry, index) => ({
      id: `history-${issueId}-${index}`,
      issueId,
      timestamp: entry.timestamp,
      action: entry.action,
      actor: entry.actor,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      details: entry.details
    }));
  }

  private getRemediationStatus(issue: OpsMxIssue) {
    switch (issue.status) {
      case 'open':
        return {
          stage: 'pending' as const,
          progress: 0,
          lastUpdate: issue.timestamp
        };
      case 'assigned':
        return {
          stage: 'analyzing' as const,
          progress: 25,
          lastUpdate: issue.assignedAt || issue.timestamp
        };
      case 'in_progress':
        return {
          stage: 'generating_fix' as const,
          progress: 50,
          lastUpdate: new Date().toISOString()
        };
      case 'waiting_for_approval':
        return {
          stage: 'applying' as const,
          progress: 75,
          lastUpdate: new Date().toISOString()
        };
      case 'approved':
      case 'resolved':
      case 'mitigated':
        return {
          stage: 'completed' as const,
          progress: 100,
          lastUpdate: issue.approvalData?.approvedAt || new Date().toISOString()
        };
      case 'rejected':
        return {
          stage: 'failed' as const,
          progress: 0,
          lastUpdate: issue.approvalData?.rejectedAt || new Date().toISOString(),
          error: issue.approvalData?.rejectionReason || 'Issue was rejected'
        };
      default:
        return {
          stage: 'pending' as const,
          progress: 0,
          lastUpdate: issue.timestamp
        };
    }
  }

  clear(): void {
    this.comments.clear();
    this.commentIdCounter = 1;
    console.log('[CollaborationAPI] Cleared all comments and history');
  }
}

export const collaborationAPI = new CollaborationAPI();
