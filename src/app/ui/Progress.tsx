import React from "react";
import { cn } from "./cn";

type Props = {
  value: number; // 0..1
  className?: string;
};

export default function Progress({ value, className }: Props) {
  const v = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-zinc-900", className)}>
      <div className="h-full rounded-full bg-emerald-400/90" style={{ width: `${v * 100}%` }} />
    </div>
  );
}

