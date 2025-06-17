
import { useState, useEffect, useCallback } from 'react';
import { OpsMxIssue } from '@/types/opsmx';
import { orchestrator } from '@/lib/orchestrator';
import { issueStore } from '@/lib/issue-store';
import { assignmentService } from '@/lib/assignment-service';

interface OrchestratorStats {
  isPolling: boolean;
  consecutiveErrors: number;
  config: any;
  issueStats: {
    total: number;
    open: number;
    assigned: number;
    in_progress: number;
    waiting_for_approval: number;
    approved: number;
    rejected: number;
    resolved: number;
    mitigated: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  assignmentStats: {
    totalAssignments: number;
    uniqueAssignees: number;
    assignmentsByUser: Record<string, number>;
    auditLogEntries: number;
  };
}

export const useOrchestrator = () => {
  const [issues, setIssues] = useState<OpsMxIssue[]>([]);
  const [stats, setStats] = useState<OrchestratorStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to issue store updates
    const unsubscribeIssues = issueStore.subscribe((updatedIssues) => {
      setIssues(updatedIssues);
      updateStats();
    });

    // Subscribe to assignment updates
    const unsubscribeAssignments = assignmentService.subscribe(() => {
      updateStats();
    });

    // Initial load
    setIssues(issueStore.getAllIssues());
    updateStats();

    return () => {
      unsubscribeIssues();
      unsubscribeAssignments();
    };
  }, []);

  const updateStats = useCallback(() => {
    const orchestratorStats = orchestrator.getStats();
    const assignmentStats = assignmentService.getStats();
    
    setStats({
      ...orchestratorStats,
      assignmentStats
    });
  }, []);

  const startOrchestrator = useCallback(async () => {
    setIsLoading(true);
    try {
      await orchestrator.start();
      updateStats();
    } catch (error) {
      console.error('Failed to start orchestrator:', error);
    } finally {
      setIsLoading(false);
    }
  }, [updateStats]);

  const stopOrchestrator = useCallback(() => {
    orchestrator.stop();
    updateStats();
  }, [updateStats]);

  const processIssue = useCallback(async (issueId: string) => {
    setIsLoading(true);
    try {
      await orchestrator.processIssue(issueId);
    } catch (error) {
      console.error('Failed to process issue:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearIssues = useCallback(() => {
    issueStore.clear();
    assignmentService.clear();
  }, []);

  return {
    issues,
    stats,
    isLoading,
    startOrchestrator,
    stopOrchestrator,
    processIssue,
    clearIssues,
    openIssues: issues.filter(issue => issue.status === 'open'),
    assignedIssues: issues.filter(issue => issue.status === 'assigned'),
    inProgressIssues: issues.filter(issue => issue.status === 'in_progress'),
    awaitingApprovalIssues: issues.filter(issue => issue.status === 'waiting_for_approval'),
    approvedIssues: issues.filter(issue => issue.status === 'approved'),
    rejectedIssues: issues.filter(issue => issue.status === 'rejected'),
    resolvedIssues: issues.filter(issue => issue.status === 'resolved'),
    mitigatedIssues: issues.filter(issue => issue.status === 'mitigated'),
  };
};
