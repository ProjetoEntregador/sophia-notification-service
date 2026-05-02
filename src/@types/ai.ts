export type AiToolCall = {
  toolUseId: string;
  name: string;
  args: Record<string, unknown>;
};

export type AiChatMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content?: string; toolCalls?: AiToolCall[] }
  | { role: 'tool'; toolUseId: string; content: string };

export type AiToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type AiChatRequest = {
  systemPrompt?: string;
  messages: AiChatMessage[];
  tools: AiToolDefinition[];
};

export type AiChatResponse = {
  text?: string;
  toolCalls?: AiToolCall[];
};
