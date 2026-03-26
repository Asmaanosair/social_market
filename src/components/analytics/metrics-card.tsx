import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}

export function MetricsCard({ title, value, change, changeLabel, icon }: MetricsCardProps) {
  const isPositive = change && change > 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          {icon && <div className="text-neutral-400">{icon}</div>}
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className={cn("text-xs font-medium", isPositive ? "text-green-500" : "text-red-500")}>
              {isPositive ? "+" : ""}{change}%
            </span>
            {changeLabel && <span className="text-xs text-neutral-400">{changeLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
