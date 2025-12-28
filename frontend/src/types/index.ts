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
