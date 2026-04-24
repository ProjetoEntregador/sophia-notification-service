import { WASocket } from 'baileys';

export abstract class SocketProvider {
  abstract getSocket(): WASocket;
}
