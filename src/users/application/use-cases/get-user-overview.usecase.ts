import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../domain/users.repository.port';
import { UserOverview } from '../../domain/user-overview.type';

@Injectable()
export class GetUserOverviewUseCase {
  constructor(private readonly users: UsersRepository) {}

  execute(userId: string): Promise<UserOverview> {
    return this.users.getOverview(userId);
  }
}
