import { Injectable, Logger } from '@nestjs/common';
import { AiToolDefinition } from '../../@types';
import { AiToolInterface } from './interfaces/index.js';
import { RegisterMedicationTool } from '../../medications/adapters/in/ai-tools/register-medication.tool';
import { RegisterTreatmentTool } from '../../treatments/adapters/in/ai-tools/register-treatment.tool';
import { ConfirmDoseTool } from '../../reminders/adapters/in/ai-tools/confirm-dose.tool';
import { SkipDoseTool } from '../../reminders/adapters/in/ai-tools/skip-dose.tool';

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
