import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

// pool config
// basically we want to create a connection pool manager
// pool is not pre authorized connections. A connection is not closed (up to 20 seconds) when it is not idle
// subsequent connections can utilise that free connection (no need to do handshake and auth)
// when a new connection is created it might still time out
const client = postgres(env.DATABASE_URL, {
  max: 10, // maximum connections in pool
  idle_timeout: 20, // close idle connections after 20s
  connect_timeout: 10, // fail if can't connect in 10s
});

// we want to create a drizzle orm instance that uses 'client' to execute sql query
// and we also exposed the table structure through schema
export const db = drizzle(client, { schema });

// for graceful shutdown
export const closeDb = () => client.end();
