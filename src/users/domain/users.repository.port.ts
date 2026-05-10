import { UserOverview } from './user-overview.type';
import { User } from './user.entity';

export abstract class UsersRepository {
  abstract getOverview(userId: string): Promise<UserOverview>;
  abstract save(user: User): Promise<User>;
  abstract getByToken(token: string): Promise<User>;
  abstract getById(id: string): Promise<User>;
}
