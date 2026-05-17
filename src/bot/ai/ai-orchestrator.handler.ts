import { Injectable, Logger } from '@nestjs/common';
import { MessageHandlerInterface } from '../interfaces/index';
import { MessageSender } from '@/shared/ports/message-sender.port';
import { AiServiceInterface } from './interfaces/index';
import { ChatHistoryService } from './chat-history.service';
import { AiToolsRegistry } from './ai-tools.registry';
import {
  AI_FALLBACK_MESSAGE,
  AI_FLOW,
  buildSystemPrompt,
  MAX_TOOL_ITERATIONS,
} from './ai.constants';

@Injectable()
export class AiOrchestratorHandler extends MessageHandlerInterface {
  readonly flowName = AI_FLOW;
  private readonly logger = new Logger(AiOrchestratorHandler.name);

  constructor(
    private readonly ai: AiServiceInterface,
    private readonly history: ChatHistoryService,
    private readonly tools: AiToolsRegistry,
    private readonly sender: MessageSender,
  ) {
    super();
  }

  canHandle(): boolean {
    return true;
  }

  async handle(jid: string, text: string): Promise<void> {
    const historyLengthBefore = this.history.length(jid);
    this.history.append(jid, { role: 'user', content: text });

    try {
      await this.runChat(jid);
      return;
    } catch (err) {
      const errorMessage = (err as Error).message;

      if (errorMessage.includes('tool_use_failed')) {
        this.logger.warn(
          `tool_use_failed para ${jid} — limpando histórico e tentando novamente`,
        );
        this.history.clear(jid);
        this.history.append(jid, { role: 'user', content: text });

        try {
          await this.runChat(jid);
          return;
        } catch (retryErr) {
          this.logger.error(
            `Retry após reset também falhou para ${jid}: ${(retryErr as Error).message}`,
            (retryErr as Error).stack,
          );
          this.history.clear(jid);
        }
      } else {
        this.logger.error(
          `Falha ao chamar IA para ${jid}: ${errorMessage}`,
          (err as Error).stack,
        );
        this.history.truncate(jid, historyLengthBefore);
      }

      await this.sender.typingMessage(jid);
      await this.sender.sendText(jid, AI_FALLBACK_MESSAGE);
    }
  }

  private async runChat(jid: string): Promise<void> {
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await this.ai.chat({
        systemPrompt: buildSystemPrompt(),
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
  }
}
