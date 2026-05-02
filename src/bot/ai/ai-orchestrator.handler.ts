import { Injectable, Logger } from '@nestjs/common';
import {
  MessageHandlerInterface,
  MessageSenderInterface,
} from '../interfaces/index.js';
import { AiServiceInterface } from './interfaces/index.js';
import { ChatHistoryService } from './chat-history.service.js';
import { AiToolsRegistry } from './ai-tools.registry.js';
import {
  AI_FALLBACK_MESSAGE,
  AI_FLOW,
  AI_SYSTEM_PROMPT,
  MAX_TOOL_ITERATIONS,
} from './ai.constants.js';

@Injectable()
export class AiOrchestratorHandler extends MessageHandlerInterface {
  readonly flowName = AI_FLOW;
  private readonly logger = new Logger(AiOrchestratorHandler.name);

  constructor(
    private readonly ai: AiServiceInterface,
    private readonly history: ChatHistoryService,
    private readonly tools: AiToolsRegistry,
    private readonly sender: MessageSenderInterface,
  ) {
    super();
  }

  canHandle(): boolean {
    return true;
  }

  async handle(jid: string, text: string): Promise<void> {
    this.history.append(jid, { role: 'user', content: text });

    try {
      for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
        const response = await this.ai.chat({
          systemPrompt: AI_SYSTEM_PROMPT,
          messages: this.history.get(jid),
          tools: this.tools.definitions(),
        });

        const hasTools = !!response.toolCalls?.length;

        this.history.append(jid, {
          role: 'assistant',
          content: response.text,
          toolCalls: response.toolCalls,
        });

        if (!hasTools) {
          if (response.text) {
            await this.sender.typingMessage(jid);
            await this.sender.sendText(jid, response.text);
          }
          return;
        }

        for (const call of response.toolCalls!) {
          const result = await this.tools.execute(jid, call.name, call.args);
          this.history.append(jid, {
            role: 'tool',
            toolUseId: call.toolUseId,
            content: result,
          });
        }
      }

      this.logger.warn(`Limite de iterações atingido para ${jid}`);
      await this.sender.typingMessage(jid);
      await this.sender.sendText(
        jid,
        'Desculpe, não consegui concluir sua solicitação. Pode tentar de novo?',
      );
    } catch (err) {
      this.logger.error(
        `Falha ao chamar IA para ${jid}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      await this.sender.typingMessage(jid);
      await this.sender.sendText(jid, AI_FALLBACK_MESSAGE);
    }
  }
}
