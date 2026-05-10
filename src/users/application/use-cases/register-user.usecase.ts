import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UsersRepository } from 'src/users/domain/users.repository.port';
import { CreateUserInput } from '../dtos/user.input';
import { User } from 'src/users/domain/user.entity';

@Injectable()
export class RegisterUsersUseCase {
  constructor(private readonly users: UsersRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const user = new User(randomUUID(), input.name, randomUUID());
    const saved = await this.users.save(user);
    return saved;
  }
}
