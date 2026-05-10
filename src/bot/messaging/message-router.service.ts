import { Injectable, Logger } from '@nestjs/common';
import {
  MessageHandlerInterface,
  MessageHandlerRegistryInterface,
  MessageRouterInterface,
} from '../interfaces/index';
import { ConversationStateService } from './state/conversation-state.service';

@Injectable()
export class MessageRouter extends MessageRouterInterface {
  private readonly logger = new Logger(MessageRouter.name);

  constructor(
    private readonly registry: MessageHandlerRegistryInterface,
    private readonly conversationState: ConversationStateService,
  ) {
    super();
  }

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
      const error = err as Error & { cause?: unknown };
      const cause = error.cause as
        | (Error & { code?: string; detail?: string })
        | undefined;
      this.logger.error(
        `Falha em ${handler.constructor.name}: ${error.message}` +
          (cause
            ? ` | cause: ${cause.message}` +
              (cause.code ? ` [${cause.code}]` : '') +
              (cause.detail ? ` — ${cause.detail}` : '')
            : ''),
        error.stack,
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
