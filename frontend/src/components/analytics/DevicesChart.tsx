import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { AggregatedDataPoint } from "@/types";

interface DevicesChartProps {
  data: AggregatedDataPoint[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--muted))",
  "#8884d8",
  "#82ca9d",
];

export function DevicesChart({ data }: DevicesChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No device data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ name, percent }) =>
            `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
          }
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value ?? 0, "Clicks"]} />
      </PieChart>
    </ResponsiveContainer>
  );
}
