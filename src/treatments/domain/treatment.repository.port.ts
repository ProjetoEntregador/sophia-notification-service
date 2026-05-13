import { Treatment } from './treatment.entity';

export abstract class TreatmentsRepository {
  abstract findAll(): Promise<Treatment[]>;
  abstract findById(id: string): Promise<Treatment | null>;
  abstract findByUserId(userId: string): Promise<Treatment[]>;
  abstract save(treatment: Treatment): Promise<Treatment>;
  abstract delete(id: string): Promise<boolean>;
}
