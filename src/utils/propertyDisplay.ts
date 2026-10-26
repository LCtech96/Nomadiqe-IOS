/**
 * Helpers for displaying property info in Explore and detail views.
 */

import type { Property } from '../types/property';

export function formatPropertyLocation(property: Property): string {
  const parts = [property.city, property.country].filter(Boolean);
  return parts.join(', ').toUpperCase();
}

export function getPropertyDisplayTitle(
  property: Property,
  t: (key: string) => string
): string {
  if (property.title?.trim()) {
    return property.title.trim().toUpperCase();
  }

  const city = (property.city || '').trim().toUpperCase();
  const structureKey = property.structure_type || property.type || 'other';
  const typeLabel = t(`propertyType.${structureKey}`).toUpperCase();

  if (city) {
    return `STAY · ${city} · ${typeLabel}`;
  }

  return typeLabel || t('properties.property').toUpperCase();
}

export function getAmenityLabel(amenityKey: string, t: (key: string) => string): string {
  const translated = t(`amenity.${amenityKey}`);
  if (translated && translated !== `amenity.${amenityKey}`) {
    return translated.toUpperCase();
  }
  return amenityKey.replace(/_/g, ' ').toUpperCase();
}

export function getStructureTypeLabel(property: Property, t: (key: string) => string): string {
  const key = property.structure_type || property.type || 'other';
  return t(`propertyType.${key}`).toUpperCase();
}
