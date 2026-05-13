import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { FindTreatmentByMedicationNameUseCase } from '@/treatments/application/use-cases/find-treatment-by-medication-name.usecase';
import { UpdateTreatmentIntervalUseCase } from '@/treatments/application/use-cases/update-treatment-interval.usecase';
import { UpdateTreatmentEndDateUseCase } from '@/treatments/application/use-cases/update-treatment-end-date.usecase';
import { EnsureUserByJidUseCase } from '@/users/application/use-cases/ensure-user-by-jid.usecase';

type UpdateTreatmentArgs = {
  medicationName: string;
  intervalHours?: number;
  endTime?: string;
};

@Injectable()
export class UpdateTreatmentTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'update_treatment',
    description:
      'Atualiza um tratamento existente do paciente. Forneça pelo menos um campo (intervalHours OU endTime) para alterar. Identifica o tratamento pelo nome do medicamento. NÃO chame sem confirmação explícita do usuário.',
    inputSchema: {
      type: 'object',
      properties: {
        medicationName: {
          type: 'string',
          description:
            'Nome do medicamento que identifica o tratamento a alterar.',
        },
        intervalHours: {
          type: 'integer',
          minimum: 1,
          maximum: 24,
          description: 'Novo intervalo entre doses, em horas.',
        },
        endTime: {
          type: 'string',
          description:
            'Nova data/hora de término do tratamento em ISO 8601 (-03:00).',
        },
      },
      required: ['medicationName'],
    },
  };

  constructor(
    private readonly findByMed: FindTreatmentByMedicationNameUseCase,
    private readonly updateInterval: UpdateTreatmentIntervalUseCase,
    private readonly updateEnd: UpdateTreatmentEndDateUseCase,
    private readonly ensureUser: EnsureUserByJidUseCase,
  ) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const input = args as UpdateTreatmentArgs;

    if (input.intervalHours === undefined && input.endTime === undefined) {
      return 'Erro: informe pelo menos um campo para alterar (intervalHours ou endTime).';
    }

    try {
      const user = await this.ensureUser.execute(jid);
      const matches = await this.findByMed.execute(
        user.id,
        input.medicationName,
      );

      if (matches.length === 0) {
        return `Erro: nenhum tratamento de "${input.medicationName}" encontrado.`;
      }
      if (matches.length > 1) {
        return `Erro: mais de um tratamento de "${input.medicationName}". Peça ao usuário para escolher (por data/intervalo) antes de alterar.`;
      }

      const treatmentId = matches[0].id;

      if (input.intervalHours !== undefined) {
        await this.updateInterval.execute(treatmentId, input.intervalHours);
      }
      if (input.endTime !== undefined) {
        await this.updateEnd.execute(treatmentId, input.endTime);
      }

      return `Tratamento de "${input.medicationName}" atualizado. Doses pendentes recalculadas.`;
    } catch (err) {
      return `Erro ao atualizar tratamento: ${(err as Error).message}`;
    }
  }
}
