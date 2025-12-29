import { UAParser } from "ua-parser-js";
import { eq, sql } from "drizzle-orm";
import { db as defaultDb } from "../db/index.js";
import { clicks, urls } from "../db/schema.js";

// for parseUserAgent since it is just a stateless helpers (together with the types and interfaces), put it outside
// if the function is a stateful closures or instance specific logic, then it should be encapsulated in the factory function

// for this type, basically these are the information that we want for our db
// hence it should match the db as close as possible
// the idea is that we want to know the values of each key
interface ParsedUserAgent {
  deviceType: string;
  browser: string | null;
  os: string | null;
}

interface RecordClickParams {
  urlId: number;
  userAgent: string | null;
  referer: string | null;
}

export interface ClickService {
  recordClick(params: RecordClickParams): Promise<void>;
}

function parseUserAgent(userAgent: string | null): ParsedUserAgent {
  if (!userAgent) {
    return { deviceType: "unknown", browser: null, os: null };
  }

  const parser = new UAParser(userAgent);

  const device = parser.getDevice();
  const browser = parser.getBrowser();
  const os = parser.getOS();

  return {
    // device.type is undefined for desktop browsers
    deviceType: device.type ?? "desktop",
    browser: browser.name ?? null,
    os: os.name ?? null,
  };
}

// factory pattern
// db is inject (DI)
// this service only handles business logic. The route will handles extraction of user-agent, referer and urlId from the request and header
export function createClickService(db = defaultDb): ClickService {
  return {
    async recordClick({
      urlId,
      userAgent,
      referer,
    }: RecordClickParams): Promise<void> {
      const parsed = parseUserAgent(userAgent);

      await db.transaction(async (tx) => {
        await tx.insert(clicks).values({
          urlId,
          deviceType: parsed.deviceType,
          browser: parsed.browser,
          os: parsed.os,
          referer,
        });

        // ensuring atomicity
        // but transaction locks row longer
        // for high traffic, can remove the clickCount, accept eventual consistency
        // with sql template, the increment happens in the db entirely instead of we read the count first
        // so with race condition, it can be avoided to not increment wrongly
        await tx
          .update(urls)
          .set({ clickCount: sql`${urls.clickCount} + 1` })
          .where(eq(urls.id, urlId));
      });
    },
  };
}

export const clickService = createClickService();
