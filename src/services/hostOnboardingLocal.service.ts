/**
 * Local persistence for host onboarding wizard state.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  emptyDeliverablesMap,
  type HostCollabMonth,
  type HostDeliverablesMap,
  type HostKolbedPlanKey,
  type HostOnboardingAmenityKey,
  type HostPaymentModel,
  type HostPromotionPlatform,
  type HostReferenceNiche,
} from '../constants/host';
import type { HostCollaborationLevel } from '../constants/creator';
import type { StructureTypeKey } from '../constants/propertyOnboarding';

const dataKey = (userId: string) => `@nomadiqe/host-onboarding/data/${userId}`;

export interface HostOnboardingLocalData {
  step: number;
  kolbedSubStep: number;
  coverPhotoUri: string | null;
  fullName: string;
  description: string;
  structureType: StructureTypeKey | null;
  city: string;
  country: string;
  street: string;
  region: string;
  propertyPhotoUris: string[];
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: HostOnboardingAmenityKey[];
  collabMonths: HostCollabMonth[];
  kolbedSocial: { instagram: string; facebook: string; tiktok: string };
  referenceNiches: HostReferenceNiche[];
  propertyLevel: HostCollaborationLevel | null;
  propertyLevelJustification: string;
  deliverables: HostDeliverablesMap;
  promotionPlatforms: HostPromotionPlatform[];
  sponsorPersonalWebsite: boolean;
  kolbedPlans: HostKolbedPlanKey[];
  openToPaidCollab: boolean;
  hasWebsite: boolean | null;
  websiteUrl: string;
  websiteSocial: Record<string, string>;
  paymentModel: HostPaymentModel | null;
  paymentTermsAccepted: boolean;
}

export const EMPTY_HOST_ONBOARDING_DATA: HostOnboardingLocalData = {
  step: 1,
  kolbedSubStep: 1,
  coverPhotoUri: null,
  fullName: '',
  description: '',
  structureType: null,
  city: '',
  country: '',
  street: '',
  region: '',
  propertyPhotoUris: [],
  guests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  amenities: [],
  collabMonths: [],
  kolbedSocial: { instagram: '', facebook: '', tiktok: '' },
  referenceNiches: [],
  propertyLevel: null,
  propertyLevelJustification: '',
  deliverables: emptyDeliverablesMap(),
  promotionPlatforms: [],
  sponsorPersonalWebsite: false,
  kolbedPlans: ['kolbed_100'],
  openToPaidCollab: false,
  hasWebsite: null,
  websiteUrl: '',
  websiteSocial: {},
  paymentModel: null,
  paymentTermsAccepted: false,
};

export class HostOnboardingLocalService {
  static async save(userId: string, data: Partial<HostOnboardingLocalData>): Promise<void> {
    const existing = (await this.load(userId)) ?? { ...EMPTY_HOST_ONBOARDING_DATA };
    await AsyncStorage.setItem(dataKey(userId), JSON.stringify({ ...existing, ...data }));
  }

  static async load(userId: string): Promise<HostOnboardingLocalData | null> {
    const raw = await AsyncStorage.getItem(dataKey(userId));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return {
        ...EMPTY_HOST_ONBOARDING_DATA,
        ...parsed,
        deliverables: { ...emptyDeliverablesMap(), ...(parsed.deliverables ?? {}) },
        kolbedPlans: Array.isArray(parsed.kolbedPlans) && parsed.kolbedPlans.length > 0
          ? parsed.kolbedPlans
          : ['kolbed_100'],
      };
    } catch {
      return null;
    }
  }

  static async clear(userId: string): Promise<void> {
    await AsyncStorage.removeItem(dataKey(userId));
  }
}
