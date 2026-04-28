"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBoard } from "@/server/actions/boards";
import { ConfirmDialog } from "./ConfirmDialog";

export function DeleteBoardButton({ boardId }: { boardId: string }) {
  const [pending, start] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const remove = () => {
    setConfirmOpen(false);
    start(async () => {
      try {
        await deleteBoard(boardId);
        toast.success("Board deleted");
      } catch {
        toast.error("Could not delete");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label="Delete board"
        className="absolute top-3 right-3 rounded-sm p-1.5 text-brand-muted opacity-0 hover:bg-brand-red/10 hover:text-brand-red group-hover:opacity-100 focus-visible:opacity-100 transition"
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          setConfirmOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete board"
        description="The board and all its columns and cards will be deleted. This action cannot be undone."
        pending={pending}
        onConfirm={remove}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
