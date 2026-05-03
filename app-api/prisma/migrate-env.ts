/**
 * One-time migration script to backfill the `env` field on all existing
 * documents that were created before environment scoping was added.
 *
 * Run this BEFORE `prisma db push` so that compound unique indexes
 * can be created without conflicts.
 *
 * Usage:  npx tsx prisma/migrate-env.ts
 */
import { MongoClient } from "mongodb";

const COLLECTIONS = [
  "User",
  "UserSession",
  "Product",
  "Purchase",
  "Membership",
  "Feature",
  "ActivityLog",
  "SiteSetting",
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const env = process.env.APP_ENV || "dev";
  console.log(`Backfilling env="${env}" on documents missing the env field.\n`);

  const client = new MongoClient(url);
  await client.connect();

  const dbName = new URL(url).pathname.slice(1); // e.g. "mono-next"
  const db = client.db(dbName);

  for (const name of COLLECTIONS) {
    const result = await db
      .collection(name)
      .updateMany({ env: { $exists: false } }, { $set: { env } });
    console.log(`  ${name}: ${result.modifiedCount} documents updated`);
  }

  console.log("\nDone.");
  await client.close();
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
