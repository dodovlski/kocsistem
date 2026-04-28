"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { leaveBoard } from "@/server/actions/members";
import { ConfirmDialog } from "./ConfirmDialog";

export function LeaveBoardButton({ boardId }: { boardId: string }) {
  const [pending, start] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const leave = () => {
    setConfirmOpen(false);
    start(async () => {
      try {
        await leaveBoard({ boardId });
        toast.success("You left the board");
      } catch {
        toast.error("Could not leave");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label="Leave board"
        title="Leave board"
        className="absolute top-3 right-3 rounded-sm p-1.5 text-brand-muted opacity-0 hover:bg-brand-dark/10 hover:text-brand-dark group-hover:opacity-100 focus-visible:opacity-100 transition"
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          setConfirmOpen(true);
        }}
      >
        <LogOut className="h-4 w-4" />
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Leave board"
        description="You will no longer have access to this board. You will need to be invited by the owner to access it again."
        confirmLabel="Leave"
        pending={pending}
        onConfirm={leave}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
