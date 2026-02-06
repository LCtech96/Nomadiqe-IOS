/**
 * Formatting Utilities
 */

import { format, formatDistanceToNow, Locale } from 'date-fns';
import { it, enUS } from 'date-fns/locale';

const locales: Record<string, Locale> = {
  it,
  en: enUS,
};

/**
 * Format date with locale
 */
export function formatDate(
  date: string | Date,
  formatStr: string = 'PPP',
  locale: string = 'en'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: locales[locale] || enUS });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: string | Date,
  locale: string = 'en'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: locales[locale] || enUS,
  });
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'it-IT'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format number with abbreviation (e.g., 1.2K, 3.5M)
 */
export function formatNumberAbbreviated(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}
