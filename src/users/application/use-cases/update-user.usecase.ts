import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '@/users/domain/users.repository.port';
import { User } from '@/users/domain/user.entity';
import { UpdateUserInput } from '../dtos/user.input';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly users: UsersRepository) {}

  async execute(id: string, input: UpdateUserInput): Promise<User> {
    const current = await this.users.findById(id);
    if (!current) throw new NotFoundException(`User not found`);

    const merged = input.name ? current.withName(input.name) : current;
    return this.users.save(merged);
  }
}
