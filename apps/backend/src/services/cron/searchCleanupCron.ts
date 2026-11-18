import cron from "node-cron";
import { ParentSearch } from "../../modules/caretaker/search.js";

/**
 * Initializes the automated 30-day search history expiration cron job.
 * Runs hourly to identify and expire any search demands past their 30-day lifecycle window.
 */
export function initSearchCleanupCron(): void {
  // 1. Run immediate cleanup on server boot to catch any past records
  runCleanupJob().catch((err) =>
    console.error("[Cron:30DaySearch] Initial cleanup run error:", err)
  );

  // 2. Schedule recurring cron: every hour on minute 0 ('0 * * * *')
  // For production or test, runs reliably every 60 minutes.
  cron.schedule("0 * * * *", async () => {
    await runCleanupJob();
  });

  console.log(
    "[Cron:30DaySearch] Automated 30-day search history expiration cron job registered (Hourly schedule: '0 * * * *')."
  );
}

/**
 * Internal cleanup logic
 */
export async function runCleanupJob(): Promise<number> {
  try {
    const now = new Date();
    const result = await ParentSearch.updateMany(
      {
        isActive: true,
        expiresAt: { $lte: now },
      },
      {
        $set: {
          isActive: false,
          status: "expired",
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[Cron:30DaySearch] Successfully marked ${result.modifiedCount} search history record(s) as expired after 30 days.`
      );
    }
    return result.modifiedCount;
  } catch (err: any) {
    console.error("[Cron:30DaySearch] Failed to execute cleanup job:", err);
    return 0;
  }
}
