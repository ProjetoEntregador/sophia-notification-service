import { Treatment } from './treatment.entity';
import { TransactionExecutor } from '@/shared/ports/transaction-runner.port';

export abstract class TreatmentsRepository {
  abstract findAll(): Promise<Treatment[]>;
  abstract findById(id: string): Promise<Treatment | null>;
  abstract findByUserId(userId: string): Promise<Treatment[]>;
  abstract save(
    treatment: Treatment,
    tx?: TransactionExecutor,
  ): Promise<Treatment>;
  abstract cancel(id: string, at: Date): Promise<boolean>;
  abstract delete(id: string): Promise<boolean>;
}
