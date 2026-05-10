import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { GetUserOverviewUseCase } from '../../application/use-cases/get-user-overview.usecase';

@Controller('users')
export class UsersController {
  constructor(private readonly getUserOverview: GetUserOverviewUseCase) {}

  @Get('overview/:id')
  overview(@Param('id', ParseUUIDPipe) id: string) {
    return this.getUserOverview.execute(id);
  }
}
