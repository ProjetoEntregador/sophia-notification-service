import { Injectable } from '@nestjs/common';
import { MAX_HISTORY_MESSAGES } from './ai.constants';
import { AiChatMessage } from '@/@types';

@Injectable()
export class ChatHistoryService {
  private readonly histories = new Map<string, AiChatMessage[]>();

  get(jid: string): AiChatMessage[] {
    return this.histories.get(jid) ?? [];
  }

  append(jid: string, message: AiChatMessage): void {
    const current = this.histories.get(jid) ?? [];
    current.push(message);
    if (current.length > MAX_HISTORY_MESSAGES) {
      current.splice(0, current.length - MAX_HISTORY_MESSAGES);
    }
    this.histories.set(jid, current);
  }

  clear(jid: string): void {
    this.histories.delete(jid);
  }
}
