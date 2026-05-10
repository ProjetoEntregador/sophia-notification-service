import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '../../../@types';
import { RegisterTreatmentUseCase } from '../../../treatments/application/use-cases/register-treatment.usecase';
import { jidToUserId } from '../../../utils/functions.js';
import { AiToolInterface } from '../interfaces/index.js';
import { FindMedicationByNameUseCase } from '../../../medications/application/use-cases/find-medication-by-name.usecase';

type RegisterTreatmentArgs = {
  medications: string[];
  intervalHours: number;
  startTime: string;
  endTime?: string;
  durationDays?: number;
};

@Injectable()
export class RegisterTreatmentTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'register_treatment',
    description:
      'Cadastra um novo tratamento medicamentoso para o paciente. Use quando o usuário pedir para cadastrar/iniciar um tratamento. Forneça endTime OU durationDays — não ambos.',
    inputSchema: {
      type: 'object',
      properties: {
        medications: {
          type: 'array',
          items: { type: 'string' },
          description: 'Nome dos medicamentos usados no tratamento.',
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
            'Data e hora de término em ISO 8601. Use SOMENTE se o usuário informou a data/hora final explicitamente.',
        },
        durationDays: {
          type: 'integer',
          minimum: 1,
          maximum: 365,
          description:
            'Duração do tratamento em dias. Use quando o usuário disser "durante N dias" / "por N dias" / "1 semana" (= 7) etc., em vez de endTime.',
        },
      },
      required: ['medications', 'intervalHours', 'startTime'],
    },
  };

  constructor(
    private readonly registerTreatment: RegisterTreatmentUseCase,
    private readonly findMedication: FindMedicationByNameUseCase,
  ) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const input = args as RegisterTreatmentArgs;

    const start = new Date(input.startTime);
    if (Number.isNaN(start.getTime())) {
      return 'Erro: startTime não está em formato ISO 8601 válido.';
    }

    let end: Date;
    if (input.endTime) {
      end = new Date(input.endTime);
      if (Number.isNaN(end.getTime())) {
        return 'Erro: endTime não está em formato ISO 8601 válido.';
      }
    } else if (
      typeof input.durationDays === 'number' &&
      input.durationDays > 0
    ) {
      end = new Date(
        start.getTime() + input.durationDays * 24 * 60 * 60 * 1000,
      );
    } else {
      return 'Erro: forneça endTime (ISO 8601) ou durationDays (inteiro positivo).';
    }

    if (end <= start) {
      return 'Erro: o término precisa ser posterior ao início.';
    }

    try {
      const medicationsId: string[] = [];

      for (const medicationName of input.medications) {
        const matches = await this.findMedication.execute(medicationName, jid);

        if (matches.length === 0) {
          return `Erro: o medicamento "${medicationName}" não está cadastrado. Cadastre-o primeiro com a ferramenta register_medication antes de iniciar o tratamento.`;
        }

        const exact = matches.find(
          (m) =>
            m.name.trim().toLowerCase() === medicationName.trim().toLowerCase(),
        );
        const chosen = exact ?? matches[0];
        medicationsId.push(chosen.id);
      }

      const treatment = await this.registerTreatment.execute({
        userId: jidToUserId(jid),
        jid,
        intervalHours: input.intervalHours,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        medicationsIds: medicationsId,
      });
      return `Tratamento cadastrado com id ${treatment.id}: a cada ${input.intervalHours}h, de ${start.toISOString()} até ${end.toISOString()}.`;
    } catch (err) {
      return `Erro ao cadastrar tratamento: ${(err as Error).message}`;
    }
  }
}
