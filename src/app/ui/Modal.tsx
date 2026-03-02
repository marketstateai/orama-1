import React from "react";
import { cn } from "./cn";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export default function Modal({ open, onClose, title, children, footer, className }: Props) {
  const ref = React.useRef<HTMLDialogElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className={cn(
        "w-[min(720px,92vw)] rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl backdrop:bg-black/60",
        className
      )}
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
        <div>
          <div className="text-base font-semibold">{title}</div>
          <div className="mt-1 text-xs text-zinc-400">Outcome → monthly → weekly → daily</div>
        </div>
        <button
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs hover:bg-zinc-800/70"
          onClick={onClose}
        >
          Esc
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer ? <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-4">{footer}</div> : null}
    </dialog>
  );
}

