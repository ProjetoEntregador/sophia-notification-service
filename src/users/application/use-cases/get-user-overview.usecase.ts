import { Injectable } from '@nestjs/common';
import { UserOverview } from '@/users/domain/user-overview.type';
import { UsersRepository } from '@/users/domain/users.repository.port';

@Injectable()
export class GetUserOverviewUseCase {
  constructor(private readonly users: UsersRepository) {}

  execute(userId: string): Promise<UserOverview> {
    return this.users.getOverview(userId);
  }
}
