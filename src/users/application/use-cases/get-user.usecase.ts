import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '@/users/domain/users.repository.port';
import { User } from '@/users/domain/user.entity';

@Injectable()
export class GetUserUseCase {
  constructor(private readonly users: UsersRepository) {}

  async execute(token: string): Promise<User> {
    const user = await this.users.findByToken(token);
    if (!user) throw new NotFoundException(`User not found`);
    return user;
  }
}
