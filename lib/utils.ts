import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Produces a Tailwind aware class string by collapsing falsy values and resolving conflicts.
 * Useful anytime conditional classes would otherwise clash per Tailwind rules.
 *
 * @param inputs Variadic class entries that may include conditionals.
 * @returns A single merged class string safe for Tailwind usage.
 * @see https://www.npmjs.com/package/clsx
 * @see https://github.com/dcastil/tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
