import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RemindersService } from './reminders.service';
import {
  CreateReminderDto,
  DelayReminder,
  UpdateReminderDto,
} from '../../@types';
import { toDate } from 'src/utils/functions';

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

  @Patch('delay:id')
  delay(@Param('id', ParseUUIDPipe) id: string, @Body() body: DelayReminder) {
    return this.remindersService.delay(id, body.delay);
  }

  @Post('confirm:id')
  confirmReminder(@Param('id', ParseUUIDPipe) id: string) {
    return this.remindersService.confirmReminder(id);
  }

  @Post('skip:id')
  skipReminder(@Param('id', ParseUUIDPipe) id: string) {
    return this.remindersService.skipReminder(id);
  }

  @Get('today')
  findAllForToday() {
    const today = new Date();
    return this.remindersService.findAllForDay(today);
  }

  @Get('pending')
  findAllPending(@Query('start') start: string, @Query('end') end: string) {
    const startDate = toDate(start);
    const endDate = toDate(end);

    if (!startDate || !endDate) {
      throw new BadRequestException("Provide a valid 'start' and 'end' date");
    }
    return this.remindersService.getRemindersInBetweenDates(startDate, endDate);
  }
}
