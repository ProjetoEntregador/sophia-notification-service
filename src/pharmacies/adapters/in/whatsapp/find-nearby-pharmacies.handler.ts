import { Injectable, Logger } from '@nestjs/common';
import { MessageHandlerInterface } from '@/bot/interfaces/index';
import { MessageSender } from '@/shared/ports/message-sender.port';
import { ConversationStateService } from '@/bot/messaging/state/conversation-state.service';
import { FindNearbyPharmaciesUseCase } from '@/pharmacies/application/use-cases/find-nearby-pharmacies.usecase';
import { Pharmacy } from '@/pharmacies/domain/pharmacy.entity';
import { PharmacyMedication } from '@/pharmacies/domain/pharmacy-medication.entity';
import { PHARMACY_LOCATION_FLOW } from '../ai-tools/request-pharmacies-location.tool';
import { PharmacyFlowData } from '../types/pharmacy-flow-data.type';
import { Coordinates } from './types/coordinates.type';

const LOCATION_PREFIX = '__location__|';
const MAX_RESULTS = 5;
const MAX_MEDS_PER_PHARMACY = 5;

@Injectable()
export class FindNearbyPharmaciesHandler extends MessageHandlerInterface {
  private readonly logger = new Logger(FindNearbyPharmaciesHandler.name);

  constructor(
    private readonly findNearby: FindNearbyPharmaciesUseCase,
    private readonly state: ConversationStateService,
    private readonly sender: MessageSender,
  ) {
    super();
  }

  canHandle(text: string): boolean {
    return text.startsWith(LOCATION_PREFIX);
  }

  async handle(jid: string, text: string): Promise<void> {
    const flowData = this.readActiveFlowData(jid);
    if (flowData === null) {
      this.logger.debug(
        `Localização recebida de ${jid} sem flow ativo — ignorando.`,
      );
      return;
    }

    const coords = this.parseCoordinates(text);
    if (!coords) {
      await this.replyInvalidCoordinates(jid);
      return;
    }

    this.state.clear(jid);
    await this.search(jid, coords, flowData.radiusKm);
  }

  private readActiveFlowData(jid: string): PharmacyFlowData | null {
    const current = this.state.get(jid);
    if (!current || current.flow !== PHARMACY_LOCATION_FLOW) return null;
    return current.data;
  }

  private parseCoordinates(text: string): Coordinates | null {
    const [, latStr, lngStr] = text.split('|');
    const latitude = Number(latStr);
    const longitude = Number(lngStr);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  }

  private async search(
    jid: string,
    coords: Coordinates,
    radiusKm: number | undefined,
  ): Promise<void> {
    try {
      await this.findNearby.execute(
        jid,
        coords.latitude,
        coords.longitude,
        radiusKm,
      );
    } catch (err) {
      await this.replyError(jid, err as Error);
    }
  }

  private async replyInvalidCoordinates(jid: string): Promise<void> {
    await this.sender.typingMessage(jid);
    await this.sender.sendText(
      jid,
      'Não consegui ler a localização. Tente enviar de novo (📎 → Localização).',
    );
  }

  async replyNoResults(jid: string): Promise<void> {
    await this.sender.typingMessage(jid);
    await this.sender.sendText(
      jid,
      'Não encontrei farmácias próximas da sua localização. 😕',
    );
  }

  async replyResults(jid: string, pharmacies: Pharmacy[]): Promise<void> {
    await this.sender.typingMessage(jid);
    await this.sender.sendText(jid, this.formatPharmaciesMessage(pharmacies));
  }

  private async replyError(jid: string, err: Error): Promise<void> {
    await this.sender.typingMessage(jid);
    await this.sender.sendText(
      jid,
      `Não consegui buscar farmácias no momento: ${err.message}`,
    );
  }

  private formatPharmaciesMessage(pharmacies: Pharmacy[]): string {
    const shown = pharmacies.slice(0, MAX_RESULTS);
    const blocks = shown.map((p, i) => this.formatPharmacyBlock(p, i));
    return `🏥 *Farmácias próximas* (${shown.length}):\n\n${blocks.join('\n\n')}`;
  }

  private formatPharmacyBlock(p: Pharmacy, index: number): string {
    const header = `${index + 1}. *${p.name}* — ${p.distanceLabel()}`;
    const location = `   📍 ${p.address}${p.city ? `, ${p.city}` : ''}`;
    const phone = p.phone ? `\n   📞 ${p.phone}` : '';
    const meds = this.formatMedicationsSection(p.medications);
    return `${header}\n${location}${phone}${meds}`;
  }

  private formatMedicationsSection(meds: PharmacyMedication[]): string {
    if (!meds || meds.length === 0) return '';
    const shown = meds.slice(0, MAX_MEDS_PER_PHARMACY);
    const rest = meds.length - shown.length;
    const items = shown.map((m) => this.formatMedicationLine(m));
    const more = rest > 0 ? `\n      _… e mais ${rest} medicamento(s)_` : '';
    return `\n   💊 *Disponíveis:*\n${items.join('\n')}${more}`;
  }

  private formatMedicationLine(m: PharmacyMedication): string {
    const stripe = m.stripeEmoji();
    const stripeTag = stripe ? ` ${stripe}` : '';
    const dosage = m.dosage ? ` ${m.dosage}` : '';
    const form = m.pharmaceuticalForm ? ` — ${m.pharmaceuticalForm}` : '';
    const manufacturer = m.manufacturer ? `${m.manufacturer} · ` : '';
    const prescription = m.prescriptionRequired
      ? '📋 _receita obrigatória_'
      : '_venda livre_';
    return [
      `      • *${m.name}*${stripeTag}${dosage}${form}`,
      `        ${manufacturer}${m.priceLabel()} · ${prescription}`,
    ].join('\n');
  }
}
