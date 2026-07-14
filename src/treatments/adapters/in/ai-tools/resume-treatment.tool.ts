import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { FindTreatmentByMedicationNameUseCase } from '@/treatments/application/use-cases/find-treatment-by-medication-name.usecase';
import { ResumeTreatmentUseCase } from '@/treatments/application/use-cases/resume-treatment.usecase';
import { EnsureUserByJidUseCase } from '@/users/application/use-cases/ensure-user-by-jid.usecase';

type ResumeTreatmentArgs = { medicationName: string };

@Injectable()
export class ResumeTreatmentTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'resume_treatment',
    description:
      'Retoma um tratamento que estava pausado — os lembretes voltam a ser enviados a partir das próximas doses. Use quando o paciente disser "voltei", "pode retomar", "voltar os lembretes", "destrancar".',
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
    private readonly resumeTreatment: ResumeTreatmentUseCase,
    private readonly ensureUser: EnsureUserByJidUseCase,
  ) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const input = args as ResumeTreatmentArgs;
    try {
      const user = await this.ensureUser.execute(jid);
      const matches = await this.findByMed.execute(
        user.id,
        input.medicationName,
      );
      if (matches.length === 0) {
        return `Nenhum tratamento de "${input.medicationName}".`;
      }
      if (matches.length > 1) {
        return `Mais de um tratamento de "${input.medicationName}". Peça ao paciente para escolher antes de retomar.`;
      }
      await this.resumeTreatment.execute(matches[0].id);
      return `Tratamento de "${input.medicationName}" retomado. Os lembretes voltam a partir da próxima dose agendada.`;
    } catch (err) {
      return `Erro ao retomar tratamento: ${(err as Error).message}`;
    }
  }
}
