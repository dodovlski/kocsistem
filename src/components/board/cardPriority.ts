export type CardPriority = "none" | "low" | "medium" | "high";

export const CARD_PRIORITIES: { value: CardPriority; label: string }[] = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function isPriority(v: string): v is CardPriority {
  return v === "none" || v === "low" || v === "medium" || v === "high";
}

export function priorityBorderClass(p: CardPriority): string {
  switch (p) {
    case "high":
      return "border-l-red-500";
    case "medium":
      return "border-l-amber-500";
    case "low":
      return "border-l-blue-500";
    default:
      return "border-l-brand-red/60";
  }
}

export function priorityDotClass(p: CardPriority): string {
  switch (p) {
    case "high":
      return "bg-red-500";
    case "medium":
      return "bg-amber-500";
    case "low":
      return "bg-blue-500";
    default:
      return "bg-brand-muted/40";
  }
}

export function priorityLabel(p: CardPriority): string {
  return CARD_PRIORITIES.find((x) => x.value === p)?.label ?? "None";
}
