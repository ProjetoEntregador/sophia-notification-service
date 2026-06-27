import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, inArray, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE } from '@/db/database.module';
import { AiChatMessage, AiToolCall } from '@/@types';
import { ChatHistoryRepository } from '../../domain/chat-history.repository.port';
import { MAX_HISTORY_MESSAGES } from '../../ai.constants';
import { chatConversations } from './chat-conversation.schema';
import { chatMessages } from './chat-message.schema';
import { chatMessageToolCalls } from './chat-message-tool-call.schema';

type MessageRow = typeof chatMessages.$inferSelect;
type ToolCallRow = typeof chatMessageToolCalls.$inferSelect;

@Injectable()
export class DrizzleChatHistoryRepository extends ChatHistoryRepository {
  constructor(@Inject(DATABASE) private readonly db: NodePgDatabase) {
    super();
  }

  async get(jid: string): Promise<AiChatMessage[]> {
    const conversationId = await this.findConversationId(jid);
    if (!conversationId) return [];

    const rows = await this.db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(asc(chatMessages.seq));

    if (rows.length === 0) return [];

    const callsByMessage = await this.toolCallsByMessage(rows.map((r) => r.id));

    return rows.map((row) =>
      this.toMessage(row, callsByMessage.get(row.id) ?? []),
    );
  }

  async append(jid: string, message: AiChatMessage): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [conversation] = await tx
        .insert(chatConversations)
        .values({ jid })
        .onConflictDoUpdate({
          target: chatConversations.jid,
          set: { updatedAt: new Date() },
        })
        .returning({ id: chatConversations.id });

      const conversationId = conversation.id;

      const [inserted] = await tx
        .insert(chatMessages)
        .values({
          conversationId,
          role: message.role,
          content: this.contentOf(message),
          toolUseId: message.role === 'tool' ? message.toolUseId : null,
        })
        .returning({ id: chatMessages.id });

      if (message.role === 'assistant' && message.toolCalls?.length) {
        await tx.insert(chatMessageToolCalls).values(
          message.toolCalls.map((call) => ({
            messageId: inserted.id,
            toolUseId: call.toolUseId,
            name: call.name,
            args: call.args ?? {},
          })),
        );
      }

      await this.enforceLimit(tx, conversationId);
    });
  }

  async clear(jid: string): Promise<void> {
    const conversationId = await this.findConversationId(jid);
    if (!conversationId) return;
    await this.db
      .delete(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId));
  }

  async length(jid: string): Promise<number> {
    const conversationId = await this.findConversationId(jid);
    if (!conversationId) return 0;

    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId));

    return row?.count ?? 0;
  }

  async truncate(jid: string, length: number): Promise<void> {
    const conversationId = await this.findConversationId(jid);
    if (!conversationId) return;

    if (length <= 0) {
      await this.db
        .delete(chatMessages)
        .where(eq(chatMessages.conversationId, conversationId));
      return;
    }

    const ids = await this.db
      .select({ id: chatMessages.id })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(asc(chatMessages.seq));

    const toDelete = ids.slice(length).map((r) => r.id);
    if (toDelete.length === 0) return;

    await this.db
      .delete(chatMessages)
      .where(inArray(chatMessages.id, toDelete));
  }

  private async findConversationId(jid: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: chatConversations.id })
      .from(chatConversations)
      .where(eq(chatConversations.jid, jid));
    return row?.id ?? null;
  }

  private async toolCallsByMessage(
    messageIds: string[],
  ): Promise<Map<string, AiToolCall[]>> {
    const byMessage = new Map<string, AiToolCall[]>();
    if (messageIds.length === 0) return byMessage;

    const rows = await this.db
      .select()
      .from(chatMessageToolCalls)
      .where(inArray(chatMessageToolCalls.messageId, messageIds));

    for (const row of rows) {
      const list = byMessage.get(row.messageId) ?? [];
      list.push(this.toToolCall(row));
      byMessage.set(row.messageId, list);
    }
    return byMessage;
  }

  /**
   * Mantém apenas as MAX_HISTORY_MESSAGES mensagens mais recentes da conversa,
   * apagando as mais antigas (as tool calls saem em cascata).
   */
  private async enforceLimit(
    tx: Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0],
    conversationId: string,
  ): Promise<void> {
    const ids = await tx
      .select({ id: chatMessages.id })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(asc(chatMessages.seq));

    if (ids.length <= MAX_HISTORY_MESSAGES) return;

    const toDelete = ids
      .slice(0, ids.length - MAX_HISTORY_MESSAGES)
      .map((r) => r.id);
    await tx.delete(chatMessages).where(inArray(chatMessages.id, toDelete));
  }

  private contentOf(message: AiChatMessage): string | null {
    if (message.role === 'assistant') return message.content ?? null;
    return message.content;
  }

  private toMessage(row: MessageRow, calls: AiToolCall[]): AiChatMessage {
    if (row.role === 'assistant') {
      return {
        role: 'assistant',
        content: row.content ?? undefined,
        toolCalls: calls.length > 0 ? calls : undefined,
      };
    }
    if (row.role === 'tool') {
      return {
        role: 'tool',
        toolUseId: row.toolUseId ?? '',
        content: row.content ?? '',
      };
    }
    return { role: 'user', content: row.content ?? '' };
  }

  private toToolCall(row: ToolCallRow): AiToolCall {
    return {
      toolUseId: row.toolUseId,
      name: row.name,
      args: (row.args ?? {}) as Record<string, unknown>,
    };
  }
}
