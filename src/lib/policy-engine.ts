
import { SecurityIssue } from "@/types/orchestration-job";

export function requiresApproval(issue: SecurityIssue): boolean {
  // Simple logic: Critical or High severity & non-Code require approval
  if (issue.severity === "Critical" || issue.severity === "High") {
    if (issue.source !== "SAST") return true;
  }
  return false;
}
