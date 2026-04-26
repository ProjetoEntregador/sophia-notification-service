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
import { RemindersService } from './reminders.service';

type CreateReminderDto = {
  treatmentId: string;
  scheduledTime: string;
  sent?: boolean;
  sentAt?: string | null;
  confirmed?: boolean | null;
  confirmedAt?: string | null;
};

type UpdateReminderDto = Partial<CreateReminderDto>;

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll() {
    return this.remindersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.remindersService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateReminderDto) {
    return this.remindersService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateReminderDto,
  ) {
    return this.remindersService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.remindersService.remove(id);
  }
}
