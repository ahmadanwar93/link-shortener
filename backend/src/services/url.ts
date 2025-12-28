import { eq, desc } from "drizzle-orm";
import { db as defaultDb } from "../db/index.js";
import { urls, Url } from "../db/schema.js";
import {
  generateShortCode,
  SHORT_CODE_MIN_LENGTH,
  SHORT_CODE_MAX_LENGTH,
} from "../lib/shortcode.js";

// Reserved words that can't be used as custom aliases
// Using set instead of array
// set has O(1) for time complexity for searching
// and we cant accidentally have duplicates
const RESERVED_WORDS = new Set([
  // Routes
  "api",
  "auth",
  "login",
  "register",
  "dashboard",
  "settings",
  "health",
  "status",
  "admin",
  "help",
  "support",
  "card",
  // Static assets
  "static",
  "assets",
  "public",
  "images",
  "css",
  "js",
  // Legal pages
  "about",
  "terms",
  "privacy",
  "contact",
  // Features
  "analytics",
  "stats",
  "profile",
  "links",
  "qr",
  // System words
  "null",
  "undefined",
  "true",
  "false",
  "new",
  "delete",
]);

const MAX_COLLISION_RETRIES = 3;

export interface CreateUrlInput {
  originalUrl: string;
  userId: string;
  customAlias?: string | undefined;
}

export interface UrlService {
  createUrl(input: CreateUrlInput): Promise<Url>;
  getUrlsByUser(userId: string): Promise<Url[]>;
  getUrlByCode(shortCode: string): Promise<Url | null>;
  deleteUrl(shortCode: string, userId: string): Promise<boolean>;
}

// the idea is that, service class dont have to know about HTTP
// they throw domain errors, not something like reply.status(409)
// at the route level that we would catch the error, and maps to HTTP status code
// Fastify error handler would be the last safety net, it would catch anything uncaught, returns generic error
export class UrlServiceError extends Error {
  // we are extending the javascript error class
  constructor(
    // without any modifier is just a parameter
    message: string,
    // implicitly is doing this this.code = code
    public code:
      | "ALIAS_RESERVED"
      | "ALIAS_TAKEN"
      | "ALIAS_INVALID"
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "GENERATION_FAILED"
  ) {
    // we are calling the constructor function of the parent as well which accept message params
    super(message);
    // after we call super, the object is already initialised. We can modify the properties that we inherit
    // the modification of properties doesnt always have to go through parent constructor
    this.name = "UrlServiceError";
  }
}

// factory function, it creates and returns an object with methods
// in our case, all the functions in the return object uses our db params that we passed in through closure
export function createUrlService(db = defaultDb): UrlService {
  // insertWithRetry will gets remembered by the return object through closure
  async function insertWithRetry(
    originalUrl: string,
    userId: string,
    isCustomAlias: boolean,
    shortCode?: string
  ): Promise<Url> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < MAX_COLLISION_RETRIES) {
      // nullish coalescing. Would return the right hand operand if the left hand operand is null or undefined
      const codeToUse = shortCode ?? generateShortCode();

      try {
        // array destructuring because returning an array of inserted rows
        const [url] = await db
          // table name
          .insert(urls)
          // columns with values
          .values({
            shortCode: codeToUse,
            originalUrl,
            userId,
            isCustomAlias,
          })
          // returning is not the one that executes the query. Await is
          // but we need the inserted data to return in the api response
          .returning();

        if (!url) {
          throw new Error("Failed to insert URL");
        }

        return url;
      } catch (error) {
        const isUniqueViolation =
          error instanceof Error &&
          "code" in error &&
          (error as { code: string }).code === "23505";

        if (isUniqueViolation) {
          if (shortCode) {
            throw new UrlServiceError("Alias already taken", "ALIAS_TAKEN");
          }
          attempts++;
          lastError = error as Error;
          // continue to return to the while loop
          // continue would skip to the next iteration
          continue;
        }

        // just rethrow different error maybe like db error
        throw error;
      }
    }

    // after all 3 retries would always throw error
    throw new UrlServiceError(
      `Failed to generate unique code after ${MAX_COLLISION_RETRIES} attempts`,
      "GENERATION_FAILED"
    );
  }

  return {
    async createUrl({
      originalUrl,
      userId,
      customAlias,
    }: CreateUrlInput): Promise<Url> {
      if (customAlias) {
        if (customAlias.length < SHORT_CODE_MIN_LENGTH) {
          throw new UrlServiceError(
            `Alias must be at least ${SHORT_CODE_MIN_LENGTH} characters`,
            "ALIAS_INVALID"
          );
        }
        if (customAlias.length > SHORT_CODE_MAX_LENGTH) {
          throw new UrlServiceError(
            `Alias must be at most ${SHORT_CODE_MAX_LENGTH} characters`,
            "ALIAS_INVALID"
          );
        }
        // for auto generate short code, we disallow the ambigious character when generating nanoId
        // here since user chooses the custom alias, they have the full charset
        if (!/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
          throw new UrlServiceError(
            "Alias can only contain letters, numbers, hyphens, and underscores",
            "ALIAS_INVALID"
          );
        }

        if (RESERVED_WORDS.has(customAlias.toLowerCase())) {
          throw new UrlServiceError("This alias is reserved", "ALIAS_RESERVED");
        }

        return insertWithRetry(originalUrl, userId, true, customAlias);
      }

      return insertWithRetry(originalUrl, userId, false);
    },

    async getUrlsByUser(userId: string): Promise<Url[]> {
      return db.query.urls.findMany({
        where: eq(urls.userId, userId),
        orderBy: [desc(urls.createdAt)],
      });
    },

    async getUrlByCode(shortCode: string): Promise<Url | null> {
      const url = await db.query.urls.findFirst({
        where: eq(urls.shortCode, shortCode),
      });
      return url ?? null;
    },

    async deleteUrl(shortCode: string, userId: string): Promise<boolean> {
      const existing = await db.query.urls.findFirst({
        where: eq(urls.shortCode, shortCode),
      });

      if (!existing) {
        return false; // 404
      }

      if (existing.userId !== userId) {
        throw new UrlServiceError(
          "Not authorized to delete this URL",
          "FORBIDDEN"
        );
      }

      await db.delete(urls).where(eq(urls.id, existing.id));
      return true;
    },
  };
}

// default instance for convenience, in testing we can mock db
export const urlService = createUrlService();
