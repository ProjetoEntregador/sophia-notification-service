import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '../../../../@types';
import { jidToUserId } from '../../../../utils/functions.js';
import { AiToolInterface } from '../../../../bot/ai/interfaces/index.js';
import { RegisterMedicationUseCase } from '../../../application/use-cases/register-medication.usecase';

type RegisterMedicationArgs = {
  name: string;
  quantity: number;
};

@Injectable()
export class RegisterMedicationTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'register_medication',
    description:
      'Cadastra um novo medicamento no estoque do paciente. Use antes do usuário pedir para cadastrar/iniciar um tratamento.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome do medicamento.' },
        quantity: {
          type: 'integer',
          minimum: 1,
          maximum: 200,
          description:
            'Unidades usáveis (cápsulas, comprimidos) do medicamento.',
        },
      },
      required: ['name', 'quantity'],
    },
  };

  constructor(private readonly registerMedication: RegisterMedicationUseCase) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const input = args as RegisterMedicationArgs;

    try {
      const medication = await this.registerMedication.execute({
        userId: jidToUserId(jid),
        jid,
        name: input.name,
        quantity: input.quantity,
      });
      return `Medicamento cadastrado com id ${medication.id}: o medicamento ${input.name} possui ${input.quantity} unidades.`;
    } catch (err) {
      return `Erro ao cadastrar medicamento: ${(err as Error).message}`;
    }
  }
}
