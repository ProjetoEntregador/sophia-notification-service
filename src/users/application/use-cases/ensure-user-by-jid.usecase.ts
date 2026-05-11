import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UsersRepository } from '@/users/domain/users.repository.port';
import { User } from '@/users/domain/user.entity';

@Injectable()
export class EnsureUserByJidUseCase {
  constructor(private readonly users: UsersRepository) {}

  async execute(jid: string, fallbackName = 'Paciente'): Promise<User> {
    const existing = await this.users.findByJid(jid);
    if (existing) return existing;

    const created = new User(randomUUID(), fallbackName, jid, randomUUID());
    return this.users.save(created);
  }
}
