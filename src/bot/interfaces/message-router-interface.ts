export abstract class MessageRouterInterface {
  abstract route(jid: string, message: string): Promise<void>;
}
