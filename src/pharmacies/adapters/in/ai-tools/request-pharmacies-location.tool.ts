import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { ConversationStateService } from '@/bot/messaging/state/conversation-state.service';
import { PharmacyFlowData } from '../types/pharmacy-flow-data.type';

export const PHARMACY_LOCATION_FLOW = 'pharmacy_location';

const MIN_RADIUS_METERS = 100;
const MAX_RADIUS_METERS = 20000;

@Injectable()
export class RequestPharmaciesLocationTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'request_pharmacies_location',
    description: [
      'Solicita ao usuário a localização atual via WhatsApp para que o sistema possa buscar farmácias próximas. Use quando o usuário perguntar',
      'sobre farmácias perto / próximas / mais próximas. Se o usuário informar uma distância (ex.: "em até 5 km", "raio de 2 km", "no máximo 800 metros"), envie',
      'radiusMeters em METROS. Omita radiusMeters quando ele só disser "perto", "próxima" ou similar.',
    ].join(' '),
    inputSchema: {
      type: 'object',
      properties: {
        radiusMeters: {
          type: 'number',
          minimum: MIN_RADIUS_METERS,
          maximum: MAX_RADIUS_METERS,
          description:
            'Raio máximo de busca em METROS. Use só quando o paciente disser uma distância explícita. Ex.: "5 km" → 5000, "800 metros" → 800.',
        },
      },
      required: [],
    },
  };

  constructor(private readonly state: ConversationStateService) {
    super();
  }

  async execute(jid: string, args: Record<string, unknown>): Promise<string> {
    const data: PharmacyFlowData = {};
    const radiusMeters = this.normalizeRadius(args.radiusMeters);
    if (radiusMeters !== undefined) data.radiusMeters = radiusMeters;

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
    if (value < MIN_RADIUS_METERS) return MIN_RADIUS_METERS;
    if (value > MAX_RADIUS_METERS) return MAX_RADIUS_METERS;
    return Math.round(value);
  }
}
