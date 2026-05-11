import { Injectable } from '@nestjs/common';
import { UserOverview } from '@/users/domain/user-overview.type';
import { UsersRepository } from '@/users/domain/users.repository.port';

@Injectable()
export class GetUserOverviewUseCase {
  constructor(private readonly users: UsersRepository) {}

  async execute(userId: string): Promise<UserOverview> {
    return await this.users.getOverview(userId);
  }
}
