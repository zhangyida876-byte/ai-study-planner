import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Radix Select 禁止 value=""，空值时用 undefined 以显示 placeholder */
export function toSelectValue(value: string | undefined | null): string | undefined {
  return value ? value : undefined
}