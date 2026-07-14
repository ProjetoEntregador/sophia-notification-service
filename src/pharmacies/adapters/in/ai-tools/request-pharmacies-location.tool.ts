import { Injectable } from '@nestjs/common';
import { AiToolDefinition } from '@/@types';
import { AiToolInterface } from '@/bot/ai/interfaces/index';
import { ConversationStateService } from '@/bot/messaging/state/conversation-state.service';
import { PharmacyFlowData } from '../types/pharmacy-flow-data.type';

export const PHARMACY_LOCATION_FLOW = 'pharmacy_location';

const MIN_RADIUS_KM = 0.1;
const MAX_RADIUS_KM = 20;
const FLOW_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class RequestPharmaciesLocationTool extends AiToolInterface {
  readonly definition: AiToolDefinition = {
    name: 'request_pharmacies_location',
    description: [
      'Solicita ao usuário a localização atual via WhatsApp para que o sistema possa buscar farmácias próximas. Use quando o usuário perguntar',
      'sobre farmácias perto / próximas / mais próximas. Se o usuário informar uma distância (ex.: "em até 5 km", "raio de 2 km", "no máximo 800 metros"), envie',
      'radiusKm em KM (use decimais quando o usuário falar em metros: "800 metros" → 0.8). Omita radiusKm quando ele só disser "perto", "próxima" ou similar.',
      'Se o paciente citar um ou mais medicamentos que quer comprar (ex.: "farmácia perto que tenha dipirona ou dorflex"), envie medications com esses nomes',
      'para filtrar apenas as farmácias que têm esses remédios. Omita medications quando ele não citar nenhum remédio.',
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
        medications: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Nomes dos medicamentos que o paciente quer encontrar nas farmácias. Ex.: "que tenha dipirona ou dorflex" → ["dipirona", "dorflex"]. Use só o nome do remédio, sem dosagem. Omita quando o paciente não citar nenhum medicamento.',
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
    const flowData: PharmacyFlowData = {};
    const normalizedRadiusKm = this.normalizeRadius(args?.radiusKm);
    if (normalizedRadiusKm !== undefined)
      flowData.radiusKm = normalizedRadiusKm;

    const normalizedMedications = this.normalizeMedications(args?.medications);
    if (normalizedMedications.length > 0) {
      flowData.medications = normalizedMedications;
    }

    this.state.set(
      jid,
      {
        flow: PHARMACY_LOCATION_FLOW,
        step: 0,
        data: flowData,
      },
      FLOW_TTL_MS,
    );

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

  private normalizeMedications(value: unknown): string[] {
    const medicationInputValues = Array.isArray(value) ? value : [value];
    const seenNormalizedNames = new Set<string>();

    const normalizedMedications: string[] = [];
    for (const medicationInputValue of medicationInputValues) {
      if (typeof medicationInputValue !== 'string') continue;
      const medicationName = medicationInputValue.trim();
      if (!medicationName) continue;
      const normalizedNameKey = medicationName.toLowerCase();
      if (seenNormalizedNames.has(normalizedNameKey)) continue;
      seenNormalizedNames.add(normalizedNameKey);
      normalizedMedications.push(medicationName);
    }
    return normalizedMedications;
  }
}
