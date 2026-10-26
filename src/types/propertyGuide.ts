/**
 * Property Guide Types — host-editable guest info per property
 */

export type PropertyGuideSectionId =
  | 'check_in_out'
  | 'how_to_get_there'
  | 'wifi'
  | 'transportation'
  | 'good_to_know'
  | 'what_to_do'
  | 'restaurants'
  | 'bars'
  | 'property_rules'
  | 'emergencies';

export interface PropertyGuide {
  id: string;
  property_id: string;
  host_id: string;
  check_in_out: string;
  how_to_get_there: string;
  wifi: string;
  transportation: string;
  good_to_know: string;
  what_to_do: string;
  restaurants: string;
  bars: string;
  property_rules: string;
  emergency_numbers: string;
  created_at: string;
  updated_at: string;
}

export type PropertyGuideFields = Pick<
  PropertyGuide,
  | 'check_in_out'
  | 'how_to_get_there'
  | 'wifi'
  | 'transportation'
  | 'good_to_know'
  | 'what_to_do'
  | 'restaurants'
  | 'bars'
  | 'property_rules'
  | 'emergency_numbers'
>;

export const PROPERTY_GUIDE_SECTION_IDS: PropertyGuideSectionId[] = [
  'check_in_out',
  'how_to_get_there',
  'wifi',
  'transportation',
  'good_to_know',
  'what_to_do',
  'restaurants',
  'bars',
  'property_rules',
  'emergencies',
];

export const SECTION_TO_FIELD: Record<PropertyGuideSectionId, keyof PropertyGuideFields> = {
  check_in_out: 'check_in_out',
  how_to_get_there: 'how_to_get_there',
  wifi: 'wifi',
  transportation: 'transportation',
  good_to_know: 'good_to_know',
  what_to_do: 'what_to_do',
  restaurants: 'restaurants',
  bars: 'bars',
  property_rules: 'property_rules',
  emergencies: 'emergency_numbers',
};
