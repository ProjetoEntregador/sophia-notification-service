import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UsersRepository } from '@/users/domain/users.repository.port';
import { CreateUserInput } from '../dtos/user.input';
import { User } from '@/users/domain/user.entity';

@Injectable()
export class RegisterUsersUseCase {
  constructor(private readonly users: UsersRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const user = new User(randomUUID(), input.name, input.jid, randomUUID());
    return this.users.save(user);
  }
}
