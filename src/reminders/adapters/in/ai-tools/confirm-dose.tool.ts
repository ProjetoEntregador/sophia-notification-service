import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { ConfirmDoseUseCase } from '@/reminders/application/use-cases/confirm-dose.usecase';
import { AiToolInterface } from '@/bot/ai/interfaces/index';

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

  constructor(private readonly confirmDose: ConfirmDoseUseCase) {
    super();
  }

  async execute(jid: string): Promise<string> {
    try {
      const reminder = await this.confirmDose.byJid(jid);
      return reminder
        ? `Dose confirmada (reminder ${reminder.id}).`
        : 'Não há dose pendente para confirmar no momento.';
    } catch (err) {
      return `Erro ao confirmar dose: ${(err as Error).message}`;
    }
  }
}
