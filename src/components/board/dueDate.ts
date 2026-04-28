export type DueStatus = "overdue" | "soon" | "later" | "done";

const ONE_DAY = 24 * 60 * 60 * 1000;

export function dueStatus(iso: string | null): DueStatus | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = d - now;
  if (diff < -ONE_DAY) return "overdue";
  if (diff < 0) return "overdue";
  if (diff < 3 * ONE_DAY) return "soon";
  return "later";
}

export function dueBadgeClass(iso: string | null): string {
  const s = dueStatus(iso);
  switch (s) {
    case "overdue":
      return "bg-red-50 text-red-700 border-red-200";
    case "soon":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "later":
      return "bg-brand-surface text-brand-muted border-brand-border";
    default:
      return "bg-brand-surface text-brand-muted border-brand-border";
  }
}

export function formatDueShort(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function fromDateInputValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
