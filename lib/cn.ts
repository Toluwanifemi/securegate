import { clsx, type ClassValue } from "clsx";

/**
 * Standard utility to conditionally combine CSS Module classes.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
