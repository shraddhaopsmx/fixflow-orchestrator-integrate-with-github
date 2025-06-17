import { IssueAssignment, AssignmentRequest, AuditLogEntry } from "@/types/opsmx";
import { issueStore } from "./issue-store";

class AssignmentService {
  private assignments = new Map<string, IssueAssignment>();
  private auditLog: AuditLogEntry[] = [];
  private listeners: Array<(assignments: IssueAssignment[]) => void> = [];

  assignIssue(request: AssignmentRequest): boolean {
    const { issueId, assigneeId, assignedBy = 'system' } = request;
    
    const issue = issueStore.getIssue(issueId);
    if (!issue) {
      console.error(`[AssignmentService] Issue ${issueId} not found`);
      return false;
    }

    const assignment: IssueAssignment = {
      issueId,
      assigneeId,
      assignedAt: new Date().toISOString(),
      assignedBy
    };

    this.assignments.set(issueId, assignment);
    
    // Update issue status and assignment
    const updated = issueStore.updateIssue(issueId, {
      status: 'assigned',
      assignedTo: assigneeId,
      assignedAt: assignment.assignedAt
    });

    if (updated) {
      this.addAuditLog({
        timestamp: new Date().toISOString(),
        issueId,
        action: 'assigned',
        actor: assignedBy,
        fromStatus: issue.status,
        toStatus: 'assigned',
        details: { assigneeId }
      });

      console.log(`[AssignmentService] Assigned issue ${issueId} to ${assigneeId}`);
      this.notifyListeners();
      return true;
    }

    return false;
  }

  getAssignedIssues(userId: string): IssueAssignment[] {
    return Array.from(this.assignments.values())
      .filter(assignment => assignment.assigneeId === userId);
  }

  getAssignment(issueId: string): IssueAssignment | undefined {
    return this.assignments.get(issueId);
  }

  getAllAssignments(): IssueAssignment[] {
    return Array.from(this.assignments.values());
  }

  updateIssueStatus(issueId: string, newStatus: string, actor: string = 'system'): boolean {
    const issue = issueStore.getIssue(issueId);
    if (!issue) {
      return false;
    }

    const oldStatus = issue.status;
    const updated = issueStore.updateIssueStatus(issueId, newStatus as any);

    if (updated) {
      this.addAuditLog({
        timestamp: new Date().toISOString(),
        issueId,
        action: 'status_changed',
        actor,
        fromStatus: oldStatus,
        toStatus: newStatus,
        details: {}
      });

      console.log(`[AssignmentService] Updated issue ${issueId} status: ${oldStatus} → ${newStatus}`);
      return true;
    }

    return false;
  }

  private addAuditLog(entry: AuditLogEntry): void {
    this.auditLog.push(entry);
    // Keep only last 1000 entries to prevent memory issues
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  getAuditLog(issueId?: string): AuditLogEntry[] {
    if (issueId) {
      return this.auditLog.filter(entry => entry.issueId === issueId);
    }
    return [...this.auditLog];
  }

  subscribe(listener: (assignments: IssueAssignment[]) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const assignments = this.getAllAssignments();
    this.listeners.forEach(listener => {
      try {
        listener(assignments);
      } catch (error) {
        console.error('[AssignmentService] Error in listener:', error);
      }
    });
  }

  clear(): void {
    this.assignments.clear();
    this.auditLog = [];
    this.notifyListeners();
    console.log('[AssignmentService] Cleared all assignments and audit log');
  }

  getStats() {
    const assignments = this.getAllAssignments();
    const assigneeGroups = assignments.reduce((acc, assignment) => {
      acc[assignment.assigneeId] = (acc[assignment.assigneeId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAssignments: assignments.length,
      uniqueAssignees: Object.keys(assigneeGroups).length,
      assignmentsByUser: assigneeGroups,
      auditLogEntries: this.auditLog.length
    };
  }
}

export const assignmentService = new AssignmentService();
