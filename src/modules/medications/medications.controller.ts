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
import { MedicationsService } from './medications.service';
import {
  CreateMedicationDto,
  UpdateMedicationDto,
} from 'src/@types/medications';

@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Get()
  findAll() {
    return this.medicationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicationsService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateMedicationDto) {
    return this.medicationsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMedicationDto,
  ) {
    return this.medicationsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.medicationsService.remove(id);
  }
}
