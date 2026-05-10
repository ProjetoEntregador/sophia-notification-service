import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../domain/users.repository.port';
import { User } from 'src/users/domain/user.entity';

@Injectable()
export class GetUserUseCase {
  constructor(private readonly users: UsersRepository) {}

  async execute(token: string): Promise<User> {
    return await this.users.getByToken(token);
  }
}
