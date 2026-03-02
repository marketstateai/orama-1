import React from "react";
import type { Outcome, WeekStartsOn } from "../types";
import { actions, useAppState } from "../store";
import {
  daysForWeekInMonth,
  formatMonthLabel,
  formatWeekLabel,
  monthKeysInRange,
  parseISODate,
  startOfWeek,
  toISODate,
  weekStartsForMonth
} from "../date";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Progress from "../ui/Progress";

function dayLabel(dateISO: string) {
  const d = parseISODate(dateISO);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function todayISO(): string {
  return toISODate(new Date());
}

function isToday(dateISO: string): boolean {
  return dateISO === todayISO();
}

export default function PlanView({ outcome, weekStartsOn }: { outcome: Outcome; weekStartsOn: WeekStartsOn }) {
  const monthly = useAppState((s) => s.monthly);
  const weekly = useAppState((s) => s.weekly);
  const daily = useAppState((s) => s.daily);

  const monthKeys = React.useMemo(() => monthKeysInRange(outcome.startDate, outcome.endDate), [outcome.startDate, outcome.endDate]);

  const [expandedMonth, setExpandedMonth] = React.useState<string | null>(() => {
    const today = parseISODate(todayISO());
    const start = parseISODate(outcome.startDate);
    const end = parseISODate(outcome.endDate);
    if (today.getTime() < start.getTime() || today.getTime() > end.getTime()) return monthKeys[0] ?? null;
    const m = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    return monthKeys.includes(m) ? m : monthKeys[0] ?? null;
  });

  const [expandedWeekKey, setExpandedWeekKey] = React.useState<string | null>(() => {
    const today = parseISODate(todayISO());
    const weekStart = toISODate(startOfWeek(today, weekStartsOn));
    return expandedMonth ? `${expandedMonth}:${weekStart}` : null;
  });

  React.useEffect(() => {
    if (!expandedMonth && monthKeys.length) setExpandedMonth(monthKeys[0]);
  }, [expandedMonth, monthKeys]);

  function monthProgress(monthKey: string): { done: number; total: number } {
    const weekStarts = weekStartsForMonth(monthKey, weekStartsOn);
    let done = 0;
    let total = 0;
    for (const ws of weekStarts) {
      const days = daysForWeekInMonth(ws, monthKey, outcome.startDate, outcome.endDate);
      total += days.length;
      for (const d of days) if (daily[`${outcome.id}:${d}`]?.done) done++;
    }
    return { done, total };
  }

  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Plan</div>
            <div className="mt-1 text-sm text-zinc-400">
              Fill the plan top-down: outcome → month focus → week focus → daily commitment.
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              const today = todayISO();
              const start = parseISODate(outcome.startDate);
              const end = parseISODate(outcome.endDate);
              const t = parseISODate(today);
              if (t.getTime() < start.getTime() || t.getTime() > end.getTime()) return;
              const monthKey = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
              setExpandedMonth(monthKey);
              const weekStart = toISODate(startOfWeek(t, weekStartsOn));
              setExpandedWeekKey(`${monthKey}:${weekStart}`);
              const el = document.getElementById(`day-${today}`);
              el?.scrollIntoView({ block: "center" });
            }}
          >
            Jump to today
          </Button>
        </div>
      </Card>

      <div className="grid gap-3">
        {monthKeys.map((monthKey) => {
          const expanded = expandedMonth === monthKey;
          const monthStoreKey = `${outcome.id}:${monthKey}`;
          const monthTitle = monthly[monthStoreKey]?.title ?? "";
          const { done, total } = monthProgress(monthKey);
          const weekStarts = weekStartsForMonth(monthKey, weekStartsOn).filter(
            (ws) => daysForWeekInMonth(ws, monthKey, outcome.startDate, outcome.endDate).length > 0
          );

          return (
            <Card key={monthKey} className="overflow-hidden">
              <button
                className="flex w-full items-center justify-between gap-3 border-b border-zinc-900 bg-zinc-950/30 px-4 py-3 text-left hover:bg-zinc-950/60"
                onClick={() => setExpandedMonth(expanded ? null : monthKey)}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{formatMonthLabel(monthKey)}</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {total ? `${done}/${total} consistent days` : "No days in range"}
                  </div>
                </div>
                <div className="w-32">
                  <Progress value={total ? done / total : 0} />
                </div>
              </button>

              {expanded ? (
                <div className="grid gap-3 p-4">
                  <div className="grid gap-2">
                    <div className="text-xs font-medium text-zinc-400">Monthly goal (single calendar month)</div>
                    <Input
                      value={monthTitle}
                      onChange={(e) => actions.setMonthlyTitle(outcome.id, monthKey, e.target.value)}
                      placeholder="What outcome matters most this month?"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-xs font-medium text-zinc-400">Weekly goals (calendar weeks)</div>
                    <div className="grid gap-2">
                      {weekStarts.map((weekStartISO) => {
                        const weekKey = `${outcome.id}:${monthKey}:${weekStartISO}`;
                        const weekTitle = weekly[weekKey]?.title ?? "";
                        const weekDays = daysForWeekInMonth(weekStartISO, monthKey, outcome.startDate, outcome.endDate);
                        const expandedWeek = expandedWeekKey === `${monthKey}:${weekStartISO}`;

                        const doneDays = weekDays.reduce(
                          (acc, d) => acc + (daily[`${outcome.id}:${d}`]?.done ? 1 : 0),
                          0
                        );

                        return (
                          <Card key={weekKey} className="overflow-hidden">
                            <button
                              className="flex w-full items-center justify-between gap-3 border-b border-zinc-900 bg-zinc-950/20 px-4 py-3 text-left hover:bg-zinc-950/50"
                              onClick={() => setExpandedWeekKey(expandedWeek ? null : `${monthKey}:${weekStartISO}`)}
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold">{formatWeekLabel(weekStartISO)}</div>
                                <div className="mt-1 text-xs text-zinc-400">
                                  {weekDays.length ? `${doneDays}/${weekDays.length} days done` : "No days in this month-week"}
                                </div>
                              </div>
                              <div className="w-24">
                                <Progress value={weekDays.length ? doneDays / weekDays.length : 0} />
                              </div>
                            </button>

                            {expandedWeek ? (
                              <div className="grid gap-3 p-4">
                                <div className="grid gap-2">
                                  <div className="text-xs font-medium text-zinc-400">Weekly goal</div>
                                  <Input
                                    value={weekTitle}
                                    onChange={(e) => actions.setWeeklyTitle(outcome.id, monthKey, weekStartISO, e.target.value)}
                                    placeholder="What would make this week a win?"
                                  />
                                </div>

                                <div className="grid gap-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs font-medium text-zinc-400">Daily commitments</div>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        const first = weekDays[0];
                                        if (!first) return;
                                        const el = document.getElementById(`day-${first}`);
                                        el?.scrollIntoView({ block: "center" });
                                      }}
                                    >
                                      First day
                                    </Button>
                                  </div>

                                  <div className="grid gap-2">
                                    {weekDays.map((dateISO) => {
                                      const dayKey = `${outcome.id}:${dateISO}`;
                                      const entry = daily[dayKey] ?? { title: "", done: false };
                                      return (
                                        <div
                                          key={dateISO}
                                          id={`day-${dateISO}`}
                                          className={[
                                            "flex flex-col gap-2 rounded-2xl border p-3 sm:flex-row sm:items-center",
                                            isToday(dateISO) ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-900 bg-zinc-950/30"
                                          ].join(" ")}
                                        >
                                          <div className="flex items-center gap-3 sm:w-44">
                                            <button
                                              className={[
                                                "h-6 w-6 rounded-lg border transition",
                                                entry.done ? "border-emerald-400 bg-emerald-400/20" : "border-zinc-800 bg-zinc-950"
                                              ].join(" ")}
                                              aria-label={entry.done ? "Mark not done" : "Mark done"}
                                              onClick={() => actions.toggleDailyDone(outcome.id, dateISO)}
                                            />
                                            <div className="text-sm font-medium">{dayLabel(dateISO)}</div>
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <Input
                                              value={entry.title}
                                              onChange={(e) => actions.setDaily(outcome.id, dateISO, { title: e.target.value })}
                                              placeholder="Daily: the smallest thing you’ll actually do."
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
