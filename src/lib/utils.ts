import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalizeFirstLetter(string: string) {
  if (!string) return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Formats a price in BGN to a string showing both BGN and EUR.
 * Uses the fixed BNB exchange rate.
 * @param priceInBgn The price in Bulgarian Leva.
 * @returns A formatted string like "50.00 лв. / 25.56 €".
 */
export function formatPrice(priceInBgn: number): string {
  if (typeof priceInBgn !== 'number' || isNaN(priceInBgn)) {
    return 'N/A';
  }
  const bgnToEurRate = 1.95583;
  const priceInEur = priceInBgn / bgnToEurRate;

  const formattedBgn = priceInBgn.toFixed(2);
  const formattedEur = priceInEur.toFixed(2);

  return `${formattedBgn} лв. / ${formattedEur} €`;
}
