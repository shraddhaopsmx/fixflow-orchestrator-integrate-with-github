
import { useState, useEffect, useCallback } from 'react';
import { OpsMxIssue, ApprovalRequest, RejectionRequest } from '@/types/opsmx';
import { approvalService } from '@/lib/approval-service';
import { issueStore } from '@/lib/issue-store';

export const useApproval = () => {
  const [waitingIssues, setWaitingIssues] = useState<OpsMxIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to approval service updates
    const unsubscribeApproval = approvalService.subscribe(() => {
      setWaitingIssues(approvalService.getIssuesWaitingForApproval());
    });

    // Subscribe to issue store updates
    const unsubscribeIssues = issueStore.subscribe(() => {
      setWaitingIssues(approvalService.getIssuesWaitingForApproval());
    });

    // Initial load
    setWaitingIssues(approvalService.getIssuesWaitingForApproval());

    return () => {
      unsubscribeApproval();
      unsubscribeIssues();
    };
  }, []);

  const approveIssue = useCallback(async (request: ApprovalRequest) => {
    setIsLoading(true);
    try {
      const success = approvalService.approveIssue(request);
      if (!success) {
        throw new Error('Failed to approve issue');
      }
      console.log(`Successfully approved issue ${request.issueId}`);
    } catch (error) {
      console.error('Failed to approve issue:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rejectIssue = useCallback(async (request: RejectionRequest) => {
    setIsLoading(true);
    try {
      const success = approvalService.rejectIssue(request);
      if (!success) {
        throw new Error('Failed to reject issue');
      }
      console.log(`Successfully rejected issue ${request.issueId}`);
    } catch (error) {
      console.error('Failed to reject issue:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getApprovalStats = useCallback(() => {
    return approvalService.getStats();
  }, []);

  return {
    waitingIssues,
    isLoading,
    approveIssue,
    rejectIssue,
    getApprovalStats,
  };
};
