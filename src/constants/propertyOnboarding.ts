/**
 * Property onboarding: structure types and amenity keys for i18n
 */

export const STRUCTURE_TYPES = [
  'casa',
  'appartamento',
  'fienile',
  'bnb',
  'barca',
  'baita',
  'camper_roulotte',
  'casa_particular',
  'castello',
  'grotta',
  'container',
  'casa_cicladica',
  'dammuso',
  'cupola',
  'casa_organica',
  'fattoria',
  'pensione',
  'hotel',
  'casa_galleggiante',
  'kezhan',
  'minsu',
  'riad',
  'ryokan',
  'capanna',
  'tenda',
  'minicasa',
  'torre',
  'casa_sull_albero',
  'trullo',
  'mulino',
  'iurta',
] as const;

export type StructureTypeKey = (typeof STRUCTURE_TYPES)[number];

/** Amenities: most requested */
export const AMENITIES_REQUESTED = [
  'wifi',
  'tv',
  'cucina',
  'lavatrice',
  'parcheggio_gratuito',
  'parcheggio_pagamento',
  'aria_condizionata',
  'spazio_lavoro',
] as const;

/** Amenities: particular interest */
export const AMENITIES_INTEREST = [
  'piscina',
  'idromassaggio',
  'patio',
  'griglia_barbecue',
  'zona_pranzo_esterna',
  'braciere',
  'tavolo_biliardo',
  'camino',
  'pianoforte',
  'attrezzatura_sportiva',
  'accesso_lago',
  'accesso_spiaggia',
  'accesso_piste',
  'doccia_esterna',
] as const;

/** Security */
export const AMENITIES_SECURITY = [
  'allarme_antincendio',
  'kit_pronto_soccorso',
  'estintore',
  'rilevatore_monossido',
] as const;

export type AmenityKey =
  | (typeof AMENITIES_REQUESTED)[number]
  | (typeof AMENITIES_INTEREST)[number]
  | (typeof AMENITIES_SECURITY)[number];
