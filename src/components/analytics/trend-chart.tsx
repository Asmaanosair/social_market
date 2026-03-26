import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrendChartProps {
  title: string;
  data?: Array<{ date: string; value: number }>;
}

export function TrendChart({ title, data = [] }: TrendChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-64 flex items-end gap-1">
            {data.map((point, i) => {
              const height = (point.value / maxValue) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <div className="relative w-full flex items-end justify-center" style={{ height: "200px" }}>
                    <div
                      className="w-full max-w-[24px] bg-neutral-900 rounded-t transition-all hover:bg-neutral-700"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${point.date}: ${point.value.toLocaleString()}`}
                    />
                  </div>
                  {data.length <= 14 && (
                    <span className="text-[10px] text-neutral-400 rotate-0 truncate max-w-[40px]">
                      {point.date.slice(5)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-sm text-neutral-400">
            No data available for the selected period
          </div>
        )}
      </CardContent>
    </Card>
  );
}
