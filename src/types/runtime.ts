
export interface RuntimeAlert {
  id: string;
  description: string;
  suggestedAction: RuntimeActionType;
  defaultConfidence: number; // A value between 0 and 100
}

export type RuntimeActionType = 'ISOLATE_CONTAINER' | 'DISABLE_USER' | 'TERMINATE_PROCESS' | 'NO_ACTION' | 'ESCALATED';

export interface RemediationResult {
  actionTaken: RuntimeActionType;
  details: string;
  notificationSent: boolean;
  log: string[];
}
