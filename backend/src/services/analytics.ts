import { eq, sql, desc } from "drizzle-orm";
import { db as defaultDb } from "../db/index.js";
import { clicks, urls } from "../db/schema.js";
export interface TimelineDataPoint {
  date: string;
  clicks: number;
}

export interface AggregatedDataPoint {
  name: string;
  count: number;
}

export interface UrlAnalytics {
  urlId: number;
  shortCode: string;
  originalUrl: string;
  totalClicks: number;
  timeline: TimelineDataPoint[];
  devices: AggregatedDataPoint[];
  browsers: AggregatedDataPoint[];
  referrers: AggregatedDataPoint[];
}

export interface AnalyticsService {
  getUrlAnalytics(
    shortCode: string,
    userId: string
  ): Promise<UrlAnalytics | null>;
}

export function createAnalyticsService(db = defaultDb): AnalyticsService {
  return {
    async getUrlAnalytics(
      shortCode: string,
      userId: string
    ): Promise<UrlAnalytics | null> {
      // user can only see the analytics of its own url
      const url = await db.query.urls.findFirst({
        where: eq(urls.shortCode, shortCode),
      });

      if (!url || url.userId !== userId) {
        return null;
      }

      const timelineData = await db
        .select({
          // type casting the raw sql the return type
          date: sql<string>`DATE(${clicks.clickedAt})`.as("date"),
          clicks: sql<number>`COUNT(*)`.as("clicks"),
        })
        .from(clicks)
        .where(eq(clicks.urlId, url.id))
        // DATE() extracts only the date protion hence remove the time component
        .groupBy(sql`DATE(${clicks.clickedAt})`)
        .orderBy(sql`DATE(${clicks.clickedAt})`);

      const devicesData = await db
        .select({
          // coalesce to ensure no null type
          name: sql<string>`COALESCE(${clicks.deviceType}, 'unknown')`.as(
            "name"
          ),
          count: sql<number>`COUNT(*)`.as("count"),
        })
        .from(clicks)
        .where(eq(clicks.urlId, url.id))
        .groupBy(clicks.deviceType)
        .orderBy(desc(sql`COUNT(*)`));

      const browsersData = await db
        .select({
          name: sql<string>`COALESCE(${clicks.browser}, 'unknown')`.as("name"),
          count: sql<number>`COUNT(*)`.as("count"),
        })
        .from(clicks)
        .where(eq(clicks.urlId, url.id))
        .groupBy(clicks.browser)
        .orderBy(desc(sql`COUNT(*)`));

      // if clicks.referer is null then grouped as direct
      // else extracts the domain name
      const referrersData = await db
        .select({
          name: sql<string>`
            COALESCE(
              CASE 
                WHEN ${clicks.referer} IS NULL OR ${clicks.referer} = '' THEN 'direct'
                ELSE REGEXP_REPLACE(${clicks.referer}, '^https?://([^/]+).*$', '\\1')
              END
            )
          `.as("name"),
          count: sql<number>`COUNT(*)::int`.as("count"),
        })
        .from(clicks)
        .where(eq(clicks.urlId, url.id))
        .groupBy(
          sql`
          CASE 
            WHEN ${clicks.referer} IS NULL OR ${clicks.referer} = '' THEN 'direct'
            ELSE REGEXP_REPLACE(${clicks.referer}, '^https?://([^/]+).*$', '\\1')
          END
        `
        )
        .orderBy(desc(sql`COUNT(*)`));

      return {
        urlId: url.id,
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        totalClicks: url.clickCount ?? 0,
        timeline: timelineData,
        devices: devicesData,
        browsers: browsersData,
        referrers: referrersData,
      };
    },
  };
}

export const analyticsService = createAnalyticsService();
