import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { queryKeys } from "../api/queryKeys";
import type { UrlAnalytics } from "../types";

export function useAnalytics(shortCode: string) {
  return useQuery({
    queryKey: queryKeys.analytics.byCode(shortCode),
    queryFn: async (): Promise<UrlAnalytics> => {
      const { data } = await apiClient.get(`/api/analytics/${shortCode}`);
      return data;
    },
    // only fetch when shortcode is provided
    // if shortCode is falsy the query will not fetch
    // so we dont do conditional hook call dependent on values of shortCode
    // hook will always be called, and react query that will decide
    enabled: !!shortCode,
  });
}
