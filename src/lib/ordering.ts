import { generateKeyBetween } from "fractional-indexing";

export function orderBetween(
  prev: string | null,
  next: string | null,
): string {
  return generateKeyBetween(prev, next);
}

export function orderAtEnd(last: string | null): string {
  return generateKeyBetween(last, null);
}
