import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from '@/users/domain/users.repository.port';
import { User } from '@/users/domain/user.entity';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

@Injectable()
export class SetQuietHoursUseCase {
  constructor(private readonly users: UsersRepository) {}

  async execute(
    userId: string,
    start: string | null,
    end: string | null,
  ): Promise<User> {
    if (start === null && end === null) {
      return this.applyChange(userId, null, null);
    }

    if (!start || !end) {
      throw new BadRequestException(
        'Para definir o silêncio, informe início e fim. Para remover, peça para "desligar o silêncio".',
      );
    }

    if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
      throw new BadRequestException(
        'Horário inválido. Use o formato HH:mm (ex.: 22:00, 07:30).',
      );
    }

    if (start === end) {
      throw new BadRequestException(
        'Início e fim do silêncio não podem ser iguais.',
      );
    }

    return this.applyChange(userId, start, end);
  }

  private async applyChange(
    userId: string,
    start: string | null,
    end: string | null,
  ): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.users.save(user.withQuietHours(start, end));
  }
}
