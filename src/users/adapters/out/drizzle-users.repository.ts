import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DATABASE } from '@/db/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { treatments } from '@/treatments/adapters/out/treatment.schema';
import { reminders } from '@/reminders/adapters/out/reminder.schema';
import { UsersRepository } from '@/users/domain/users.repository.port';
import { UserOverview } from '@/users/domain/user-overview.type';
import { User } from '@/users/domain/user.entity';
import { users } from './user.schema';

type UserRow = typeof users.$inferSelect;

@Injectable()
export class DrizzleUsersRepository extends UsersRepository {
  constructor(@Inject(DATABASE) private readonly db: NodePgDatabase) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id));
    return row ? this.toEntity(row) : null;
  }

  async findByJid(jid: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.jid, jid));
    return row ? this.toEntity(row) : null;
  }

  async findByToken(token: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.token, token));
    return row ? this.toEntity(row) : null;
  }

  async save(user: User): Promise<User> {
    const row = this.toRow(user);
    const [saved] = await this.db
      .insert(users)
      .values(row)
      .onConflictDoUpdate({ target: users.id, set: row })
      .returning();
    return this.toEntity(saved);
  }

  async getOverview(userId: string): Promise<UserOverview> {
    const rows = await this.db
      .select({
        treatmentId: treatments.id,
        totalReminders: sql<number>`count(${reminders.id})`,
        confirmedCount: sql<number>`count(*) filter (where ${reminders.confirmed} = true)`,
        skippedCount: sql<number>`count(*) filter (where ${reminders.confirmed} = false)`,
        perfectlyDone: sql<boolean>`
          case
            when count(${reminders.id}) = 0 then false
            else bool_and(${reminders.confirmed} is distinct from false)
          end
        `,
      })
      .from(treatments)
      .leftJoin(reminders, eq(reminders.treatmentId, treatments.id))
      .where(eq(treatments.userId, userId))
      .groupBy(treatments.id);

    const overview: UserOverview = {
      totalTreatments: rows.length,
      perfectlyDone: 0,
      notPerfectlyDone: 0,
      totalReminders: 0,
      confirmedReminders: 0,
      skippedReminders: 0,
    };

    for (const row of rows) {
      overview.totalReminders += Number(row.totalReminders);
      overview.confirmedReminders += Number(row.confirmedCount);
      overview.skippedReminders += Number(row.skippedCount);
      if (row.perfectlyDone) overview.perfectlyDone++;
      else overview.notPerfectlyDone++;
    }

    return overview;
  }

  private toEntity(row: UserRow): User {
    return new User(
      row.id,
      row.name,
      row.jid,
      row.token,
      row.quietHoursStart,
      row.quietHoursEnd,
    );
  }

  private toRow(u: User) {
    return {
      id: u.id,
      name: u.name,
      jid: u.jid,
      token: u.token,
      quietHoursStart: u.quietHoursStart,
      quietHoursEnd: u.quietHoursEnd,
    };
  }
}
