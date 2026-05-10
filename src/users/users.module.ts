import { Module } from '@nestjs/common';
import { UsersRepository } from './domain/users.repository.port';
import { DrizzleUsersRepository } from './adapters/out/drizzle-users.repository';
import { GetUserOverviewUseCase } from './application/use-cases/get-user-overview.usecase';

@Module({
  providers: [
    { provide: UsersRepository, useClass: DrizzleUsersRepository },
    GetUserOverviewUseCase,
  ],
  exports: [GetUserOverviewUseCase],
})
export class UsersModule {}
