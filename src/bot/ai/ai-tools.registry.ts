import { Injectable, Logger } from '@nestjs/common';
import { AiToolDefinition } from '../../@types';
import { AiToolInterface } from './interfaces/index.js';
import { RegisterMedicationTool } from './tools/register-medication.tool.js';
import { RegisterTreatmentTool } from './tools/register-treatment.tool.js';
import { ConfirmDoseTool } from './tools/confirm-dose.tool.js';
import { SkipDoseTool } from './tools/skip-dose.tool.js';

@Injectable()
export class AiToolsRegistry {
  private readonly logger = new Logger(AiToolsRegistry.name);
  private readonly byName = new Map<string, AiToolInterface>();

  constructor(
    registerMedication: RegisterMedicationTool,
    registerTreatment: RegisterTreatmentTool,
    confirmDose: ConfirmDoseTool,
    skipDose: SkipDoseTool,
  ) {
    for (const tool of [
      registerMedication,
      registerTreatment,
      confirmDose,
      skipDose,
    ]) {
      this.byName.set(tool.definition.name, tool);
    }
  }

  definitions(): AiToolDefinition[] {
    return Array.from(this.byName.values()).map((t) => t.definition);
  }

  async execute(
    jid: string,
    name: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    const tool = this.byName.get(name);
    if (!tool) {
      this.logger.warn(`Tool desconhecida solicitada pela IA: ${name}`);
      return `Erro: ferramenta "${name}" não existe.`;
    }
    return tool.execute(jid, args);
  }
}
