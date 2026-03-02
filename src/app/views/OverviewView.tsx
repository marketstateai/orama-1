import React from "react";
import type { Outcome, WeekStartsOn } from "../types";
import { actions, useAppState } from "../store";
import {
  addDays,
  formatShortDate,
  monthKeyFromDate,
  parseISODate,
  startOfWeek,
  toISODate
} from "../date";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Progress from "../ui/Progress";

function isoInRange(dateISO: string, startISO: string, endISO: string): boolean {
  const d = parseISODate(dateISO).getTime();
  return d >= parseISODate(startISO).getTime() && d <= parseISODate(endISO).getTime();
}

function daysBetweenInclusive(startISO: string, endISO: string): number {
  const start = parseISODate(startISO).getTime();
  const end = parseISODate(endISO).getTime();
  return Math.floor((end - start) / (24 * 3600 * 1000)) + 1;
}

export default function OverviewView({ outcome, weekStartsOn }: { outcome: Outcome; weekStartsOn: WeekStartsOn }) {
  const monthly = useAppState((s) => s.monthly);
  const weekly = useAppState((s) => s.weekly);
  const daily = useAppState((s) => s.daily);

  const today = toISODate(new Date());
  const inRange = isoInRange(today, outcome.startDate, outcome.endDate);
  const todayEntry = daily[`${outcome.id}:${today}`] ?? { title: "", done: false };

  const weekStart = toISODate(startOfWeek(parseISODate(today), weekStartsOn));
  const monthKey = monthKeyFromDate(parseISODate(today));
  const monthTitle = monthly[`${outcome.id}:${monthKey}`]?.title ?? "";
  const weekTitle = weekly[`${outcome.id}:${monthKey}:${weekStart}`]?.title ?? "";

  const total = daysBetweenInclusive(outcome.startDate, outcome.endDate);
  const done = Object.entries(daily).reduce((acc, [k, v]) => (k.startsWith(`${outcome.id}:`) && v.done ? acc + 1 : acc), 0);
  const progress = total ? done / total : 0;

  const weekDays = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => toISODate(addDays(parseISODate(weekStart), i))).filter((d) =>
        isoInRange(d, outcome.startDate, outcome.endDate)
      ),
    [weekStart, outcome.startDate, outcome.endDate]
  );
  const weekDone = weekDays.reduce((acc, d) => acc + (daily[`${outcome.id}:${d}`]?.done ? 1 : 0), 0);

  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="text-sm font-semibold">At a glance</div>
            <div className="mt-1 text-sm text-zinc-400">
              Keep monthly + weekly goals outcome-oriented, then make daily commitments tiny and consistent.
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm">
            <span className="text-zinc-400">Overall consistency:</span> {done}/{total}
          </div>
        </div>
        <div className="mt-3">
          <Progress value={progress} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs font-medium text-zinc-400">This month</div>
          <div className="mt-1 text-sm text-zinc-200">{monthTitle || "Set a monthly goal in the Plan tab."}</div>
          <div className="mt-3 text-xs text-zinc-500">Focus: one calendar month at a time.</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-zinc-400">This week</div>
          <div className="mt-1 text-sm text-zinc-200">{weekTitle || "Set a weekly goal in the Plan tab."}</div>
          <div className="mt-3 text-xs text-zinc-500">
            {weekDays.length ? `${weekDone}/${weekDays.length}` : "0/0"} days done (even a tiny slice counts).
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-zinc-400">Today</div>
          <div className="mt-2 grid gap-2">
            <div className="text-xs text-zinc-500">{formatShortDate(today)}</div>
            <Input
              value={todayEntry.title}
              onChange={(e) => actions.setDaily(outcome.id, today, { title: e.target.value })}
              placeholder={inRange ? "Daily commitment for today…" : "Outside outcome date range"}
              disabled={!inRange}
            />
            <div className="flex items-center gap-2">
              <Button
                variant={todayEntry.done ? "secondary" : "primary"}
                disabled={!inRange}
                onClick={() => actions.toggleDailyDone(outcome.id, today)}
              >
                {todayEntry.done ? "Done (undo)" : "Mark done"}
              </Button>
              <div className="text-xs text-zinc-500">
                {inRange ? "Consistency beats intensity." : "Pick a date inside your outcome range."}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
