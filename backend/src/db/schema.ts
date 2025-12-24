import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  varchar,
  index,
} from "drizzle-orm/pg-core";

// better auth would manage user, session, account and verification
// can refer here -> https://www.better-auth.com/docs/concepts/database

// one row in user table means one user in the system. Use this as source of truth who exists
// email is unique but can be authenticated via multiple providers (Google, Github and so on)
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  emailVerified: boolean("email_verified").default(false),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// tracks active login session in the system
// we are implementing stateful session
// when user login, a session row is created with random token
// token goes into user's cookie
// on each request, middleware reads cookie -> lookup session -> validates expiresAt -> attaches userId to the request context
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").unique().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// link user to external identity provider
// accessToken and refreshToken are tokens issued by the OAuth Provider
// accountId is for the OAuth provider account id
// when Oauth login successful, it will return accessToken and refreshToken
// the accessToken is used to utilise the additional functionality of the provider like maybe API
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// this is for verification flows that handles email verification, password reset and magic links
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const urls = pgTable(
  "urls",
  {
    id: serial("id").primaryKey(),
    // varchar so that there is a max length limit
    shortCode: varchar("short_code", { length: 10 }).unique().notNull(),
    originalUrl: text("original_url").notNull(),
    userId: text("user_id")
      .notNull()
      // when user gets deleted, the url gets deleted as well
      .references(() => user.id, { onDelete: "cascade" }),
    clickCount: integer("click_count").default(0),
    isCustomAlias: boolean("is_custom_alias").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // this index is useful for redirect, users are querying the short code to get orignal url
    index("idx_urls_short_code").on(table.shortCode),
    // this index is useful to get all the rows for a specific user
    index("idx_urls_user_id").on(table.userId),
    // can consider indexing user id with created_at if we want to sort
  ]
);

// we want to do type inference from the schema, instead of defining our own type again
// so type with always in sync with the schema (prevent drifting)
// inferSelect represents what we get from the database.
// inferInsert is what data we need to insert and fields with default/ optional
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Url = typeof urls.$inferSelect;
export type NewUrl = typeof urls.$inferInsert;

// authentication mental model
// first layer -> identity verification
// path A -> credentials (email, password)
// path B -> OAuth
// second layer -> session establishment (remember this login)
// after identity verification, create a session token and row, sets HTTP cookie
// third layer -> request authentication
// extract session token from cookie
