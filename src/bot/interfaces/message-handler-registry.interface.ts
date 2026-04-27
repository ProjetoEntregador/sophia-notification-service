import { MessageHandlerInterface } from './message-handler.interface.js';

export abstract class MessageHandlerRegistry {
  abstract readonly handlers: ReadonlyArray<MessageHandlerInterface>;
}
