"use client";

import { formatDateTime, formatTimeAgo } from "@/lib/format";

/**
 * Relative time ("5 minutes ago"). Server and client clocks render a few seconds
 * apart, so the text is allowed to differ at hydration; the full timestamp is in the tooltip.
 */
export function TimeAgo({ date }: { date: string }) {
  return (
    <time dateTime={date} title={formatDateTime(date)} suppressHydrationWarning>
      {formatTimeAgo(date)}
    </time>
  );
}
