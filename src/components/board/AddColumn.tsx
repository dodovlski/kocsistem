"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

export function AddColumn({
  onAdd,
  adding: controlledAdding,
  onAddingChange,
}: {
  onAdd: (title: string) => void;
  adding?: boolean;
  onAddingChange?: (v: boolean) => void;
}) {
  const [uncontrolledAdding, setUncontrolledAdding] = useState(false);
  const adding = controlledAdding ?? uncontrolledAdding;
  const setAdding = (v: boolean) => {
    if (onAddingChange) onAddingChange(v);
    else setUncontrolledAdding(v);
  };
  const [title, setTitle] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adding) {
      rootRef.current?.scrollIntoView({
        behavior: "smooth",
        inline: "end",
        block: "nearest",
      });
    }
  }, [adding]);

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="w-[280px] shrink-0 rounded-sm border border-dashed border-brand-border bg-white/50 p-3 text-sm font-medium text-brand-muted hover:bg-white hover:border-brand-dark hover:text-brand-dark flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="h-5 w-5 sm:h-4 sm:w-4" /> Add column
      </button>
    );
  }

  const submit = () => {
    const t = title.trim();
    if (!t) {
      setAdding(false);
      return;
    }
    onAdd(t);
    setTitle("");
    setAdding(false);
  };

  return (
    <div
      ref={rootRef}
      className="w-[280px] shrink-0 rounded-sm border border-brand-border bg-white shadow-sm overflow-hidden"
    >
      <div className="h-1 w-full bg-brand-red" />
      <div className="p-3 space-y-2">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") {
              setTitle("");
              setAdding(false);
            }
          }}
          placeholder="Column title"
          className="w-full rounded-sm border border-brand-border bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-dark"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={submit}
            className="rounded-sm bg-brand-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-red-hover"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setTitle("");
              setAdding(false);
            }}
            className="rounded-sm border border-brand-border bg-white px-3 py-1.5 text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
