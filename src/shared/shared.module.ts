import { Global, Module } from '@nestjs/common';
import { Clock } from './ports/clock.port';
import { SystemClockAdapter } from './adapters/system-clock.adapter';
import { TransactionRunner } from './ports/transaction-runner.port';
import { DrizzleTransactionRunner } from './adapters/drizzle-transaction-runner.adapter';

@Global()
@Module({
  providers: [
    { provide: Clock, useClass: SystemClockAdapter },
    { provide: TransactionRunner, useClass: DrizzleTransactionRunner },
  ],
  exports: [Clock, TransactionRunner],
})
export class SharedModule {}
