import type { PropertyType } from '../types/property';

/** Amenity keys shown on the host edit-property form (matches web dashboard grid). */
export const EDIT_PROPERTY_AMENITY_KEYS = [
  'wifi',
  'aria_condizionata',
  'riscaldamento',
  'piscina',
  'parcheggio_gratuito',
  'cucina',
  'lavatrice',
  'asciugatrice',
  'tv',
  'balcone',
  'giardino',
  'terrazza',
  'palestra',
  'sauna',
  'idromassaggio',
  'spiaggia_privata',
  'reception_24h',
  'colazione_inclusa',
  'animali_ammessi',
  'ascensore',
  'accesso_disabili',
  'vista_mare',
  'vista_montagna',
  'camino',
  'griglia_barbecue',
  'biciclette',
  'attrezzatura_sportiva',
] as const;

export type EditPropertyAmenityKey = (typeof EDIT_PROPERTY_AMENITY_KEYS)[number];

export const EDIT_PROPERTY_SHARED_AREAS = [
  'bathroom',
  'kitchen',
  'living_room',
  'pool',
  'terrace',
  'garden',
  'breakfast_room',
  'gym',
  'parking',
  'laundry',
] as const;

export type EditPropertySharedAreaKey = (typeof EDIT_PROPERTY_SHARED_AREAS)[number];

export const EDIT_PROPERTY_TYPES: PropertyType[] = [
  'house',
  'apartment',
  'villa',
  'room',
  'studio',
  'loft',
  'cottage',
  'bungalow',
  'other',
];

export const DESCRIPTION_MAX_LENGTH = 150;
