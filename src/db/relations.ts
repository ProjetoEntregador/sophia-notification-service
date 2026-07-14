import { relations } from 'drizzle-orm';
import { treatments } from './schema/treatments';
import { reminders } from './schema/reminders';
import { medications } from './schema/medications';
import { users } from './schema/users';
import { treatmentsToMedications } from './schema/treatmentsToMedications';
import { chatConversations } from './schema/chatConversations';
import { chatMessages } from './schema/chatMessages';
import { chatMessageToolCalls } from './schema/chatMessageToolCalls';

export const treatmentRelations = relations(treatments, ({ many, one }) => ({
  reminders: many(reminders),
  medications: many(medications),
  user: one(users, {
    fields: [treatments.userId],
    references: [users.id],
  }),
}));

export const reminderRelations = relations(reminders, ({ one }) => ({
  treatment: one(treatments, {
    fields: [reminders.treatmentId],
    references: [treatments.id],
  }),
}));

export const medicationRelations = relations(medications, ({ many, one }) => ({
  treatments: many(treatments),
  user: one(users, {
    fields: [medications.userId],
    references: [users.id],
  }),
}));

export const treatmentToMedicationRelations = relations(
  treatmentsToMedications,
  ({ one }) => ({
    medication: one(medications, {
      fields: [treatmentsToMedications.medicationId],
      references: [medications.id],
    }),
    treatment: one(treatments, {
      fields: [treatmentsToMedications.treatmentId],
      references: [treatments.id],
    }),
  }),
);

export const chatConversationRelations = relations(
  chatConversations,
  ({ many }) => ({
    messages: many(chatMessages),
  }),
);

export const chatMessageRelations = relations(
  chatMessages,
  ({ one, many }) => ({
    conversation: one(chatConversations, {
      fields: [chatMessages.conversationId],
      references: [chatConversations.id],
    }),
    toolCalls: many(chatMessageToolCalls),
  }),
);

export const chatMessageToolCallRelations = relations(
  chatMessageToolCalls,
  ({ one }) => ({
    message: one(chatMessages, {
      fields: [chatMessageToolCalls.messageId],
      references: [chatMessages.id],
    }),
  }),
);
