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
import { CreateTreatmentDto, UpdateTreatmentDto } from '../../../@types';
import { ListTreatmentsUseCase } from '../../application/use-cases/list-treatments.usecase';
import { RegisterTreatmentUseCase } from '../../application/use-cases/register-treatment.usecase';
import { UpdateTreatmentUseCase } from '../../application/use-cases/update-treatment.usecase';
import { DeleteTreatmentUseCase } from '../../application/use-cases/delete-treatment.usecase';

@Controller('treatments')
export class TreatmentsController {
  constructor(
    private readonly list: ListTreatmentsUseCase,
    private readonly register: RegisterTreatmentUseCase,
    private readonly update: UpdateTreatmentUseCase,
    private readonly remove: DeleteTreatmentUseCase,
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
  create(@Body() body: CreateTreatmentDto) {
    return this.register.execute(body);
  }

  @Patch(':id')
  patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateTreatmentDto,
  ) {
    return this.update.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.remove.execute(id);
  }
}
