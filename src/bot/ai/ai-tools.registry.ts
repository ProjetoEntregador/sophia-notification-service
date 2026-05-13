import { Injectable, Logger } from '@nestjs/common';
import { AiToolDefinition } from '@/@types/ai';
import { AiToolInterface } from './interfaces';
import { RegisterMedicationTool } from '@/medications/adapters/in/ai-tools/register-medication.tool';
import { UpdateMedicationQuantityTool } from '@/medications/adapters/in/ai-tools/update-medication-quantity.tool';
import { RegisterTreatmentTool } from '@/treatments/adapters/in/ai-tools/register-treatment.tool';
import { ListMyTreatmentsTool } from '@/treatments/adapters/in/ai-tools/list-my-treatments.tool';
import { UpdateTreatmentTool } from '@/treatments/adapters/in/ai-tools/update-treatment.tool';
import { CancelTreatmentTool } from '@/treatments/adapters/in/ai-tools/cancel-treatment.tool';
import { ConfirmDoseTool } from '@/reminders/adapters/in/ai-tools/confirm-dose.tool';
import { SkipDoseTool } from '@/reminders/adapters/in/ai-tools/skip-dose.tool';
import { ListTodayRemindersTool } from '@/reminders/adapters/in/ai-tools/list-today-reminders.tool';
import { ListUpcomingRemindersTool } from '@/reminders/adapters/in/ai-tools/list-upcoming-reminders.tool';

@Injectable()
export class AiToolsRegistry {
  private readonly logger = new Logger(AiToolsRegistry.name);
  private readonly byName = new Map<string, AiToolInterface>();

  constructor(
    registerMedication: RegisterMedicationTool,
    updateMedicationQuantity: UpdateMedicationQuantityTool,
    registerTreatment: RegisterTreatmentTool,
    listMyTreatments: ListMyTreatmentsTool,
    updateTreatment: UpdateTreatmentTool,
    cancelTreatment: CancelTreatmentTool,
    confirmDose: ConfirmDoseTool,
    skipDose: SkipDoseTool,
    listTodayReminders: ListTodayRemindersTool,
    listUpcomingReminders: ListUpcomingRemindersTool,
  ) {
    for (const tool of [
      registerMedication,
      updateMedicationQuantity,
      registerTreatment,
      listMyTreatments,
      updateTreatment,
      cancelTreatment,
      confirmDose,
      skipDose,
      listTodayReminders,
      listUpcomingReminders,
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
