import { AuditRecordInput } from './audit-event';

export abstract class AuditPublisher {
  abstract record(input: AuditRecordInput): Promise<void>;
}
