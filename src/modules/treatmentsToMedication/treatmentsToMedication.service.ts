import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database.module';
import { treatmentsToMedications } from 'src/db/schema/treatmentsToMedications';
import {
  CreateTreatmentToMedication,
  TreatmentToMedication,
} from 'src/@types/treatmentToMedication';

@Injectable()
export class TreatmentsToMedicationService {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase) {}

  async createMany(input: CreateTreatmentToMedication[]): Promise<void> {
    await this.db.insert(treatmentsToMedications).values(input);
  }

  async removeManyByForeignId(
    field: keyof TreatmentToMedication,
    foreignId: string,
  ): Promise<void> {
    await this.db
      .delete(treatmentsToMedications)
      .where(eq(treatmentsToMedications[field], foreignId));
  }
}
