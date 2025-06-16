
import { useState, useEffect, useCallback } from 'react';
import { OpsMxIssue } from '@/types/opsmx';
import { orchestrator } from '@/lib/orchestrator';
import { issueStore } from '@/lib/issue-store';

interface OrchestratorStats {
  isPolling: boolean;
  consecutiveErrors: number;
  config: any;
  issueStats: {
    total: number;
    open: number;
    approved: number;
    mitigated: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
}

export const useOrchestrator = () => {
  const [issues, setIssues] = useState<OpsMxIssue[]>([]);
  const [stats, setStats] = useState<OrchestratorStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to issue store updates
    const unsubscribe = issueStore.subscribe((updatedIssues) => {
      setIssues(updatedIssues);
      setStats(orchestrator.getStats());
    });

    // Initial load
    setIssues(issueStore.getAllIssues());
    setStats(orchestrator.getStats());

    return unsubscribe;
  }, []);

  const startOrchestrator = useCallback(async () => {
    setIsLoading(true);
    try {
      await orchestrator.start();
      setStats(orchestrator.getStats());
    } catch (error) {
      console.error('Failed to start orchestrator:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopOrchestrator = useCallback(() => {
    orchestrator.stop();
    setStats(orchestrator.getStats());
  }, []);

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
    approvedIssues: issues.filter(issue => issue.status === 'approved'),
    mitigatedIssues: issues.filter(issue => issue.status === 'mitigated'),
  };
};
