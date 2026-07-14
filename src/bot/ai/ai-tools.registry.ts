import { Injectable, Logger } from '@nestjs/common';
import { AiToolDefinition } from '@/@types/ai';
import { AiToolInterface } from './interfaces';
import { RegisterMedicationTool } from '@/medications/adapters/in/ai-tools/register-medication.tool';
import { UpdateMedicationQuantityTool } from '@/medications/adapters/in/ai-tools/update-medication-quantity.tool';
import { DeleteMedicationTool } from '@/medications/adapters/in/ai-tools/delete-medication.tool';
import { ListLowStockMedicationsTool } from '@/medications/adapters/in/ai-tools/list-low-stock-medications.tool';
import { RegisterTreatmentTool } from '@/treatments/adapters/in/ai-tools/register-treatment.tool';
import { ListMyTreatmentsTool } from '@/treatments/adapters/in/ai-tools/list-my-treatments.tool';
import { UpdateTreatmentTool } from '@/treatments/adapters/in/ai-tools/update-treatment.tool';
import { CancelTreatmentTool } from '@/treatments/adapters/in/ai-tools/cancel-treatment.tool';
import { PauseTreatmentTool } from '@/treatments/adapters/in/ai-tools/pause-treatment.tool';
import { ResumeTreatmentTool } from '@/treatments/adapters/in/ai-tools/resume-treatment.tool';
import { ConfirmDoseTool } from '@/reminders/adapters/in/ai-tools/confirm-dose.tool';
import { SkipDoseTool } from '@/reminders/adapters/in/ai-tools/skip-dose.tool';
import { ListTodayRemindersTool } from '@/reminders/adapters/in/ai-tools/list-today-reminders.tool';
import { ListUpcomingRemindersTool } from '@/reminders/adapters/in/ai-tools/list-upcoming-reminders.tool';
import { GetAdherenceReportTool } from '@/reminders/adapters/in/ai-tools/get-adherence-report.tool';
import { RequestPharmaciesLocationTool } from '@/pharmacies/adapters/in/ai-tools/request-pharmacies-location.tool';
import { SetQuietHoursTool } from '@/users/adapters/in/ai-tools/set-quiet-hours.tool';

@Injectable()
export class AiToolsRegistry {
  private readonly logger = new Logger(AiToolsRegistry.name);
  private readonly byName = new Map<string, AiToolInterface>();

  constructor(
    registerMedication: RegisterMedicationTool,
    updateMedicationQuantity: UpdateMedicationQuantityTool,
    deleteMedication: DeleteMedicationTool,
    listLowStockMedications: ListLowStockMedicationsTool,
    registerTreatment: RegisterTreatmentTool,
    listMyTreatments: ListMyTreatmentsTool,
    updateTreatment: UpdateTreatmentTool,
    cancelTreatment: CancelTreatmentTool,
    pauseTreatment: PauseTreatmentTool,
    resumeTreatment: ResumeTreatmentTool,
    confirmDose: ConfirmDoseTool,
    skipDose: SkipDoseTool,
    listTodayReminders: ListTodayRemindersTool,
    listUpcomingReminders: ListUpcomingRemindersTool,
    getAdherenceReport: GetAdherenceReportTool,
    requestPharmaciesLocation: RequestPharmaciesLocationTool,
    setQuietHours: SetQuietHoursTool,
  ) {
    for (const tool of [
      registerMedication,
      updateMedicationQuantity,
      deleteMedication,
      listLowStockMedications,
      registerTreatment,
      listMyTreatments,
      updateTreatment,
      cancelTreatment,
      pauseTreatment,
      resumeTreatment,
      confirmDose,
      skipDose,
      listTodayReminders,
      listUpcomingReminders,
      getAdherenceReport,
      requestPharmaciesLocation,
      setQuietHours,
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
