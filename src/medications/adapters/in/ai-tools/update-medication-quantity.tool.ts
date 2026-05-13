import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { UpdateMedicationQuantityUseCase } from '@/medications/application/use-cases/update-medication-quantity.usecase';
import { EnsureUserByJidUseCase } from '@/users/application/use-cases/ensure-user-by-jid.usecase';

type UpdateMedQuantityArgs = { name: string; quantity: number };

@Injectable()
export class UpdateMedicationQuantityTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'update_medication_quantity',
    description:
      'Atualiza a quantidade em estoque de um medicamento já cadastrado. Use quando o usuário disser que comprou mais ou que sobrou X.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome do medicamento.' },
        quantity: {
          type: 'integer',
          minimum: 0,
          maximum: 1000,
          description: 'Nova quantidade total em estoque.',
        },
      },
      required: ['name', 'quantity'],
    },
  };

  constructor(
    private readonly updateQty: UpdateMedicationQuantityUseCase,
    private readonly ensureUser: EnsureUserByJidUseCase,
  ) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const input = args as UpdateMedQuantityArgs;
    try {
      const user = await this.ensureUser.execute(jid);
      const med = await this.updateQty.execute(
        user.id,
        input.name,
        input.quantity,
      );
      return `Quantidade de "${med.name}" atualizada para ${med.quantity}.`;
    } catch (err) {
      return `Erro ao atualizar quantidade: ${(err as Error).message}`;
    }
  }
}
