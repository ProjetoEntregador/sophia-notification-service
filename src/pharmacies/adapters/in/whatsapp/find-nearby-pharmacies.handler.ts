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
import { PendingFilter } from './types/pending-filters.type';

const LOCATION_PREFIX = '__location__|';
const MAX_RESULTS = 5;
const MAX_MEDS_PER_PHARMACY = 5;
const FILTER_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class FindNearbyPharmaciesHandler extends MessageHandlerInterface {
  private readonly logger = new Logger(FindNearbyPharmaciesHandler.name);
  private readonly pendingFilters = new Map<string, PendingFilter>();

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
    this.rememberFilter(jid, flowData.medications);
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
    this.takeFilter(jid);
    await this.sender.typingMessage(jid);
    await this.sender.sendText(
      jid,
      'Não encontrei farmácias próximas da sua localização. 😕',
    );
  }

  async replyResults(jid: string, pharmacies: Pharmacy[]): Promise<void> {
    const terms = this.takeFilter(jid);
    const { pharmacies: result, filtered } = this.applyMedicationFilter(
      pharmacies,
      terms,
    );

    await this.sender.typingMessage(jid);

    if (filtered && result.length === 0) {
      await this.sender.sendText(jid, this.formatNoMatchMessage(terms));
      return;
    }

    await this.sender.sendText(
      jid,
      this.formatPharmaciesMessage(result, terms),
    );
  }

  private async replyError(jid: string, err: Error): Promise<void> {
    await this.sender.typingMessage(jid);
    await this.sender.sendText(
      jid,
      `Não consegui buscar farmácias no momento: ${err.message}`,
    );
  }

  private formatPharmaciesMessage(
    pharmacies: Pharmacy[],
    terms: string[],
  ): string {
    const shown = pharmacies.slice(0, MAX_RESULTS);
    const blocks = shown.map((p, i) => this.formatPharmacyBlock(p, i));
    const title =
      terms.length > 0
        ? `🏥 *Farmácias próximas com ${this.filterLabel(terms)}* (${shown.length}):`
        : `🏥 *Farmácias próximas* (${shown.length}):`;
    return `${title}\n\n${blocks.join('\n\n')}`;
  }

  private formatNoMatchMessage(terms: string[]): string {
    return `Não encontrei farmácias próximas com ${this.filterLabel(terms)}. 😕`;
  }

  private rememberFilter(jid: string, medications?: string[]): void {
    if (!medications || medications.length === 0) {
      this.pendingFilters.delete(jid);
      return;
    }
    this.pendingFilters.set(jid, {
      terms: medications,
      expiresAt: Date.now() + FILTER_TTL_MS,
    });
  }

  private takeFilter(jid: string): string[] {
    const entry = this.pendingFilters.get(jid);
    this.pendingFilters.delete(jid);
    if (!entry || Date.now() > entry.expiresAt) return [];
    return entry.terms;
  }

  private applyMedicationFilter(
    pharmacies: Pharmacy[],
    terms: string[],
  ): { pharmacies: Pharmacy[]; filtered: boolean } {
    const normTerms = terms
      .map((t) => this.normalizeTerm(t))
      .filter((t) => t.length > 0);
    if (normTerms.length === 0) return { pharmacies, filtered: false };

    const matches: Pharmacy[] = [];
    for (const p of pharmacies) {
      const matching = p.medications.filter((m) =>
        this.medicationMatches(m, normTerms),
      );
      if (matching.length === 0) continue;

      matches.push(
        new Pharmacy(
          p.id,
          p.name,
          p.phone,
          p.address,
          p.city,
          p.distanceKm,
          matching,
        ),
      );
    }

    return { pharmacies: matches, filtered: true };
  }

  private medicationMatches(
    m: PharmacyMedication,
    normTerms: string[],
  ): boolean {
    const name = this.normalizeTerm(m.name);
    if (!name) return false;
    return normTerms.some((t) => name.includes(t) || t.includes(name));
  }

  private normalizeTerm(value: string): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private filterLabel(terms: string[]): string {
    const labels = terms.map((t) => this.capitalize(t));
    if (labels.length <= 1) return labels[0] ?? '';
    return `${labels.slice(0, -1).join(', ')} ou ${labels[labels.length - 1]}`;
  }

  private capitalize(value: string): string {
    const t = value.trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
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
