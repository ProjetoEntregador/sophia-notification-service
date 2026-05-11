import { Injectable } from '@nestjs/common';
import { MessageHandlerInterface } from '@/bot/interfaces/index';
import { MessageSender } from '@/shared/ports/message-sender.port';
import { ShowMyTokenUseCase } from '@/users/application/use-cases/show-my-token.usecase';

const TRIGGERS = ['meu token', 'token', '/token', '/meu-token'];

@Injectable()
export class ShowTokenHandler extends MessageHandlerInterface {
  constructor(
    private readonly showMyToken: ShowMyTokenUseCase,
    private readonly sender: MessageSender,
  ) {
    super();
  }

  canHandle(text: string): boolean {
    return TRIGGERS.includes(text.trim().toLowerCase());
  }

  async handle(jid: string): Promise<void> {
    try {
      const token = await this.showMyToken.execute(jid);
      await this.sender.typingMessage(jid);
      await this.sender.sendText(
        jid,
        `🔑 Seu token de portabilidade:\n\n*${token}*\n\nSalve em local seguro. Se trocar de número, envie *vincular ${token}* no novo número para manter seus tratamentos.`,
      );
    } catch (err) {
      await this.sender.typingMessage(jid);
      await this.sender.sendText(
        jid,
        `Não foi possível recuperar o token: ${(err as Error).message}`,
      );
    }
  }
}
