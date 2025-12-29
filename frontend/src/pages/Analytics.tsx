import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/useAnalytics";
import { TimelineChart } from "@/components/analytics/TimelineChart";
import { StatsTable } from "@/components/analytics/StatsTable";

export default function Analytics() {
  const { code } = useParams<{ code: string }>();
  const { data: analytics, isLoading, error } = useAnalytics(code ?? "");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-2">Analytics not found</h2>
        <p className="text-muted-foreground mb-4">
          This URL doesn't exist or you don't have access to it.
        </p>
        <Button asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold truncate">
            Analytics for{" "}
            <span className="text-primary">{analytics.shortUrl}</span>
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {analytics.originalUrl}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{analytics.totalClicks}</p>
          <p className="text-sm text-muted-foreground">Total clicks</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clicks Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineChart data={analytics.timeline} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <StatsTable data={analytics.devices} label="Device" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            <StatsTable data={analytics.browsers} label="Browser" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <StatsTable data={analytics.referrers} label="Referrer" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
