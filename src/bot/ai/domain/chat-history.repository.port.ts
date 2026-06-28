import { AiChatMessage } from '@/@types';

export abstract class ChatHistoryRepository {
  abstract get(jid: string): Promise<AiChatMessage[]>;
  abstract append(jid: string, message: AiChatMessage): Promise<void>;
  abstract clear(jid: string): Promise<void>;
  abstract length(jid: string): Promise<number>;
  abstract truncate(jid: string, length: number): Promise<void>;
}
