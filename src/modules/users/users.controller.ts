import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly remindersService: UsersService) {}

  @Get('overview:id')
  overview(@Param('id', ParseUUIDPipe) id: string) {
    return this.remindersService.getOverview(id);
  }
}
