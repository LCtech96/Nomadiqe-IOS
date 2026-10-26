/**
 * Property guide section metadata (icons, translation keys)
 */

import type { PropertyGuideSectionId } from '../types/propertyGuide';
import type { Ionicons } from '@expo/vector-icons';

export interface PropertyGuideSectionMeta {
  id: PropertyGuideSectionId;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  placeholderKey: string;
}

export const PROPERTY_GUIDE_SECTIONS: PropertyGuideSectionMeta[] = [
  { id: 'check_in_out', icon: 'key-outline', labelKey: 'propertyGuide.sections.checkInOut', placeholderKey: 'propertyGuide.placeholders.checkInOut' },
  { id: 'how_to_get_there', icon: 'location-outline', labelKey: 'propertyGuide.sections.howToGetThere', placeholderKey: 'propertyGuide.placeholders.howToGetThere' },
  { id: 'wifi', icon: 'wifi-outline', labelKey: 'propertyGuide.sections.wifi', placeholderKey: 'propertyGuide.placeholders.wifi' },
  { id: 'transportation', icon: 'train-outline', labelKey: 'propertyGuide.sections.transportation', placeholderKey: 'propertyGuide.placeholders.transportation' },
  { id: 'good_to_know', icon: 'information-circle-outline', labelKey: 'propertyGuide.sections.goodToKnow', placeholderKey: 'propertyGuide.placeholders.goodToKnow' },
  { id: 'what_to_do', icon: 'map-outline', labelKey: 'propertyGuide.sections.whatToDo', placeholderKey: 'propertyGuide.placeholders.whatToDo' },
  { id: 'restaurants', icon: 'restaurant-outline', labelKey: 'propertyGuide.sections.restaurants', placeholderKey: 'propertyGuide.placeholders.restaurants' },
  { id: 'bars', icon: 'wine-outline', labelKey: 'propertyGuide.sections.bars', placeholderKey: 'propertyGuide.placeholders.bars' },
  { id: 'property_rules', icon: 'ban-outline', labelKey: 'propertyGuide.sections.propertyRules', placeholderKey: 'propertyGuide.placeholders.propertyRules' },
  { id: 'emergencies', icon: 'medkit-outline', labelKey: 'propertyGuide.sections.emergencies', placeholderKey: 'propertyGuide.placeholders.emergencies' },
];
