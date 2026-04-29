import { MessageHandlerInterface } from './message-handler.interface.js';

export abstract class MessageHandlerRegistryInterface {
  abstract readonly handlers: ReadonlyArray<MessageHandlerInterface>;
}
