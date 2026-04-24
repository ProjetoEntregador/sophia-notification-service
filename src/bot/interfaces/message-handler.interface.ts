import { WAMessage } from 'baileys';

export abstract class MessageHandler {
  abstract handle(message: WAMessage, jid: string, text: string): Promise<void>;
}
