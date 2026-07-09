import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from '@/infra/messaging/rabbitmq.service';
import { AuditPublisher } from '@/audit/domain/audit-publisher.port';
import {
  AUDIT_SERVICE_NAME,
  AuditEvent,
  AuditRecordInput,
} from '@/audit/domain/audit-event';

@Injectable()
export class RabbitmqAuditPublisher extends AuditPublisher {
  private readonly logger = new Logger(RabbitmqAuditPublisher.name);

  constructor(private readonly rabbit: RabbitMQService) {
    super();
  }

  async record(input: AuditRecordInput): Promise<void> {
    const event: AuditEvent = {
      service: AUDIT_SERVICE_NAME,
      entity: input.entity,
      old_data: this.normalize(input.oldData),
      new_data: this.normalize(input.newData),
      operation: input.operation,
      changed_by: input.changedBy ?? null,
      occurred_at: new Date().toISOString(),
    };

    try {
      await this.rabbit.publishAuditEvent(event);
    } catch (error) {
      this.logger.error(
        `Falha ao publicar evento de auditoria (${input.operation} ${input.entity})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private normalize(data: unknown): Record<string, unknown> | null {
    if (data === undefined || data === null) return null;
    return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
  }
}
