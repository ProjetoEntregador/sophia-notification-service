import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { ListUpcomingRemindersUseCase } from '@/reminders/application/use-cases/list-upcoming-reminders.usecase';
import { EnsureUserByJidUseCase } from '@/users/application/use-cases/ensure-user-by-jid.usecase';

type ListUpcomingArgs = { daysAhead: number };

@Injectable()
export class ListUpcomingRemindersTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'list_upcoming_reminders',
    description:
      'Lista as próximas doses do paciente nos próximos N dias (não inclui o histórico).',
    inputSchema: {
      type: 'object',
      properties: {
        daysAhead: {
          type: 'integer',
          minimum: 1,
          maximum: 30,
          description: 'Quantos dias para a frente listar.',
        },
      },
      required: ['daysAhead'],
    },
  };

  constructor(
    private readonly listUpcoming: ListUpcomingRemindersUseCase,
    private readonly ensureUser: EnsureUserByJidUseCase,
  ) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const input = args as ListUpcomingArgs;
    try {
      const user = await this.ensureUser.execute(jid);
      const items = await this.listUpcoming.execute(user.id, input.daysAhead);
      if (items.length === 0) {
        return `Sem doses programadas nos próximos ${input.daysAhead} dias.`;
      }
      const lines = items.map((r, i) => {
        const when = r.scheduledTime
          .toISOString()
          .slice(0, 16)
          .replace('T', ' ');
        return `${i + 1}. ${when}`;
      });
      return `Próximas ${items.length} doses:\n${lines.join('\n')}`;
    } catch (err) {
      return `Erro ao listar próximas doses: ${(err as Error).message}`;
    }
  }
}
