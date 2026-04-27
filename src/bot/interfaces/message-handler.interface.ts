export abstract class MessageHandlerInterface {
  abstract canHandle(text: string): boolean;
  abstract handle(jid: string, text: string): Promise<void>;
  flowName?: string;
}
