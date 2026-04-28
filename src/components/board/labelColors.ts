export type LabelColor =
  | "red"
  | "amber"
  | "green"
  | "blue"
  | "violet"
  | "slate";

export const LABEL_COLORS: { value: LabelColor; label: string; swatch: string }[] = [
  { value: "red", label: "Red", swatch: "bg-red-500" },
  { value: "amber", label: "Amber", swatch: "bg-amber-500" },
  { value: "green", label: "Green", swatch: "bg-green-500" },
  { value: "blue", label: "Blue", swatch: "bg-blue-500" },
  { value: "violet", label: "Violet", swatch: "bg-violet-500" },
  { value: "slate", label: "Slate", swatch: "bg-slate-500" },
];

export function isLabelColor(v: string): v is LabelColor {
  return ["red", "amber", "green", "blue", "violet", "slate"].includes(v);
}

export function labelChipClass(color: string): string {
  switch (color) {
    case "red":
      return "bg-red-100 text-red-800 border-red-200";
    case "amber":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "green":
      return "bg-green-100 text-green-800 border-green-200";
    case "blue":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "violet":
      return "bg-violet-100 text-violet-800 border-violet-200";
    case "slate":
      return "bg-slate-100 text-slate-800 border-slate-200";
    default:
      return "bg-brand-surface text-brand-muted border-brand-border";
  }
}

export function labelDotClass(color: string): string {
  switch (color) {
    case "red":
      return "bg-red-500";
    case "amber":
      return "bg-amber-500";
    case "green":
      return "bg-green-500";
    case "blue":
      return "bg-blue-500";
    case "violet":
      return "bg-violet-500";
    case "slate":
      return "bg-slate-500";
    default:
      return "bg-brand-muted";
  }
}
