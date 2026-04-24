import { Injectable } from '@nestjs/common';
import { WASocket } from 'baileys';
import { delay } from '../../utils/delay.js';
import { MessageSender, SocketProvider } from '../interfaces/index.js';

@Injectable()
export class MessageService extends MessageSender {
  constructor(private readonly socketProvider: SocketProvider) {
    super();
  }

  private get sock(): WASocket {
    return this.socketProvider.getSocket();
  }

  async sendText(jid: string, text: string): Promise<void> {
    await this.sock.sendMessage(jid, { text });
  }

  async sendTyping(jid: string, minMs = 1500, maxMs = 3000): Promise<void> {
    await this.sock.sendPresenceUpdate('composing', jid);
    await delay(minMs, maxMs);
    await this.sock.sendPresenceUpdate('paused', jid);
    await delay(minMs, maxMs);
  }
}
