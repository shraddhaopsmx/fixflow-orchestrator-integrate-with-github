
import { useState, useEffect, useCallback } from 'react';
import { IssueAssignment, AssignmentRequest, AuditLogEntry } from '@/types/opsmx';
import { assignmentService } from '@/lib/assignment-service';

export const useAssignments = () => {
  const [assignments, setAssignments] = useState<IssueAssignment[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to assignment updates
    const unsubscribe = assignmentService.subscribe((updatedAssignments) => {
      setAssignments(updatedAssignments);
      setAuditLog(assignmentService.getAuditLog());
    });

    // Initial load
    setAssignments(assignmentService.getAllAssignments());
    setAuditLog(assignmentService.getAuditLog());

    return unsubscribe;
  }, []);

  const assignIssue = useCallback(async (request: AssignmentRequest) => {
    setIsLoading(true);
    try {
      const success = assignmentService.assignIssue(request);
      if (!success) {
        throw new Error('Failed to assign issue');
      }
      console.log(`Successfully assigned issue ${request.issueId} to ${request.assigneeId}`);
    } catch (error) {
      console.error('Failed to assign issue:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateIssueStatus = useCallback(async (issueId: string, status: string, actor: string = 'user') => {
    setIsLoading(true);
    try {
      const success = assignmentService.updateIssueStatus(issueId, status, actor);
      if (!success) {
        throw new Error('Failed to update issue status');
      }
      console.log(`Successfully updated issue ${issueId} status to ${status}`);
    } catch (error) {
      console.error('Failed to update issue status:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAssignedIssues = useCallback((userId: string) => {
    return assignmentService.getAssignedIssues(userId);
  }, []);

  const getAssignmentStats = useCallback(() => {
    return assignmentService.getStats();
  }, []);

  const clearAssignments = useCallback(() => {
    assignmentService.clear();
  }, []);

  return {
    assignments,
    auditLog,
    isLoading,
    assignIssue,
    updateIssueStatus,
    getAssignedIssues,
    getAssignmentStats,
    clearAssignments,
  };
};
