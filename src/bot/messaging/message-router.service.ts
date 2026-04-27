import { Injectable, Logger } from '@nestjs/common';
import {
  MessageHandlerInterface,
  MessageHandlerRegistry,
  MessageRouterInterface,
} from '../interfaces/index.js';
import { ConversationStateService } from './state/conversation-state.service.js';

@Injectable()
export class MessageRouter implements MessageRouterInterface {
  private readonly logger = new Logger(MessageRouter.name);

  constructor(
    private readonly registry: MessageHandlerRegistry,
    private readonly conversationState: ConversationStateService,
  ) {}

  async route(jid: string, text: string): Promise<void> {
    this.logger.log(`Mensagem de ${jid}: ${text}`);

    const handler = this.resolveHandler(jid, text);
    if (!handler) {
      this.logger.debug(`Sem handler para "${text}"`);
      return;
    }

    try {
      await handler.handle(jid, text);
    } catch (err) {
      this.logger.error(
        `Falha em ${handler.constructor.name}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  private resolveHandler(
    jid: string,
    text: string,
  ): MessageHandlerInterface | undefined {
    const active = this.conversationState.get(jid);
    if (active) {
      const owner = this.registry.handlers.find(
        (h) => h.flowName === active.flow,
      );
      if (owner) return owner;
    }
    return this.registry.handlers.find((h) => h.canHandle(text));
  }
}
