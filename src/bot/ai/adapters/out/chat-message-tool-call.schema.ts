import { pgTable, uuid, varchar, jsonb, index } from 'drizzle-orm/pg-core';
import { chatMessages } from './chat-message.schema';

export const chatMessageToolCalls = pgTable(
  'chat_message_tool_calls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .references(() => chatMessages.id, { onDelete: 'cascade' })
      .notNull(),
    toolUseId: varchar('tool_use_id', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    args: jsonb('args').notNull(),
  },
  (table) => [index('chat_message_tool_calls_message_idx').on(table.messageId)],
);
