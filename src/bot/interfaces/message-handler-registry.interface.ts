import { MessageHandlerInterface } from './message-handler.interface';

export abstract class MessageHandlerRegistryInterface {
  abstract readonly handlers: ReadonlyArray<MessageHandlerInterface>;
}
