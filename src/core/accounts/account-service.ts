import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { accounts } from "@/db/schema";

export async function ensureAccount(clerkUserId: string) {
  const db = getDb();
  await db.insert(accounts).values({ clerkUserId }).onConflictDoNothing();
  const account = await db.query.accounts.findFirst({ where: eq(accounts.clerkUserId, clerkUserId) });
  if (!account) throw new Error("Unable to provision account.");
  return account;
}
