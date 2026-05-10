import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  CreateMedicationDto,
  UpdateMedicationDto,
} from '../../../@types/medications';
import { ListMedicationsUseCase } from '../../application/use-cases/list-medications.usecase';
import { RegisterMedicationUseCase } from '../../application/use-cases/register-medication.usecase';
import { UpdateMedicationUseCase } from '../../application/use-cases/update-medication.usecase';
import { DeleteMedicationUseCase } from '../../application/use-cases/delete-medication.usecase';

@Controller('medications')
export class MedicationsController {
  constructor(
    private readonly list: ListMedicationsUseCase,
    private readonly register: RegisterMedicationUseCase,
    private readonly update: UpdateMedicationUseCase,
    private readonly remove: DeleteMedicationUseCase,
  ) {}

  @Get()
  findAll() {
    return this.list.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.list.findOne(id);
  }

  @Post()
  create(@Body() body: CreateMedicationDto) {
    return this.register.execute(body);
  }

  @Patch(':id')
  patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMedicationDto,
  ) {
    return this.update.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.remove.execute(id);
  }
}
