import React from "react";
import { cn } from "./cn";

export default function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-zinc-800 bg-zinc-950/70 shadow-sm", className)}
      {...props}
    />
  );
}

