import { Injectable } from '@nestjs/common';
import { ConversationState } from '@/@types';

type StoredState = {
  state: ConversationState;
  expiresAt: number | null;
};

@Injectable()
export class ConversationStateService {
  private readonly states = new Map<string, StoredState>();

  get(jid: string): ConversationState | undefined {
    const stored = this.states.get(jid);
    if (!stored) return undefined;
    if (stored.expiresAt !== null && Date.now() > stored.expiresAt) {
      this.states.delete(jid);
      return undefined;
    }
    return stored.state;
  }

  set(jid: string, state: ConversationState, ttlMs?: number): void {
    const expiresAt =
      typeof ttlMs === 'number' && ttlMs > 0 ? Date.now() + ttlMs : null;
    this.states.set(jid, { state, expiresAt });
  }

  clear(jid: string): void {
    this.states.delete(jid);
  }
}
