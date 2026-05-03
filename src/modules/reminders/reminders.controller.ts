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
import { CreateReminderDto, UpdateReminderDto } from '../../@types';

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

  @Get('today')
  findAllForToday() {
    const today = new Date();
    return this.remindersService.findAllForDay(today);
  }
}
