import { UserOverview } from './user-overview.type';
import { User } from './user.entity';

export abstract class UsersRepository {
  abstract getOverview(userId: string): Promise<UserOverview>;
  abstract save(user: User): Promise<User>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByJid(jid: string): Promise<User | null>;
  abstract findByToken(token: string): Promise<User | null>;
}
