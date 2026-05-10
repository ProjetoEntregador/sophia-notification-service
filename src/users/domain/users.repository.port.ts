import { UserOverview } from './user-overview.type';

export abstract class UsersRepository {
  abstract getOverview(userId: string): Promise<UserOverview>;
}
