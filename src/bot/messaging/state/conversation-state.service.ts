import { Injectable } from '@nestjs/common';
import { ConversationState } from '@/@types';

// TODO: persistir em Postgres/Redis quando o bot rodar com múltiplas instâncias.
@Injectable()
export class ConversationStateService {
  private readonly states = new Map<string, ConversationState>();

  get(jid: string): ConversationState | undefined {
    return this.states.get(jid);
  }

  set(jid: string, state: ConversationState): void {
    this.states.set(jid, state);
  }

  clear(jid: string): void {
    this.states.delete(jid);
  }
}
