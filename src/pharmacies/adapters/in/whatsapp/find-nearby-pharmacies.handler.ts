import { Injectable, Logger } from '@nestjs/common';
import { MessageHandlerInterface } from '@/bot/interfaces/index';
import { MessageSender } from '@/shared/ports/message-sender.port';
import { ConversationStateService } from '@/bot/messaging/state/conversation-state.service';
import { FindNearbyPharmaciesUseCase } from '@/pharmacies/application/use-cases/find-nearby-pharmacies.usecase';
import { Pharmacy } from '@/pharmacies/domain/pharmacy.entity';
import { PHARMACY_LOCATION_FLOW } from '../ai-tools/request-pharmacies-location.tool';
import { PharmacyFlowData } from '../types/pharmacy-flow-data.type';
import { Coordinates } from './types/coordinates.type';

const LOCATION_PREFIX = '__location__|';
const MAX_RESULTS = 5;

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
    await this.searchAndReply(jid, coords, flowData.radiusKm);
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

  private async searchAndReply(
    jid: string,
    coords: Coordinates,
    radiusKm: number | undefined,
  ): Promise<void> {
    try {
      const pharmacies = await this.findNearby.execute(
        coords.latitude,
        coords.longitude,
        radiusKm,
      );
      if (pharmacies.length === 0) {
        await this.replyNoResults(jid);
        return;
      }
      await this.replyResults(jid, pharmacies);
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

  private async replyNoResults(jid: string): Promise<void> {
    await this.sender.typingMessage(jid);
    await this.sender.sendText(
      jid,
      'Não encontrei farmácias próximas da sua localização. 😕',
    );
  }

  private async replyResults(
    jid: string,
    pharmacies: Pharmacy[],
  ): Promise<void> {
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
    const lines = shown.map((p, i) => this.formatPharmacyLine(p, i));
    return `Farmácias próximas (até ${shown.length}):\n\n${lines.join('\n\n')}`;
  }

  private formatPharmacyLine(p: Pharmacy, index: number): string {
    const phone = p.phone ? `\n   📞 ${p.phone}` : '';
    return `${index + 1}. *${p.name}* — ${p.distanceLabel()}\n   ${p.address}${phone}`;
  }
}
