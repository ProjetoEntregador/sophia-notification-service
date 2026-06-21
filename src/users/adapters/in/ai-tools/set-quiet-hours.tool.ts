import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { SetQuietHoursUseCase } from '@/users/application/use-cases/set-quiet-hours.usecase';
import { EnsureUserByJidUseCase } from '@/users/application/use-cases/ensure-user-by-jid.usecase';

type SetQuietHoursArgs = {
  start?: string | null;
  end?: string | null;
  disable?: boolean;
};

@Injectable()
export class SetQuietHoursTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'set_quiet_hours',
    description:
      'Define a janela do dia em que o paciente NÃO quer receber lembretes (horas de silêncio noturno). Lembretes que caírem dentro do silêncio são adiados para o próximo horário ativo. Use quando o paciente disser "não me acorde durante a noite", "silêncio das 22h às 7h", "para de mandar mensagem à noite". Para REMOVER o silêncio, chame com disable=true.',
    inputSchema: {
      type: 'object',
      properties: {
        start: {
          type: 'string',
          description:
            'Hora de início do silêncio em HH:mm (ex.: "22:00"). Obrigatório se disable=false.',
        },
        end: {
          type: 'string',
          description:
            'Hora de fim do silêncio em HH:mm (ex.: "07:00"). Obrigatório se disable=false.',
        },
        disable: {
          type: 'boolean',
          description: 'true para remover o silêncio atual.',
        },
      },
      required: [],
    },
  };

  constructor(
    private readonly setQuietHours: SetQuietHoursUseCase,
    private readonly ensureUser: EnsureUserByJidUseCase,
  ) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const input = (args ?? {}) as SetQuietHoursArgs;
    try {
      const user = await this.ensureUser.execute(jid);
      if (input.disable === true) {
        await this.setQuietHours.execute(user.id, null, null);
        return 'Silêncio removido. O paciente vai voltar a receber lembretes a qualquer hora.';
      }
      await this.setQuietHours.execute(
        user.id,
        input.start ?? null,
        input.end ?? null,
      );
      return `Silêncio configurado: lembretes entre ${input.start} e ${input.end} serão adiados para o próximo horário ativo.`;
    } catch (err) {
      return `Erro ao configurar silêncio: ${(err as Error).message}`;
    }
  }
}
