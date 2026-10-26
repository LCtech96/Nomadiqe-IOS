/**
 * Local persistence for creator onboarding media and fields not yet synced to the backend.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const mediaKey = (userId: string) => `@nomadiqe/creator-onboarding/media/${userId}`;
const dataKey = (userId: string) => `@nomadiqe/creator-onboarding/data/${userId}`;

export type CreatorOnboardingCurrency = 'EUR' | 'USD';

export interface CreatorOnboardingRates {
  reel: string;
  post: string;
  carousel: string;
  story: string;
  talkingFaceReel: string;
  silentReelWithFace: string;
  aestheticOnly: string;
  paidAds: string;
}

export interface CreatorOnboardingLocalData {
  profilePhotoUri: string | null;
  galleryUris: string[];
  analyticsUris: string[];
  nationality: string;
  nearestAirport: string;
  portfolioLinks: string[];
  currency: CreatorOnboardingCurrency;
  rates: CreatorOnboardingRates;
  rateNotes: { basic: string; medium: string; luxury: string };
  organicUseAccepted: boolean;
  showcaseInterest: boolean | null;
  activateShowcase: boolean;
  premiumCreator: boolean;
  termsAccepted: boolean;
}

export const EMPTY_RATES: CreatorOnboardingRates = {
  reel: '',
  post: '',
  carousel: '',
  story: '',
  talkingFaceReel: '',
  silentReelWithFace: '',
  aestheticOnly: '',
  paidAds: '',
};

export const EMPTY_LOCAL_DATA: CreatorOnboardingLocalData = {
  profilePhotoUri: null,
  galleryUris: [],
  analyticsUris: [],
  nationality: '',
  nearestAirport: '',
  portfolioLinks: [''],
  currency: 'EUR',
  rates: { ...EMPTY_RATES },
  rateNotes: { basic: '', medium: '', luxury: '' },
  organicUseAccepted: false,
  showcaseInterest: null,
  activateShowcase: false,
  premiumCreator: false,
  termsAccepted: false,
};

export class CreatorOnboardingLocalService {
  static async saveMedia(
    userId: string,
    media: Pick<CreatorOnboardingLocalData, 'profilePhotoUri' | 'galleryUris' | 'analyticsUris'>
  ): Promise<void> {
    await AsyncStorage.setItem(mediaKey(userId), JSON.stringify(media));
  }

  static async loadMedia(userId: string): Promise<Pick<
    CreatorOnboardingLocalData,
    'profilePhotoUri' | 'galleryUris' | 'analyticsUris'
  > | null> {
    const raw = await AsyncStorage.getItem(mediaKey(userId));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static async saveData(userId: string, data: Partial<CreatorOnboardingLocalData>): Promise<void> {
    const existing = (await this.loadData(userId)) ?? { ...EMPTY_LOCAL_DATA };
    await AsyncStorage.setItem(dataKey(userId), JSON.stringify({ ...existing, ...data }));
  }

  static async loadData(userId: string): Promise<CreatorOnboardingLocalData | null> {
    const raw = await AsyncStorage.getItem(dataKey(userId));
    if (!raw) return null;
    try {
      return { ...EMPTY_LOCAL_DATA, ...JSON.parse(raw) };
    } catch {
      return null;
    }
  }

  static async saveAll(userId: string, data: CreatorOnboardingLocalData): Promise<void> {
    await Promise.all([
      this.saveMedia(userId, {
        profilePhotoUri: data.profilePhotoUri,
        galleryUris: data.galleryUris,
        analyticsUris: data.analyticsUris,
      }),
      this.saveData(userId, data),
    ]);
  }
}
