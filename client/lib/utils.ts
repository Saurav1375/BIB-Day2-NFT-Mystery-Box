import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Offset to ensure Base-36 string is at least 6 digits (36^5 = 60,466,176) */
const ID_OFFSET = 60466176;

/** Convert a numeric ID to a 6-character alphanumeric slug */
export function toSlug(id: number | bigint): string {
  return (Number(id) + ID_OFFSET).toString(36).toUpperCase();
}

/** Convert a 6-character alphanumeric slug back to a numeric ID */
export function fromSlug(slug: string): number {
  if (!slug || slug.length < 6) return 0;
  const num = parseInt(slug, 36);
  return isNaN(num) ? 0 : num - ID_OFFSET;
}

