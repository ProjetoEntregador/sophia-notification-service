import { Module } from '@nestjs/common';
import { UsersRepository } from './domain/users.repository.port';
import { DrizzleUsersRepository } from './adapters/out/drizzle-users.repository';
import { GetUserOverviewUseCase } from './application/use-cases/get-user-overview.usecase';
import { GetUserUseCase } from './application/use-cases/get-user.usecase';
import { RegisterUsersUseCase } from './application/use-cases/register-user.usecase';
import { UpdateUserUseCase } from './application/use-cases/update-user.usecase';

@Module({
  providers: [
    { provide: UsersRepository, useClass: DrizzleUsersRepository },
    GetUserOverviewUseCase,
    GetUserUseCase,
    RegisterUsersUseCase,
    UpdateUserUseCase,
  ],
  exports: [
    GetUserOverviewUseCase,
    GetUserUseCase,
    RegisterUsersUseCase,
    UpdateUserUseCase,
  ],
})
export class UsersModule {}
