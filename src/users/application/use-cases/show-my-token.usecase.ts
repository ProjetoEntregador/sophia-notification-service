import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '@/users/domain/users.repository.port';

@Injectable()
export class ShowMyTokenUseCase {
  constructor(private readonly users: UsersRepository) {}

  async execute(jid: string): Promise<string> {
    const user = await this.users.findByJid(jid);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user.token;
  }
}
