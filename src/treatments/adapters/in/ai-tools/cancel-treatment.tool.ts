import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { FindTreatmentByMedicationNameUseCase } from '@/treatments/application/use-cases/find-treatment-by-medication-name.usecase';
import { CancelTreatmentUseCase } from '@/treatments/application/use-cases/cancel-treatment.usecase';
import { EnsureUserByJidUseCase } from '@/users/application/use-cases/ensure-user-by-jid.usecase';

type CancelTreatmentArgs = {
  medicationName: string;
};

@Injectable()
export class CancelTreatmentTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'cancel_treatment',
    description:
      'Cancela (apaga) um tratamento e todos os seus lembretes pendentes. Identifica pelo nome do medicamento. AÇÃO DESTRUTIVA: só chame após o usuário confirmar explicitamente.',
    inputSchema: {
      type: 'object',
      properties: {
        medicationName: {
          type: 'string',
          description: 'Nome do medicamento do tratamento a cancelar.',
        },
      },
      required: ['medicationName'],
    },
  };

  constructor(
    private readonly findByMed: FindTreatmentByMedicationNameUseCase,
    private readonly cancel: CancelTreatmentUseCase,
    private readonly ensureUser: EnsureUserByJidUseCase,
  ) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const input = args as CancelTreatmentArgs;
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
        return `Erro: mais de um tratamento de "${input.medicationName}". Peça ao usuário para escolher (por data/intervalo) antes de cancelar.`;
      }
      await this.cancel.execute(matches[0].id);
      return `Tratamento de "${input.medicationName}" cancelado. Lembretes pendentes foram removidos.`;
    } catch (err) {
      return `Erro ao cancelar tratamento: ${(err as Error).message}`;
    }
  }
}
