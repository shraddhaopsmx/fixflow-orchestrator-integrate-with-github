
import { OpsMxIssue } from "@/types/opsmx";

class IssueStore {
  private issues = new Map<string, OpsMxIssue>();
  private listeners: Array<(issues: OpsMxIssue[]) => void> = [];

  addIssue(issue: OpsMxIssue): boolean {
    const wasNew = !this.issues.has(issue.issueId);
    this.issues.set(issue.issueId, issue);
    
    if (wasNew) {
      console.log(`[IssueStore] Added new issue: ${issue.issueId} (${issue.type})`);
      this.notifyListeners();
    }
    
    return wasNew;
  }

  addIssues(issues: OpsMxIssue[]): number {
    let newCount = 0;
    
    issues.forEach(issue => {
      if (this.addIssue(issue)) {
        newCount++;
      }
    });
    
    console.log(`[IssueStore] Added ${newCount} new issues out of ${issues.length} total`);
    return newCount;
  }

  getIssue(issueId: string): OpsMxIssue | undefined {
    return this.issues.get(issueId);
  }

  getAllIssues(): OpsMxIssue[] {
    return Array.from(this.issues.values());
  }

  getOpenIssues(): OpsMxIssue[] {
    return this.getAllIssues().filter(issue => issue.status === 'open');
  }

  updateIssueStatus(issueId: string, status: OpsMxIssue['status']): boolean {
    const issue = this.issues.get(issueId);
    if (issue) {
      issue.status = status;
      console.log(`[IssueStore] Updated issue ${issueId} status to ${status}`);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  subscribe(listener: (issues: OpsMxIssue[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const issues = this.getAllIssues();
    this.listeners.forEach(listener => {
      try {
        listener(issues);
      } catch (error) {
        console.error('[IssueStore] Error in listener:', error);
      }
    });
  }

  clear(): void {
    this.issues.clear();
    this.notifyListeners();
    console.log('[IssueStore] Cleared all issues');
  }

  getStats() {
    const issues = this.getAllIssues();
    return {
      total: issues.length,
      open: issues.filter(i => i.status === 'open').length,
      approved: issues.filter(i => i.status === 'approved').length,
      mitigated: issues.filter(i => i.status === 'mitigated').length,
      bySeverity: {
        critical: issues.filter(i => i.severity === 'Critical').length,
        high: issues.filter(i => i.severity === 'High').length,
        medium: issues.filter(i => i.severity === 'Medium').length,
        low: issues.filter(i => i.severity === 'Low').length,
      }
    };
  }
}

export const issueStore = new IssueStore();
