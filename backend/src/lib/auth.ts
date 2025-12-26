import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { env } from "../config/env";
import * as schema from "../db/schema.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  // cryptographic key for signing JWT tokens, session cookies, and CSRF tokens
  secret: env.BETTER_AUTH_SECRET,
  // url where the auth server is accessible
  // will be used for oauth callbakcs, email verification links, CORS
  baseURL: env.BETTER_AUTH_URL,
  // enable traditional username/ password auth strategy
  emailAndPassword: {
    enabled: true,
  },

  trustedOrigins: [env.FRONTEND_URL],
});
