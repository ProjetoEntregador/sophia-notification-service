import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE } from '@/db/database.module';
import {
  TransactionExecutor,
  TransactionRunner,
} from '../ports/transaction-runner.port';

@Injectable()
export class DrizzleTransactionRunner extends TransactionRunner {
  constructor(@Inject(DATABASE) private readonly db: NodePgDatabase) {
    super();
  }

  async run<T>(fn: (executor: TransactionExecutor) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => fn(tx));
  }
}
