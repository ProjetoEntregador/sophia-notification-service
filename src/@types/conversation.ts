export type ConversationState = {
  flow: string;
  step: string | number;
  data: Record<string, unknown>;
};
