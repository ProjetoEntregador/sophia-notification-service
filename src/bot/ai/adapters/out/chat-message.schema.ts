import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  bigserial,
  index,
} from 'drizzle-orm/pg-core';
import { chatConversations } from './chat-conversation.schema';

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .references(() => chatConversations.id, { onDelete: 'cascade' })
      .notNull(),
    seq: bigserial('seq', { mode: 'number' }).notNull(),
    role: varchar('role', { length: 20 }).notNull(),
    content: text('content'),
    toolUseId: varchar('tool_use_id', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('chat_messages_conversation_seq_idx').on(
      table.conversationId,
      table.seq,
    ),
  ],
);
