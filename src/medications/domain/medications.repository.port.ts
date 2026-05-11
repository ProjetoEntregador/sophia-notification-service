import { Treatment } from '@/treatments/domain/treatment.entity';
import { Medication } from './medication.entity';

export abstract class MedicationsRepository {
  abstract findAll(): Promise<Medication[]>;
  abstract findById(id: string): Promise<Medication | null>;
  abstract findByUserId(userId: string): Promise<Medication[]>;
  abstract findTreatmentsOf(medicationId: string): Promise<Treatment[]>;
  abstract save(medication: Medication): Promise<Medication>;
  abstract delete(id: string): Promise<boolean>;
}
