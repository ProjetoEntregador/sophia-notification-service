export const AUDIT_SERVICE_NAME = 'notification';

export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditEvent {
  service: string;
  entity: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  operation: AuditOperation;
  changed_by: string | null;
  occurred_at: string;
}

export interface AuditRecordInput {
  entity: string;
  operation: AuditOperation;
  oldData?: unknown;
  newData?: unknown;
  changedBy?: string | null;
}
