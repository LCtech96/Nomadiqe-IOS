/**
 * Share and calendar export URLs for host properties.
 */

import { config } from '../constants/config';

/** Deep link for sharing property preview (guest / signup flow). */
export function buildPropertyShareLink(propertyId: string): string {
  const scheme = config.app.shareScheme || 'nomadiqe';
  return `${scheme}://property/${propertyId}`;
}

/**
 * Public iCal feed URL for Airbnb/Booking "import calendar".
 * Uses EXPO_PUBLIC_CALENDAR_EXPORT_BASE_URL when set, otherwise Nomadiqe web API path.
 */
export function buildPropertyCalendarExportUrl(propertyId: string): string {
  const base = config.app.calendarExportBaseUrl?.trim();
  if (base) {
    if (base.includes('property_id=') || base.endsWith('=')) {
      return `${base}${propertyId}`;
    }
    const joiner = base.includes('?') ? '&' : '?';
    return `${base}${joiner}property_id=${propertyId}`;
  }
  return `https://www.nomadiqe.com/api/calendar/ical/${propertyId}`;
}
