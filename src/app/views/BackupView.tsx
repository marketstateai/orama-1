import React from "react";
import { actions, useAppState } from "../store";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Textarea from "../ui/Textarea";

export default function BackupView() {
  const state = useAppState((s) => s);
  const [importRaw, setImportRaw] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const exportRaw = React.useMemo(() => JSON.stringify(state, null, 2), [state]);

  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Backup</div>
            <div className="mt-1 text-sm text-zinc-400">Export/import your data as JSON (stored locally in your browser).</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                await navigator.clipboard.writeText(exportRaw);
              }}
            >
              Copy export
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const ok = confirm("Reset all data? This cannot be undone.");
                if (!ok) return;
                actions.resetAll();
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-xs font-medium text-zinc-400">Export</div>
        <div className="mt-2">
          <Textarea value={exportRaw} readOnly className="font-mono text-xs" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-zinc-400">Import</div>
            <div className="mt-1 text-sm text-zinc-400">Paste a previous export JSON to restore.</div>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setError(null);
              try {
                actions.importJSON(importRaw);
                setImportRaw("");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Import failed.");
              }
            }}
            disabled={!importRaw.trim()}
          >
            Import
          </Button>
        </div>
        <div className="mt-2">
          <Textarea value={importRaw} onChange={(e) => setImportRaw(e.target.value)} placeholder="{ ... }" className="font-mono text-xs" />
        </div>
        {error ? <div className="mt-2 text-sm text-red-300">{error}</div> : null}
      </Card>
    </div>
  );
}

