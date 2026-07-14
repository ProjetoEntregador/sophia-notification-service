import { Injectable } from '@nestjs/common';
import { Clock } from '@/shared/ports/clock.port';
import { MedicationsRepository } from '@/medications/domain/medications.repository.port';
import { GetMedicationStatusUseCase } from './get-medication-status.usecase';
import { LowStockItem } from '../dtos/low-stock-item.type';

@Injectable()
export class ListLowStockMedicationsUseCase {
  constructor(
    private readonly medications: MedicationsRepository,
    private readonly status: GetMedicationStatusUseCase,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, daysAhead: number): Promise<LowStockItem[]> {
    const now = this.clock.now();
    const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const meds = await this.medications.findByUserId(userId);

    const items: LowStockItem[] = [];
    for (const med of meds) {
      const status = await this.status.execute(med.id, until);
      const projected = status.quantity;
      if (projected <= 0) {
        items.push({
          medicationId: med.id,
          medicationName: med.name,
          currentQuantity: med.quantity,
          projectedQuantity: 0,
          willRunOut: true,
        });
      }
    }
    return items;
  }
}
