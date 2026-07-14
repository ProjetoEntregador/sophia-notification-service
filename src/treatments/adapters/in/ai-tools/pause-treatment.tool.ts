import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { FindTreatmentByMedicationNameUseCase } from '@/treatments/application/use-cases/find-treatment-by-medication-name.usecase';
import { PauseTreatmentUseCase } from '@/treatments/application/use-cases/pause-treatment.usecase';
import { EnsureUserByJidUseCase } from '@/users/application/use-cases/ensure-user-by-jid.usecase';

type PauseTreatmentArgs = { medicationName: string };

@Injectable()
export class PauseTreatmentTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'pause_treatment',
    description:
      'Pausa um tratamento ativo temporariamente — o paciente NÃO recebe lembretes enquanto pausado, mas o tratamento NÃO é cancelado. Use quando o paciente disser "vou viajar", "pausa meu tratamento", "para os lembretes por uns dias", ou orientação médica para interromper. NÃO chame sem confirmação explícita. Para retomar, use resume_treatment.',
    inputSchema: {
      type: 'object',
      properties: {
        medicationName: {
          type: 'string',
          description: 'Nome do medicamento que identifica o tratamento.',
        },
      },
      required: ['medicationName'],
    },
  };

  constructor(
    private readonly findByMed: FindTreatmentByMedicationNameUseCase,
    private readonly pauseTreatment: PauseTreatmentUseCase,
    private readonly ensureUser: EnsureUserByJidUseCase,
  ) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const input = args as PauseTreatmentArgs;
    try {
      const user = await this.ensureUser.execute(jid);
      const matches = await this.findByMed.execute(
        user.id,
        input.medicationName,
      );
      if (matches.length === 0) {
        return `Nenhum tratamento ativo de "${input.medicationName}".`;
      }
      if (matches.length > 1) {
        return `Mais de um tratamento de "${input.medicationName}". Peça ao paciente para escolher (por data/intervalo) antes de pausar.`;
      }
      await this.pauseTreatment.execute(matches[0].id);
      return `Tratamento de "${input.medicationName}" pausado. Os lembretes não vão mais ser enviados até o paciente retomar com resume_treatment.`;
    } catch (err) {
      return `Erro ao pausar tratamento: ${(err as Error).message}`;
    }
  }
}
