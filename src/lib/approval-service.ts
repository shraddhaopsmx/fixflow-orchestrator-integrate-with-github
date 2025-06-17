
import { OpsMxIssue, ApprovalRequest, RejectionRequest, AuditLogEntry } from "@/types/opsmx";
import { issueStore } from "./issue-store";
import { assignmentService } from "./assignment-service";

class ApprovalService {
  private listeners: Array<() => void> = [];

  approveIssue(request: ApprovalRequest): boolean {
    const { issueId, approverId, comment } = request;
    
    const issue = issueStore.getIssue(issueId);
    if (!issue) {
      console.error(`[ApprovalService] Issue ${issueId} not found`);
      return false;
    }

    if (issue.status !== 'waiting_for_approval') {
      console.error(`[ApprovalService] Issue ${issueId} is not waiting for approval (current status: ${issue.status})`);
      return false;
    }

    // Check basic permission (could be enhanced with role-based access)
    if (!this.hasApprovalPermission(approverId)) {
      console.error(`[ApprovalService] User ${approverId} does not have approval permissions`);
      return false;
    }

    const timestamp = new Date().toISOString();
    
    const updated = issueStore.updateIssue(issueId, {
      status: 'approved',
      approvalData: {
        ...issue.approvalData,
        approverId,
        approvedAt: timestamp,
        approvalComment: comment
      }
    });

    if (updated) {
      // Log approval in audit trail
      assignmentService.updateIssueStatus(issueId, 'approved', approverId);
      
      console.log(`[ApprovalService] Issue ${issueId} approved by ${approverId}`);
      this.notifyListeners();
      return true;
    }

    return false;
  }

  rejectIssue(request: RejectionRequest): boolean {
    const { issueId, approverId, reason } = request;
    
    const issue = issueStore.getIssue(issueId);
    if (!issue) {
      console.error(`[ApprovalService] Issue ${issueId} not found`);
      return false;
    }

    if (issue.status !== 'waiting_for_approval') {
      console.error(`[ApprovalService] Issue ${issueId} is not waiting for approval (current status: ${issue.status})`);
      return false;
    }

    // Check basic permission
    if (!this.hasApprovalPermission(approverId)) {
      console.error(`[ApprovalService] User ${approverId} does not have approval permissions`);
      return false;
    }

    const timestamp = new Date().toISOString();
    
    const updated = issueStore.updateIssue(issueId, {
      status: 'rejected',
      approvalData: {
        ...issue.approvalData,
        approverId,
        rejectedAt: timestamp,
        rejectionReason: reason
      }
    });

    if (updated) {
      // Log rejection in audit trail
      assignmentService.updateIssueStatus(issueId, 'rejected', approverId);
      
      console.log(`[ApprovalService] Issue ${issueId} rejected by ${approverId}: ${reason}`);
      this.notifyListeners();
      return true;
    }

    return false;
  }

  getIssuesWaitingForApproval(): OpsMxIssue[] {
    return issueStore.getIssuesByStatus('waiting_for_approval');
  }

  private hasApprovalPermission(userId: string): boolean {
    // Basic permission check - in a real implementation this would check
    // against a proper role-based access control system
    return userId && userId.length > 0;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('[ApprovalService] Error in listener:', error);
      }
    });
  }

  getStats() {
    const waitingIssues = this.getIssuesWaitingForApproval();
    const approvedIssues = issueStore.getIssuesByStatus('approved');
    const rejectedIssues = issueStore.getIssuesByStatus('rejected');

    return {
      waitingForApproval: waitingIssues.length,
      approved: approvedIssues.length,
      rejected: rejectedIssues.length,
      totalProcessed: approvedIssues.length + rejectedIssues.length
    };
  }

  clear(): void {
    // Clear approval data for all issues
    const allIssues = issueStore.getAllIssues();
    allIssues.forEach(issue => {
      if (issue.approvalData) {
        issueStore.updateIssue(issue.issueId, {
          approvalData: undefined
        });
      }
    });
    
    this.notifyListeners();
    console.log('[ApprovalService] Cleared all approval data');
  }
}

export const approvalService = new ApprovalService();
