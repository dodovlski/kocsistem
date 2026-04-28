"use client";

import { useRef, useState } from "react";
import { createBoard } from "@/server/actions/boards";

export function CreateBoardButton() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(formData: FormData) {
    await createBoard(formData);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex items-center justify-center w-10 h-10 rounded-sm bg-brand-red text-white text-2xl font-light hover:bg-brand-red-hover transition-colors leading-none"
        title="Create new board"
      >
        +
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-72 rounded-sm border border-brand-border bg-white shadow-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-brand-dark">New Board</p>
            <form action={handleSubmit} className="space-y-3">
              <input
                ref={inputRef}
                name="title"
                required
                maxLength={80}
                placeholder="Enter board title…"
                className="w-full rounded-sm border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-red/20"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-sm px-3 py-1.5 text-sm text-brand-muted hover:text-brand-dark transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-sm bg-brand-red px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-red-hover transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
