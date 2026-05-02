import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '../../../@types';
import { RemindersService } from '../../../modules/reminders/reminders.service.js';
import { AiToolInterface } from '../interfaces/index.js';

@Injectable()
export class ConfirmDoseTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'confirm_dose',
    description:
      'Marca a dose pendente mais antiga do paciente como confirmada (tomada).',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  };

  constructor(private readonly reminders: RemindersService) {
    super();
  }

  async execute(jid: string): Promise<string> {
    try {
      const reminder = await this.reminders.confirmDose(jid);
      return reminder
        ? `Dose confirmada (reminder ${reminder.id}).`
        : 'Não há dose pendente para confirmar no momento.';
    } catch (err) {
      return `Erro ao confirmar dose: ${(err as Error).message}`;
    }
  }
}
