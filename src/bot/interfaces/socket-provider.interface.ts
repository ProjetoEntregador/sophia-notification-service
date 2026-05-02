import { WASocket } from 'baileys';

export abstract class SocketProviderInterface {
  abstract getSocket(): WASocket;
}
