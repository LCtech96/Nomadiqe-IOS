/**
 * Extended host edit fields stored inside properties.tier_deliverables._hostEditMeta
 * so we don't require a DB migration for dashboard edit form fields.
 */

export interface PropertyRoomRow {
  name: string;
  beds: number;
  type?: string;
}

export interface PropertyEditExtras {
  nearest_airport?: string;
  street_number?: string;
  pets_allowed?: boolean;
  cleaning_every_days?: number | null;
  rooms?: PropertyRoomRow[];
  shared_areas?: string[];
  cleaning_timezone?: string;
  cleaning_hours_after_checkout?: number | null;
  floor_access?: string;
  keybox_codes?: string;
  legal_pdf_url?: string | null;
  custom_amenities?: string[];
}

const META_KEY = '_hostEditMeta';

export function readPropertyEditExtras(
  tierDeliverables: Record<string, unknown> | null | undefined
): PropertyEditExtras {
  if (!tierDeliverables || typeof tierDeliverables !== 'object') return {};
  const raw = tierDeliverables[META_KEY];
  if (!raw || typeof raw !== 'object') return {};
  return raw as PropertyEditExtras;
}

export function mergePropertyEditExtras(
  tierDeliverables: Record<string, unknown> | null | undefined,
  extras: PropertyEditExtras
): Record<string, unknown> {
  const base =
    tierDeliverables && typeof tierDeliverables === 'object' ? { ...tierDeliverables } : {};
  return { ...base, [META_KEY]: extras };
}
