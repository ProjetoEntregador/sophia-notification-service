import { AiToolDefinition } from '../../../@types';

export abstract class AiToolInterface {
  abstract readonly definition: AiToolDefinition;
  abstract execute(jid: string, args: Record<string, unknown>): Promise<string>;
}
