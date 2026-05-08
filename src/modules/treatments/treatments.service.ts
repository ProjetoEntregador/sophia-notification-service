import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database.module';
import { treatments } from '../../db/schema/treatments';
import {
  CreateTreatmentInput,
  NewTreatment,
  Treatment,
  UpdateTreatmentInput,
} from '../../@types';
import { TreatmentsToMedicationService } from '../treatmentsToMedication/treatmentsToMedication.service';

@Injectable()
export class TreatmentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase,
    private readonly treatmentsToMedication: TreatmentsToMedicationService,
  ) {}

  findAll(): Promise<Treatment[]> {
    return this.db.select().from(treatments);
  }

  async findOne(id: string): Promise<Treatment> {
    const [row] = await this.db
      .select()
      .from(treatments)
      .where(eq(treatments.id, id));
    if (!row) throw new NotFoundException(`Treatment ${id} not found`);
    return row;
  }

  async create(input: CreateTreatmentInput): Promise<Treatment> {
    const [row] = await this.db
      .insert(treatments)
      .values(this.toValues(input) as NewTreatment)
      .returning();

    const treatmentsToMedicationsData = input.medicationsIds.map(
      (medicationId) => {
        return { medicationId, treatmentId: row.id };
      },
    );

    await this.treatmentsToMedication.createMany(treatmentsToMedicationsData);

    return row;
  }

  async update(id: string, input: UpdateTreatmentInput): Promise<Treatment> {
    const [row] = await this.db
      .update(treatments)
      .set(this.toValues(input))
      .where(eq(treatments.id, id))
      .returning();
    if (!row) throw new NotFoundException(`Treatment ${id} not found`);

    if (input.medicationsIds) {
      await this.treatmentsToMedication.removeManyByForeignId(
        'treatmentId',
        id,
      );

      const treatmentsToMedicationsData = input.medicationsIds.map(
        (medicationId) => {
          return { medicationId, treatmentId: row.id };
        },
      );

      await this.treatmentsToMedication.createMany(treatmentsToMedicationsData);
    }

    return row;
  }

  async remove(id: string): Promise<void> {
    const result = await this.db
      .delete(treatments)
      .where(eq(treatments.id, id))
      .returning({ id: treatments.id });

    if (result.length === 0) {
      throw new NotFoundException(`Treatment ${id} not found`);
    }

    await this.treatmentsToMedication.removeManyByForeignId('treatmentId', id);
  }

  private toValues(
    input: Partial<CreateTreatmentInput>,
  ): Partial<NewTreatment> {
    return {
      userId: input.userId,
      jid: input.jid,
      intervalHours: input.intervalHours,
      startTime: input.startTime ? new Date(input.startTime) : undefined,
      endTime: input.endTime ? new Date(input.endTime) : undefined,
    };
  }
}
