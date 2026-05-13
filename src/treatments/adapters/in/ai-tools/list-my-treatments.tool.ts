import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { ListUserTreatmentsUseCase } from '@/treatments/application/use-cases/list-user-treatments.usecase';
import { EnsureUserByJidUseCase } from '@/users/application/use-cases/ensure-user-by-jid.usecase';

@Injectable()
export class ListMyTreatmentsTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'list_my_treatments',
    description:
      'Lista os tratamentos do paciente com nomes dos medicamentos, intervalo, datas e contagem de doses (tomadas/puladas/pendentes). Use quando o usuário pedir para ver seus tratamentos.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  };

  constructor(
    private readonly listTreatments: ListUserTreatmentsUseCase,
    private readonly ensureUser: EnsureUserByJidUseCase,
  ) {
    super();
  }

  async execute(jid: string): Promise<string> {
    try {
      const user = await this.ensureUser.execute(jid);
      const items = await this.listTreatments.execute(user.id);

      if (items.length === 0) {
        return 'Você ainda não tem tratamentos cadastrados.';
      }

      const lines = items.map((it, idx) => {
        const meds = it.medicationNames.join(', ');
        const start = it.treatment.startTime.toISOString().slice(0, 10);
        const end = it.treatment.endTime.toISOString().slice(0, 10);
        const { confirmed, skipped, pending } = it.totals;
        return `${idx + 1}. ${meds} — a cada ${it.treatment.intervalHours}h, de ${start} até ${end} (${confirmed} tomadas, ${skipped} puladas, ${pending} pendentes)`;
      });
      return `Tratamentos do paciente:\n${lines.join('\n')}`;
    } catch (err) {
      return `Erro ao listar tratamentos: ${(err as Error).message}`;
    }
  }
}
