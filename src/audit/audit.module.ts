import { Global, Module } from '@nestjs/common';
import { AuditPublisher } from './domain/audit-publisher.port';
import { RabbitmqAuditPublisher } from './adapters/out/rabbitmq-audit.publisher';

@Global()
@Module({
  providers: [{ provide: AuditPublisher, useClass: RabbitmqAuditPublisher }],
  exports: [AuditPublisher],
})
export class AuditModule {}
