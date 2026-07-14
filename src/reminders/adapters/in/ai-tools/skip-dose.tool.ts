import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { SkipDoseUseCase } from '@/reminders/application/use-cases/skip-dose.usecase';

@Injectable()
export class SkipDoseTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'skip_dose',
    description:
      'Marca a dose pendente mais antiga do paciente como pulada (não tomada).',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  };

  constructor(private readonly skipDose: SkipDoseUseCase) {
    super();
  }

  async execute(jid: string): Promise<string> {
    try {
      const reminder = await this.skipDose.byJid(jid);
      return reminder
        ? `Dose marcada como pulada (reminder ${reminder.id}).`
        : 'Não há dose pendente para pular no momento.';
    } catch (err) {
      return `Erro ao pular dose: ${(err as Error).message}`;
    }
  }
}
