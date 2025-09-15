import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistance } from 'date-fns';

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date in a user-friendly way
 * @param date - The date to format
 * @returns A string representation of the date
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

/**
 * Format a date relative to now
 * @param date - The date to format
 * @returns A string representation of the date relative to now (e.g., "3 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  return formatDistance(date, new Date(), { addSuffix: true });
}

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @returns A formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Generate initials from a name
 * @param name - The name to generate initials from
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}