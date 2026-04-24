import { Injectable, Logger } from '@nestjs/common';
import makeWASocket, {
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  WASocket,
} from 'baileys';
import pino from 'pino';
import { SocketProvider } from '../interfaces/index.js';

export interface WhatsAppConnectionOptions {
  authFolder?: string;
  connectTimeoutMs?: number;
}

@Injectable()
export class WhatsAppConnectionService extends SocketProvider {
  private readonly logger = new Logger(WhatsAppConnectionService.name);
  private readonly authFolder: string;
  private readonly connectTimeoutMs: number;
  private socket: WASocket | null = null;

  constructor() {
    super();
    this.authFolder = process.env.WA_AUTH_FOLDER!;
    this.connectTimeoutMs = Number(process.env.WA_CONNECT_TIMEOUT ?? 60000);
  }

  async connect(): Promise<WASocket> {
    const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
    const { version } = await fetchLatestBaileysVersion();

    this.socket = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
      connectTimeoutMs: this.connectTimeoutMs,
    });

    this.socket.ev.on('creds.update', () => {
      void saveCreds();
    });

    this.logger.log('Socket WhatsApp criado');
    return this.socket;
  }

  getSocket(): WASocket {
    if (!this.socket) {
      throw new Error(
        'WhatsApp socket ainda não inicializado. Chame connect() primeiro.',
      );
    }
    return this.socket;
  }
}
