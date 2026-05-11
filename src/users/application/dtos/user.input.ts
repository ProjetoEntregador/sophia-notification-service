export type CreateUserInput = {
  name: string;
  jid: string;
};

export type UpdateUserInput = Partial<{ name: string }>;
