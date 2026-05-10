import { AiChatRequest, AiChatResponse } from '@/@types';

export abstract class AiServiceInterface {
  abstract chat(request: AiChatRequest): Promise<AiChatResponse>;
}
