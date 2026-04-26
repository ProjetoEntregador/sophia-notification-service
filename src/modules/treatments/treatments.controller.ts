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
import { TreatmentsService } from './treatments.service';

type CreateTreatmentDto = {
  userId: string;
  medicineName: string;
  intervalHours: number;
  startTime: string;
  endTime: string;
};

type UpdateTreatmentDto = Partial<CreateTreatmentDto>;

@Controller('treatments')
export class TreatmentsController {
  constructor(private readonly treatmentsService: TreatmentsService) {}

  @Get()
  findAll() {
    return this.treatmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.treatmentsService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateTreatmentDto) {
    return this.treatmentsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateTreatmentDto,
  ) {
    return this.treatmentsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.treatmentsService.remove(id);
  }
}
