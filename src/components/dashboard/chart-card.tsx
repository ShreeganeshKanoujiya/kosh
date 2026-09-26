"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Card wrapper for a chart with an accessible Chart / Table switch.
 * The table view carries every value, so nothing depends on colour or hover alone.
 */
export function ChartCard({
  title,
  subtitle,
  chart,
  table,
  className,
  empty,
}: {
  title: string;
  subtitle?: string;
  chart: React.ReactNode;
  table: React.ReactNode;
  className?: string;
  empty?: React.ReactNode;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <Card className={cn("gap-4 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-card-title">{title}</h2>
          {subtitle && <p className="text-caption">{subtitle}</p>}
        </div>
        {!empty && (
          <div role="radiogroup" aria-label={`${title} view`} className="flex shrink-0 rounded-lg bg-muted p-0.5 text-xs font-medium">
            {(["chart", "table"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "h-8 rounded-md px-2.5 capitalize text-muted-foreground transition-colors md:h-7",
                  view === v && "bg-card text-foreground shadow-xs",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>
      {empty ?? (view === "chart" ? chart : <div className="max-h-72 overflow-auto">{table}</div>)}
    </Card>
  );
}

export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-44 items-center justify-center rounded-xl border border-dashed text-center text-caption">{message}</div>
  );
}

export function DataTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          {columns.map((c, i) => (
            <th key={c} scope="col" className={cn("py-2 font-medium", i > 0 && "text-right")}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b last:border-0">
            {r.map((cell, j) =>
              j === 0 ? (
                <th key={j} scope="row" className="py-2 text-left font-normal">
                  {cell}
                </th>
              ) : (
                <td key={j} className="py-2 text-right tabular-nums">
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
