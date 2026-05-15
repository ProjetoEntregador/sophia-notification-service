import { Injectable, Logger } from '@nestjs/common';
import { Boom } from '@hapi/boom';
import {
  ConnectionState,
  DisconnectReason,
  WAMessage,
  WASocket,
} from 'baileys';
import { QrCodePresenterInterface } from '../interfaces/index';
import { WhatsAppConnectionService } from './whatsapp-connection.service';
import { RabbitMQService } from '@/infra/messaging/rabbitmq.service';

@Injectable()
export class WhatsAppSessionService {
  private readonly logger = new Logger(WhatsAppSessionService.name);

  constructor(
    private readonly connection: WhatsAppConnectionService,
    private readonly incomingService: RabbitMQService,
    private readonly qrPresenter: QrCodePresenterInterface,
  ) {}

  async start(): Promise<void> {
    const sock = await this.connection.connect();

    this.registerConnectionHandlers(sock);
    this.registerMessageHandlers(sock);

    await this.waitUntilOpen(sock);
  }

  private registerConnectionHandlers(sock: WASocket): void {
    sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.qrPresenter.present(qr);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom | undefined)?.output
          ?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        this.logger.warn('Conexão fechada');

        if (shouldReconnect) {
          void this.start();
        }
      }

      if (connection === 'open') {
        this.logger.log('Bot conectado!');
      }
    });
  }

  private registerMessageHandlers(sock: WASocket): void {
    sock.ev.on('messages.upsert', ({ messages }) => {
      const msg: WAMessage | undefined = messages[0];
      if (!msg?.message) return;
      if (msg.key.fromMe) return;

      const from = msg.key.remoteJid;
      if (!from) return;

      const text =
        msg.message.conversation ?? msg.message.extendedTextMessage?.text;

      if (!text) return;

      void this.incomingService.publishInternalEvent({
        from,
        text,
      });
    });
  }

  private waitUntilOpen(sock: WASocket): Promise<void> {
    return new Promise((resolve, reject) => {
      const listener = (update: Partial<ConnectionState>) => {
        if (update.connection === 'open') {
          sock.ev.off('connection.update', listener);
          resolve();
        }
        if (update.connection === 'close') {
          const statusCode = (update.lastDisconnect?.error as Boom | undefined)
            ?.output?.statusCode;
          if (statusCode === DisconnectReason.loggedOut) {
            sock.ev.off('connection.update', listener);
            reject(new Error('Sessão deslogada antes de abrir.'));
          }
        }
      };
      sock.ev.on('connection.update', listener);
    });
  }
}
