import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { ListLowStockMedicationsUseCase } from '@/medications/application/use-cases/list-low-stock.usecase';
import { EnsureUserByJidUseCase } from '@/users/application/use-cases/ensure-user-by-jid.usecase';

type ListLowStockArgs = { daysAhead?: number };

const DEFAULT_DAYS = 7;
const MIN_DAYS = 1;
const MAX_DAYS = 60;

@Injectable()
export class ListLowStockMedicationsTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'list_low_stock_medications',
    description:
      'Lista medicamentos cujo estoque não vai durar até N dias à frente, dado o ritmo dos tratamentos ativos. Use quando o paciente perguntar "estou com pouco remédio?", "o que vai acabar?", "preciso comprar algo?".',
    inputSchema: {
      type: 'object',
      properties: {
        daysAhead: {
          type: 'integer',
          minimum: MIN_DAYS,
          maximum: MAX_DAYS,
          description: `Horizonte de projeção em dias. Default ${DEFAULT_DAYS}.`,
        },
      },
      required: [],
    },
  };

  constructor(
    private readonly listLowStock: ListLowStockMedicationsUseCase,
    private readonly ensureUser: EnsureUserByJidUseCase,
  ) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const input = (args ?? {}) as ListLowStockArgs;
    const daysAhead = this.normalizeDays(input.daysAhead);

    try {
      const user = await this.ensureUser.execute(jid);
      const items = await this.listLowStock.execute(user.id, daysAhead);
      if (items.length === 0) {
        return `Nenhum medicamento vai acabar nos próximos ${daysAhead} dias.`;
      }
      const lines = items.map(
        (i, idx) =>
          `${idx + 1}. ${i.medicationName} — em estoque: ${i.currentQuantity}. Vai acabar antes de ${daysAhead} dias.`,
      );
      return `Medicamentos para repor (até ${daysAhead} dias):\n${lines.join('\n')}`;
    } catch (err) {
      return `Erro ao listar medicamentos com pouco estoque: ${(err as Error).message}`;
    }
  }

  private normalizeDays(value: number | undefined): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return DEFAULT_DAYS;
    }
    if (value < MIN_DAYS) return MIN_DAYS;
    if (value > MAX_DAYS) return MAX_DAYS;
    return Math.round(value);
  }
}
