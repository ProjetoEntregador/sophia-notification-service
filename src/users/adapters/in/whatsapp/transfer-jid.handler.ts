import { Injectable } from '@nestjs/common';
import { MessageHandlerInterface } from '@/bot/interfaces/index';
import { MessageSender } from '@/shared/ports/message-sender.port';
import { TransferJidUseCase } from '@/users/application/use-cases/transfer-jid.usecase';

const TRIGGER = /^\/?vincular\s+(.+)$/i;

@Injectable()
export class TransferJidHandler extends MessageHandlerInterface {
  constructor(
    private readonly transferJid: TransferJidUseCase,
    private readonly sender: MessageSender,
  ) {
    super();
  }

  canHandle(text: string): boolean {
    return TRIGGER.test(text.trim());
  }

  async handle(jid: string, text: string): Promise<void> {
    const token = text.trim().match(TRIGGER)?.[1]?.trim();
    if (!token) {
      await this.sender.sendText(
        jid,
        'Uso: *vincular <token>* — onde o token foi obtido no número anterior com *meu token*.',
      );
      return;
    }

    try {
      const user = await this.transferJid.execute(token, jid);
      await this.sender.typingMessage(jid);
      await this.sender.sendText(
        jid,
        [
          `Conta vinculada com sucesso, ${user.name}! ✅`,
          'Seus tratamentos e medicamentos agora estão disponíveis neste número.',
          '',
          '🔑 O token anterior deixou de valer. Para gerar um novo (caso precise no futuro), envie *meu token*.',
        ].join('\n'),
      );
    } catch (err) {
      await this.sender.typingMessage(jid);
      await this.sender.sendText(
        jid,
        `Não foi possível vincular: ${(err as Error).message}`,
      );
    }
  }
}
