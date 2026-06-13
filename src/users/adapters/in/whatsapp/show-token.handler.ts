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
        [
          '🔑 *Seu token de portabilidade:*',
          '',
          `\`${token}\``,
          '',
          '⚠️ *Trate como senha.* Quem tiver acesso a este token pode vincular sua conta a outro número.',
          '• Copie agora e salve em um lugar seguro (gerenciador de senhas).',
          '• Apague esta mensagem do WhatsApp depois de salvar.',
          '• Quando usar `vincular <token>` em outro número, o token é trocado automaticamente — o atual deixa de valer.',
        ].join('\n'),
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
