import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database.module';
import { UserOverview } from 'src/@types/user';
import { reminders, treatments } from 'src/db/schema';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase) {}

  async getOverview(id: string): Promise<UserOverview> {
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
      .where(eq(treatments.userId, id))
      .groupBy(treatments.id);

    const overview = {
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

      if (row.perfectlyDone) {
        overview.perfectlyDone++;
      } else {
        overview.notPerfectlyDone++;
      }
    }

    return overview;
  }
}
