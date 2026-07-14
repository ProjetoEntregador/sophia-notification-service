import { Injectable, Logger } from '@nestjs/common';
import { Boom } from '@hapi/boom';
import {
  ConnectionState,
  DisconnectReason,
  downloadMediaMessage,
  WAMessage,
  WASocket,
} from 'baileys';
import pino from 'pino';
import { QrCodePresenterInterface } from '../interfaces/index';
import { TranscriptionServiceInterface } from '../ai/interfaces/index';
import { WhatsAppConnectionService } from './whatsapp-connection.service';
import { RabbitMQService } from '@/infra/messaging/rabbitmq.service';
import { MessageSender } from '@/shared/ports/message-sender.port';
import {
  AUDIO_TRANSCRIPTION_EMPTY_MESSAGE,
  AUDIO_TRANSCRIPTION_ERROR_MESSAGE,
  DEFAULT_AUDIO_MIME,
} from './whatsapp-session.constants';

@Injectable()
export class WhatsAppSessionService {
  private readonly logger = new Logger(WhatsAppSessionService.name);
  private readonly mediaLogger = pino({ level: 'silent' });

  constructor(
    private readonly connection: WhatsAppConnectionService,
    private readonly incomingService: RabbitMQService,
    private readonly qrPresenter: QrCodePresenterInterface,
    private readonly transcription: TranscriptionServiceInterface,
    private readonly sender: MessageSender,
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

      const location = msg.message.locationMessage;
      if (
        location?.degreesLatitude != null &&
        location?.degreesLongitude != null
      ) {
        const payload = `__location__|${location.degreesLatitude}|${location.degreesLongitude}`;
        void this.incomingService.publishInternalEvent({
          from,
          text: payload,
        });
        return;
      }

      if (msg.message.audioMessage) {
        void this.handleAudioMessage(sock, from, msg);
        return;
      }

      if (!text) return;

      void this.incomingService.publishInternalEvent({
        from,
        text,
      });
    });
  }

  private async handleAudioMessage(
    sock: WASocket,
    from: string,
    msg: WAMessage,
  ): Promise<void> {
    try {
      const buffer = await downloadMediaMessage(
        msg,
        'buffer',
        {},
        {
          logger: this.mediaLogger,
          reuploadRequest: (m) => sock.updateMediaMessage(m),
        },
      );

      const mimeType =
        msg.message?.audioMessage?.mimetype ?? DEFAULT_AUDIO_MIME;

      const text = await this.transcription.transcribe({
        audio: buffer,
        mimeType,
      });

      if (!text) {
        this.logger.warn(`Transcrição vazia para áudio de ${from}`);
        await this.sender.sendText(from, AUDIO_TRANSCRIPTION_EMPTY_MESSAGE);
        return;
      }

      this.logger.log(`Áudio de ${from} transcrito: "${text}"`);

      await this.incomingService.publishInternalEvent({ from, text });
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Falha ao transcrever áudio de ${from}: ${error.message}`,
        error.stack,
      );
      await this.sender
        .sendText(from, AUDIO_TRANSCRIPTION_ERROR_MESSAGE)
        .catch(() => undefined);
    }
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
