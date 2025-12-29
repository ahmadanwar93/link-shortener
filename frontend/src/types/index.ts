export interface Url {
  id: number;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  clickCount: number;
  isCustomAlias: boolean;
  createdAt: string;
}

export interface CreateUrlInput {
  url: string;
  customAlias?: string;
}

export interface ApiError {
  error: string;
  code: string;
  // details is optional because not all error response thrown from backend has this key

  details?: Record<string, string[]>;
}

export interface TimelineDataPoint {
  date: string;
  clicks: number;
}

export interface AggregatedDataPoint {
  name: string;
  count: number;
  // this is just for chart data, it cannot be too strictly typed
  [key: string]: string | number;
}

export interface UrlAnalytics {
  urlId: number;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  totalClicks: number;
  timeline: TimelineDataPoint[];
  devices: AggregatedDataPoint[];
  browsers: AggregatedDataPoint[];
  referrers: AggregatedDataPoint[];
}
