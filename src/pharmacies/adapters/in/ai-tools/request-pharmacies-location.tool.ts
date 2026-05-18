import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { ConversationStateService } from '@/bot/messaging/state/conversation-state.service';
import { PharmacyFlowData } from '../types/pharmacy-flow-data.type';

export const PHARMACY_LOCATION_FLOW = 'pharmacy_location';

const MIN_RADIUS_KM = 0.1;
const MAX_RADIUS_KM = 20;

@Injectable()
export class RequestPharmaciesLocationTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'request_pharmacies_location',
    description: [
      'Solicita ao usuário a localização atual via WhatsApp para que o sistema possa buscar farmácias próximas. Use quando o usuário perguntar',
      'sobre farmácias perto / próximas / mais próximas. Se o usuário informar uma distância (ex.: "em até 5 km", "raio de 2 km", "no máximo 800 metros"), envie',
      'radiusKm em KM (use decimais quando o usuário falar em metros: "800 metros" → 0.8). Omita radiusKm quando ele só disser "perto", "próxima" ou similar.',
    ].join(' '),
    inputSchema: {
      type: 'object',
      properties: {
        radiusKm: {
          type: 'number',
          minimum: MIN_RADIUS_KM,
          maximum: MAX_RADIUS_KM,
          description:
            'Raio máximo de busca em KM. Use só quando o paciente disser uma distância explícita. Ex.: "5 km" → 5, "800 metros" → 0.8, "2.5 km" → 2.5.',
        },
      },
      required: [],
    },
  };

  constructor(private readonly state: ConversationStateService) {
    super();
  }

  async execute(
    jid: string,
    args: Record<string, unknown> | null | undefined,
  ): Promise<string> {
    const data: PharmacyFlowData = {};
    const radiusKm = this.normalizeRadius(args?.radiusKm);
    if (radiusKm !== undefined) data.radiusKm = radiusKm;

    this.state.set(jid, {
      flow: PHARMACY_LOCATION_FLOW,
      step: 0,
      data,
    });

    return [
      'Pedido de localização ativado para o paciente.',
      'Responda ao paciente pedindo que envie a localização atual usando o anexo do WhatsApp (📎 → Localização → Localização atual).',
    ].join(' ');
  }

  private normalizeRadius(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
    if (value < MIN_RADIUS_KM) return MIN_RADIUS_KM;
    if (value > MAX_RADIUS_KM) return MAX_RADIUS_KM;
    return Math.round(value * 10) / 10;
  }
}
