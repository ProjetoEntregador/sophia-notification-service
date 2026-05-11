import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from '@/users/domain/users.repository.port';
import { User } from '@/users/domain/user.entity';

@Injectable()
export class TransferJidUseCase {
  constructor(private readonly users: UsersRepository) {}

  async execute(token: string, newJid: string): Promise<User> {
    if (!token?.trim() || !newJid?.trim()) {
      throw new BadRequestException('Token e novo jid são obrigatórios');
    }

    const owner = await this.users.findByToken(token);
    if (!owner) throw new NotFoundException('Token inválido');

    if (owner.jid === newJid) return owner;

    const conflict = await this.users.findByJid(newJid);
    if (conflict && conflict.id !== owner.id) {
      throw new ConflictException(
        'Esse número já está vinculado a outra conta',
      );
    }

    return this.users.save(owner.withJid(newJid));
  }
}
