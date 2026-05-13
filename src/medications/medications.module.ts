import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { MedicationsRepository } from './domain/medications.repository.port';
import { DrizzleMedicationsRepository } from './adapters/out/drizzle-medications.repository';
import { ListMedicationsUseCase } from './application/use-cases/list-medications.usecase';
import { RegisterMedicationUseCase } from './application/use-cases/register-medication.usecase';
import { UpdateMedicationUseCase } from './application/use-cases/update-medication.usecase';
import { DeleteMedicationUseCase } from './application/use-cases/delete-medication.usecase';
import { FindMedicationByNameUseCase } from './application/use-cases/find-medication-by-name.usecase';
import { GetMedicationStatusUseCase } from './application/use-cases/get-medication-status.usecase';
import { UpdateMedicationQuantityUseCase } from './application/use-cases/update-medication-quantity.usecase';
import { RegisterMedicationTool } from './adapters/in/ai-tools/register-medication.tool';
import { UpdateMedicationQuantityTool } from './adapters/in/ai-tools/update-medication-quantity.tool';

@Module({
  imports: [UsersModule],
  providers: [
    { provide: MedicationsRepository, useClass: DrizzleMedicationsRepository },
    ListMedicationsUseCase,
    RegisterMedicationUseCase,
    UpdateMedicationUseCase,
    DeleteMedicationUseCase,
    FindMedicationByNameUseCase,
    GetMedicationStatusUseCase,
    UpdateMedicationQuantityUseCase,
    RegisterMedicationTool,
    UpdateMedicationQuantityTool,
  ],
  exports: [
    MedicationsRepository,
    RegisterMedicationUseCase,
    FindMedicationByNameUseCase,
    GetMedicationStatusUseCase,
    ListMedicationsUseCase,
    RegisterMedicationTool,
    UpdateMedicationQuantityTool,
  ],
})
export class MedicationsModule {}
