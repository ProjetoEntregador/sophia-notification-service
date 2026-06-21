export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly jid: string,
    public readonly token: string,
    public readonly quietHoursStart: string | null = null,
    public readonly quietHoursEnd: string | null = null,
  ) {}

  withName(name: string): User {
    return new User(
      this.id,
      name,
      this.jid,
      this.token,
      this.quietHoursStart,
      this.quietHoursEnd,
    );
  }

  withJid(jid: string): User {
    return new User(
      this.id,
      this.name,
      jid,
      this.token,
      this.quietHoursStart,
      this.quietHoursEnd,
    );
  }

  withToken(token: string): User {
    return new User(
      this.id,
      this.name,
      this.jid,
      token,
      this.quietHoursStart,
      this.quietHoursEnd,
    );
  }

  withQuietHours(start: string | null, end: string | null): User {
    return new User(this.id, this.name, this.jid, this.token, start, end);
  }
}
