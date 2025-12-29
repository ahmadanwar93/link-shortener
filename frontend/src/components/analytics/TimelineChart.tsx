import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { TimelineDataPoint } from "@/types";

interface TimelineChartProps {
  data: TimelineDataPoint[];
}

export function TimelineChart({ data }: TimelineChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No click data yet
      </div>
    );
  }

  //   need to format the date to make it human readable
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tickFormatter={formatDate} className="text-xs" />
        <YAxis allowDecimals={false} className="text-xs" />
        <Tooltip
          labelFormatter={formatDate}
          // value can be undefined, so we use null coalescing here to handle that case
          formatter={(value) => [value ?? 0, "Clicks"]}
        />
        <Line
          type="monotone"
          //   selecting the clicks as the value to be plotted on the y axis
          dataKey="clicks"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--primary))" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
