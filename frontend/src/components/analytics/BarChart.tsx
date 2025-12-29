import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { AggregatedDataPoint } from "@/types";

interface BarChartComponentProps {
  data: AggregatedDataPoint[];
}

export function BarChartComponent({ data }: BarChartComponentProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" allowDecimals={false} className="text-xs" />
        <YAxis type="category" dataKey="name" width={100} className="text-xs" />
        <Tooltip formatter={(value) => [value ?? 0, "Clicks"]} />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
