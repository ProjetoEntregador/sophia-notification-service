import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '../../../@types';
import { TreatmentsService } from '../../../modules/treatments/treatments.service.js';
import { jidToUserId } from '../../../utils/functions.js';
import { AiToolInterface } from '../interfaces/index.js';

type RegisterTreatmentArgs = {
  medicineName: string;
  intervalHours: number;
  startTime: string;
  endTime: string;
};

@Injectable()
export class RegisterTreatmentTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'register_treatment',
    description:
      'Cadastra um novo tratamento medicamentoso para o paciente. Use quando o usuário pedir para cadastrar/iniciar um tratamento.',
    inputSchema: {
      type: 'object',
      properties: {
        medicineName: {
          type: 'string',
          description: 'Nome do medicamento.',
        },
        intervalHours: {
          type: 'integer',
          minimum: 1,
          maximum: 24,
          description: 'Intervalo entre doses em horas (1 a 24).',
        },
        startTime: {
          type: 'string',
          description:
            'Data e hora de início do tratamento em ISO 8601 (ex: 2026-05-04T11:00:00Z).',
        },
        endTime: {
          type: 'string',
          description:
            'Data e hora de término do tratamento em ISO 8601 (ex: 2026-05-11T11:00:00Z).',
        },
      },
      required: ['medicineName', 'intervalHours', 'startTime', 'endTime'],
    },
  };

  constructor(private readonly treatments: TreatmentsService) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const input = args as RegisterTreatmentArgs;

    const start = new Date(input.startTime);
    const end = new Date(input.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Erro: startTime ou endTime não estão em formato ISO 8601 válido.';
    }
    if (end <= start) {
      return 'Erro: endTime precisa ser posterior a startTime.';
    }

    try {
      const treatment = await this.treatments.create({
        userId: jidToUserId(jid),
        jid,
        medicineName: input.medicineName,
        intervalHours: input.intervalHours,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      return `Tratamento cadastrado com id ${treatment.id}: ${input.medicineName}, a cada ${input.intervalHours}h, de ${start.toISOString()} até ${end.toISOString()}.`;
    } catch (err) {
      return `Erro ao cadastrar tratamento: ${(err as Error).message}`;
    }
  }
}
