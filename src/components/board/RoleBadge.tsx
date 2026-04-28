import type { BoardRole } from "@/lib/auth";
import { cn } from "@/lib/cn";

const STYLES: Record<BoardRole, string> = {
  OWNER: "bg-brand-red/10 text-brand-red",
  EDITOR: "bg-blue-100 text-blue-700",
  VIEWER: "bg-slate-100 text-slate-600",
};

const LABELS: Record<BoardRole, string> = {
  OWNER: "Owner",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

export function RoleBadge({
  role,
  className,
}: {
  role: BoardRole;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] sm:text-[10px] font-semibold uppercase tracking-wide",
        STYLES[role],
        className,
      )}
    >
      {LABELS[role]}
    </span>
  );
}
