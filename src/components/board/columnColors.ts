export type ColumnColor =
  | "red"
  | "amber"
  | "green"
  | "blue"
  | "violet"
  | "slate";

export const COLUMN_COLORS: { value: ColumnColor; label: string; bar: string; swatch: string }[] = [
  { value: "red", label: "Kırmızı", bar: "bg-brand-red", swatch: "bg-brand-red" },
  { value: "amber", label: "Sarı", bar: "bg-amber-500", swatch: "bg-amber-500" },
  { value: "green", label: "Yeşil", bar: "bg-emerald-500", swatch: "bg-emerald-500" },
  { value: "blue", label: "Mavi", bar: "bg-sky-500", swatch: "bg-sky-500" },
  { value: "violet", label: "Mor", bar: "bg-violet-500", swatch: "bg-violet-500" },
  { value: "slate", label: "Gri", bar: "bg-slate-500", swatch: "bg-slate-500" },
];

export function colorBarClass(color: string): string {
  return COLUMN_COLORS.find((c) => c.value === color)?.bar ?? "bg-brand-red";
}
