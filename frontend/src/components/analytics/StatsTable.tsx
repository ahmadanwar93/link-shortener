import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AggregatedDataPoint } from "@/types";

interface StatsTableProps {
  data: AggregatedDataPoint[];
  label: string; // "Device", "Browser", "Referrer"
}

export function StatsTable({ data, label }: StatsTableProps) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">No data yet</div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{label}</TableHead>
          <TableHead className="text-right">Clicks</TableHead>
          <TableHead className="text-right">%</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <TableRow key={item.name}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-right">{item.count}</TableCell>
              <TableCell className="text-right">
                {percentage.toFixed(1)}%
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
