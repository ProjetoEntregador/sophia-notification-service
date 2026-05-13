import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { ListTodayRemindersUseCase } from '@/reminders/application/use-cases/list-today-reminders.usecase';
import { EnsureUserByJidUseCase } from '@/users/application/use-cases/ensure-user-by-jid.usecase';

@Injectable()
export class ListTodayRemindersTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'list_today_reminders',
    description:
      'Lista os lembretes (doses) do paciente para o dia de hoje, com status (enviado, confirmado, pulado, pendente).',
    inputSchema: { type: 'object', properties: {}, required: [] },
  };

  constructor(
    private readonly listToday: ListTodayRemindersUseCase,
    private readonly ensureUser: EnsureUserByJidUseCase,
  ) {
    super();
  }

  async execute(jid: string): Promise<string> {
    try {
      const user = await this.ensureUser.execute(jid);
      const items = await this.listToday.execute(user.id);
      if (items.length === 0)
        return 'Você não tem doses programadas para hoje.';

      const lines = items.map((r, i) => {
        const hour = r.scheduledTime.toISOString().slice(11, 16);
        const status =
          r.confirmed === true
            ? 'confirmada'
            : r.confirmed === false
              ? 'pulada'
              : r.sent
                ? 'aguardando resposta'
                : 'pendente';
        return `${i + 1}. ${hour} — ${status}`;
      });
      return `Doses de hoje:\n${lines.join('\n')}`;
    } catch (err) {
      return `Erro ao listar doses de hoje: ${(err as Error).message}`;
    }
  }
}
