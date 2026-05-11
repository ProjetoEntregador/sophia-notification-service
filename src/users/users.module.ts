import { forwardRef, Module } from '@nestjs/common';
import { BotModule } from '@/bot/bot.module';
import { UsersRepository } from './domain/users.repository.port';
import { DrizzleUsersRepository } from './adapters/out/drizzle-users.repository';
import { GetUserOverviewUseCase } from './application/use-cases/get-user-overview.usecase';
import { GetUserUseCase } from './application/use-cases/get-user.usecase';
import { RegisterUsersUseCase } from './application/use-cases/register-user.usecase';
import { UpdateUserUseCase } from './application/use-cases/update-user.usecase';
import { EnsureUserByJidUseCase } from './application/use-cases/ensure-user-by-jid.usecase';
import { TransferJidUseCase } from './application/use-cases/transfer-jid.usecase';
import { ShowMyTokenUseCase } from './application/use-cases/show-my-token.usecase';
import { TransferJidHandler } from './adapters/in/whatsapp/transfer-jid.handler';
import { ShowTokenHandler } from './adapters/in/whatsapp/show-token.handler';

@Module({
  imports: [forwardRef(() => BotModule)],
  providers: [
    { provide: UsersRepository, useClass: DrizzleUsersRepository },
    GetUserOverviewUseCase,
    GetUserUseCase,
    RegisterUsersUseCase,
    UpdateUserUseCase,
    EnsureUserByJidUseCase,
    TransferJidUseCase,
    ShowMyTokenUseCase,
    TransferJidHandler,
    ShowTokenHandler,
  ],
  exports: [
    GetUserOverviewUseCase,
    GetUserUseCase,
    RegisterUsersUseCase,
    UpdateUserUseCase,
    EnsureUserByJidUseCase,
    TransferJidUseCase,
    ShowMyTokenUseCase,
    TransferJidHandler,
    ShowTokenHandler,
  ],
})
export class UsersModule {}
