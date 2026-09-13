import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { getConfig } from "@/core/config";
export function getDb() { return drizzle({ client: neon(getConfig().DATABASE_URL), schema }); }
