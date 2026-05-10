import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ConfirmDoseUseCase } from '../../application/use-cases/confirm-dose.usecase';
import { SkipDoseUseCase } from '../../application/use-cases/skip-dose.usecase';
import { ListRemindersUseCase } from '../../application/use-cases/list-reminders.usecase';
import { DeleteReminderUseCase } from '../../application/use-cases/delete-reminder.usecase';
import { toDate } from '../../../utils/functions';

@Controller('reminders')
export class RemindersController {
  constructor(
    private readonly listReminders: ListRemindersUseCase,
    private readonly confirmDose: ConfirmDoseUseCase,
    private readonly skipDose: SkipDoseUseCase,
    private readonly deleteReminder: DeleteReminderUseCase,
  ) {}

  @Get()
  findAll() {
    return this.listReminders.findAll();
  }

  @Get('today')
  findAllForToday() {
    return this.listReminders.findInDay(new Date());
  }

  @Get('pending')
  findAllPending(@Query('start') start: string, @Query('end') end: string) {
    const startDate = toDate(start);
    const endDate = toDate(end);
    if (!startDate || !endDate) {
      throw new BadRequestException("Provide a valid 'start' and 'end' date");
    }
    return this.listReminders.findInDateRange(startDate, endDate);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.listReminders.findOne(id);
  }

  @Post('confirm/:id')
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.confirmDose.byId(id);
  }

  @Post('skip/:id')
  skip(@Param('id', ParseUUIDPipe) id: string) {
    return this.skipDose.byId(id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deleteReminder.execute(id);
  }
}
