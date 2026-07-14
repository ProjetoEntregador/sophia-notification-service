export abstract class MessageSender {
  abstract sendText(jid: string, text: string): Promise<void>;
  abstract typingMessage(
    jid: string,
    minMs?: number,
    maxMs?: number,
  ): Promise<void>;
}
