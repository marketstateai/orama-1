import React from "react";
import type { DailyGoal, MonthlyGoal, Outcome, PersistedStateV1, WeekStartsOn, WeeklyGoal } from "./types";

const STORAGE_KEY = "goals_app_state_v1";

type State = PersistedStateV1;

type Listener = () => void;

type Store = {
  get: () => State;
  set: (updater: (prev: State) => State) => void;
  subscribe: (listener: Listener) => () => void;
};

function safeUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function defaultState(): State {
  return {
    version: 1,
    weekStartsOn: 0,
    selectedOutcomeId: undefined,
    outcomes: [],
    monthly: {},
    weekly: {},
    daily: {}
  };
}

function readState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as State;
    if (parsed?.version !== 1) return defaultState();
    return {
      ...defaultState(),
      ...parsed,
      outcomes: Array.isArray(parsed.outcomes) ? parsed.outcomes : []
    };
  } catch {
    return defaultState();
  }
}

function writeState(state: State): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createStore(): Store {
  let state = typeof window === "undefined" ? defaultState() : readState();
  const listeners = new Set<Listener>();

  return {
    get: () => state,
    set: (updater) => {
      state = updater(state);
      if (typeof window !== "undefined") writeState(state);
      for (const l of listeners) l();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

const store = createStore();

export function useAppState<T>(selector: (s: State) => T): T {
  return React.useSyncExternalStore(store.subscribe, () => selector(store.get()), () => selector(defaultState()));
}

export function getAppState(): State {
  return store.get();
}

export const actions = {
  setWeekStartsOn: (weekStartsOn: WeekStartsOn) => {
    store.set((prev) => ({ ...prev, weekStartsOn }));
  },
  selectOutcome: (id: string) => {
    store.set((prev) => ({ ...prev, selectedOutcomeId: id }));
  },
  addOutcome: (input: { title: string; notes?: string; startDate: string; endDate: string }) => {
    const now = new Date().toISOString();
    const outcome: Outcome = {
      id: safeUUID(),
      title: input.title.trim(),
      notes: (input.notes ?? "").trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: now
    };
    store.set((prev) => ({
      ...prev,
      outcomes: [outcome, ...prev.outcomes],
      selectedOutcomeId: outcome.id
    }));
    return outcome.id;
  },
  updateOutcome: (id: string, patch: Partial<Pick<Outcome, "title" | "notes" | "startDate" | "endDate">>) => {
    store.set((prev) => ({
      ...prev,
      outcomes: prev.outcomes.map((o) => (o.id === id ? { ...o, ...patch } : o))
    }));
  },
  deleteOutcome: (id: string) => {
    store.set((prev) => {
      const outcomes = prev.outcomes.filter((o) => o.id !== id);
      const selectedOutcomeId = prev.selectedOutcomeId === id ? outcomes[0]?.id : prev.selectedOutcomeId;

      const prefix = `${id}:`;
      const monthly: Record<string, MonthlyGoal> = {};
      for (const [k, v] of Object.entries(prev.monthly)) if (!k.startsWith(prefix)) monthly[k] = v;
      const weekly: Record<string, WeeklyGoal> = {};
      for (const [k, v] of Object.entries(prev.weekly)) if (!k.startsWith(prefix)) weekly[k] = v;
      const daily: Record<string, DailyGoal> = {};
      for (const [k, v] of Object.entries(prev.daily)) if (!k.startsWith(prefix)) daily[k] = v;

      return { ...prev, outcomes, selectedOutcomeId, monthly, weekly, daily };
    });
  },
  setMonthlyTitle: (outcomeId: string, monthKey: string, title: string) => {
    const key = `${outcomeId}:${monthKey}`;
    store.set((prev) => ({ ...prev, monthly: { ...prev.monthly, [key]: { title } } }));
  },
  setWeeklyTitle: (outcomeId: string, monthKey: string, weekStartISO: string, title: string) => {
    const key = `${outcomeId}:${monthKey}:${weekStartISO}`;
    store.set((prev) => ({ ...prev, weekly: { ...prev.weekly, [key]: { title } } }));
  },
  setDaily: (outcomeId: string, dateISO: string, patch: Partial<DailyGoal>) => {
    const key = `${outcomeId}:${dateISO}`;
    store.set((prev) => {
      const prevDaily = prev.daily[key] ?? { title: "", done: false };
      return { ...prev, daily: { ...prev.daily, [key]: { ...prevDaily, ...patch } } };
    });
  },
  toggleDailyDone: (outcomeId: string, dateISO: string) => {
    const key = `${outcomeId}:${dateISO}`;
    store.set((prev) => {
      const prevDaily = prev.daily[key] ?? { title: "", done: false };
      const done = !prevDaily.done;
      return {
        ...prev,
        daily: {
          ...prev.daily,
          [key]: { ...prevDaily, done, doneAt: done ? new Date().toISOString() : undefined }
        }
      };
    });
  },
  exportJSON: (): string => JSON.stringify(store.get(), null, 2),
  importJSON: (raw: string) => {
    const parsed = JSON.parse(raw) as State;
    if (parsed?.version !== 1) throw new Error("Unsupported state version.");
    store.set(() => ({
      ...defaultState(),
      ...parsed,
      outcomes: Array.isArray(parsed.outcomes) ? parsed.outcomes : []
    }));
  },
  resetAll: () => {
    store.set(() => defaultState());
  }
};

