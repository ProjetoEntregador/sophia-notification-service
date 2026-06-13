export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly jid: string,
    public readonly token: string,
  ) {}

  withName(name: string): User {
    return new User(this.id, name, this.jid, this.token);
  }

  withJid(jid: string): User {
    return new User(this.id, this.name, jid, this.token);
  }

  withToken(token: string): User {
    return new User(this.id, this.name, this.jid, token);
  }
}
