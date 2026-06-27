import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { RegisterMedicationUseCase } from '@/medications/application/use-cases/register-medication.usecase';
import { EnsureUserByJidUseCase } from '@/users/application/use-cases/ensure-user-by-jid.usecase';
import {
  RegisterMedicationArgs,
  RegisterMedicationValidation,
} from './types/register-medication-args.type';
import { MISSING_DATA_MESSAGE } from './constants/register-medication.constants';

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

  constructor(
    private readonly registerMedication: RegisterMedicationUseCase,
    private readonly ensureUser: EnsureUserByJidUseCase,
  ) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const validation = this.validate(args);
    if ('error' in validation) {
      return validation.error;
    }

    const { name, quantity } = validation;

    try {
      const user = await this.ensureUser.execute(jid);
      const medication = await this.registerMedication.execute({
        userId: user.id,
        name,
        quantity,
      });
      return `Medicamento cadastrado com id ${medication.id}: o medicamento ${name} possui ${quantity} unidades.`;
    } catch (err) {
      return `Erro ao cadastrar medicamento: ${(err as Error).message}`;
    }
  }

  private validate(
    args: Record<string, unknown>,
  ): RegisterMedicationValidation {
    const input = (args ?? {}) as RegisterMedicationArgs;

    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const quantity =
      typeof input.quantity === 'number' ? input.quantity : Number.NaN;

    if (!name || !Number.isInteger(quantity) || quantity < 1) {
      return { error: MISSING_DATA_MESSAGE };
    }

    return { name, quantity };
  }
}
