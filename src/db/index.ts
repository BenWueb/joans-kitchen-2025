import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { __pgPool?: Pool };

// The pool connects lazily, so importing this module (e.g. during `next build`)
// does not require a reachable database.
const pool =
  globalForDb.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.NODE_ENV === "production" ? 5 : 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pgPool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };
