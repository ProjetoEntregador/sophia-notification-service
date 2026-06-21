import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { GetAdherenceReportUseCase } from '@/reminders/application/use-cases/get-adherence-report.usecase';
import { EnsureUserByJidUseCase } from '@/users/application/use-cases/ensure-user-by-jid.usecase';

type AdherenceArgs = { rangeDays?: number };

const DEFAULT_RANGE = 7;
const MIN_RANGE = 1;
const MAX_RANGE = 90;

@Injectable()
export class GetAdherenceReportTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'get_adherence_report',
    description:
      'Calcula o relatório de adesão do paciente: percentual de doses confirmadas vs puladas vs não respondidas, agrupado por medicamento, nos últimos N dias. Use quando o paciente perguntar "como está minha adesão?", "estou tomando direito?", "relatório dos remédios".',
    inputSchema: {
      type: 'object',
      properties: {
        rangeDays: {
          type: 'integer',
          minimum: MIN_RANGE,
          maximum: MAX_RANGE,
          description: `Janela em dias para o relatório (1..${MAX_RANGE}). Default ${DEFAULT_RANGE}.`,
        },
      },
      required: [],
    },
  };

  constructor(
    private readonly adherence: GetAdherenceReportUseCase,
    private readonly ensureUser: EnsureUserByJidUseCase,
  ) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const input = (args ?? {}) as AdherenceArgs;
    const rangeDays = this.normalizeRange(input.rangeDays);

    try {
      const user = await this.ensureUser.execute(jid);
      const report = await this.adherence.execute(user.id, rangeDays);
      if (report.lines.length === 0) {
        return `Sem doses registradas nos últimos ${rangeDays} dias.`;
      }

      const overall = report.overall;
      const overallPct = Math.round(overall.adherenceRate * 100);
      const lines = report.lines.map((l) => {
        const pct = Math.round(l.adherenceRate * 100);
        return `• ${l.medicationName}: ${l.confirmed}/${l.total} (${pct}% — ${l.confirmed} tomadas, ${l.skipped} puladas, ${l.pending} sem resposta)`;
      });

      return [
        `Adesão dos últimos ${rangeDays} dia(s):`,
        ...lines,
        '',
        `Total: ${overall.confirmed}/${overall.total} doses (${overallPct}% de adesão).`,
      ].join('\n');
    } catch (err) {
      return `Erro ao gerar relatório de adesão: ${(err as Error).message}`;
    }
  }

  private normalizeRange(value: number | undefined): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return DEFAULT_RANGE;
    }
    if (value < MIN_RANGE) return MIN_RANGE;
    if (value > MAX_RANGE) return MAX_RANGE;
    return Math.round(value);
  }
}
