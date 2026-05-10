import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from 'src/users/domain/users.repository.port';
import { User } from 'src/users/domain/user.entity';
import { UpdateUserInput } from '../dtos/user.input';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly users: UsersRepository) {}

  async execute(id: string, input: UpdateUserInput): Promise<User> {
    const current = await this.users.getById(id);
    if (!current) throw new NotFoundException(`User not found`);

    const merged = new User(
      current.id,
      input.name ?? current.name,
      current.token,
    );
    return this.users.save(merged);
  }
}
