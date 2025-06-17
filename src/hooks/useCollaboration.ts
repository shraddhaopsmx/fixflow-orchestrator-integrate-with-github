
import { useState, useEffect, useCallback } from 'react';
import { 
  DashboardSummary, 
  FullIssueDetails, 
  IssueComment, 
  IssueHistoryEntry,
  collaborationAPI 
} from '@/lib/collaboration-api';
import { issueStore } from '@/lib/issue-store';

export const useCollaboration = () => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to issue store updates to refresh data
    const unsubscribe = issueStore.subscribe(() => {
      // Data will be refreshed when components call the API methods
    });

    return unsubscribe;
  }, []);

  const getDashboardSummary = useCallback(async (userId: string): Promise<DashboardSummary> => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      const summary = collaborationAPI.getDashboardSummary(userId);
      console.log('[useCollaboration] Dashboard summary for user:', userId, summary);
      return summary;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getIssueDetails = useCallback(async (issueId: string): Promise<FullIssueDetails | null> => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const details = collaborationAPI.getIssueDetails(issueId);
      console.log('[useCollaboration] Issue details for:', issueId, details);
      return details;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getIssueComments = useCallback(async (issueId: string): Promise<IssueComment[]> => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const comments = collaborationAPI.getIssueComments(issueId);
      console.log('[useCollaboration] Comments for issue:', issueId, comments);
      return comments;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addComment = useCallback(async (
    issueId: string, 
    userId: string, 
    userEmail: string, 
    comment: string,
    type: IssueComment['type'] = 'comment'
  ): Promise<IssueComment> => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const newComment = collaborationAPI.addComment(issueId, userId, userEmail, comment, type);
      console.log('[useCollaboration] Added comment:', newComment);
      return newComment;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getIssueHistory = useCallback(async (issueId: string): Promise<IssueHistoryEntry[]> => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const history = collaborationAPI.getIssueHistory(issueId);
      console.log('[useCollaboration] History for issue:', issueId, history);
      return history;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    getDashboardSummary,
    getIssueDetails,
    getIssueComments,
    addComment,
    getIssueHistory,
  };
};
