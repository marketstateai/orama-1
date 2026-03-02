import React from "react";
import { cn } from "./cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export default function Button({ className, variant = "secondary", size = "md", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-zinc-200/20 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = size === "sm" ? "h-9" : "h-10";
  const variants: Record<NonNullable<Props["variant"]>, string> = {
    primary: "border-transparent bg-zinc-50 text-zinc-950 hover:bg-white",
    secondary: "border-zinc-800 bg-zinc-900 hover:bg-zinc-800/70",
    ghost: "border-transparent bg-transparent hover:bg-zinc-900",
    danger: "border-transparent bg-red-500 text-white hover:bg-red-400"
  };

  return <button className={cn(base, sizes, variants[variant], className)} {...props} />;
}

