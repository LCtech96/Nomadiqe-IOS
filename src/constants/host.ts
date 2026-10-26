/**
 * Host onboarding constants — aligned with the Nomadiqe website flow.
 */

import type { HostCollaborationLevel } from './creator';

export const HOST_ONBOARDING_STEPS = 6;

export const MAX_HOST_PROPERTY_PHOTOS = 10;
export const MAX_PROPERTY_DESCRIPTION = 500;
export const MIN_TIER_JUSTIFICATION = 15;

export const HOST_COLLAB_MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

export type HostCollabMonth = (typeof HOST_COLLAB_MONTHS)[number];

export const HOST_REFERENCE_NICHES = [
  'travel',
  'lifestyle',
  'food',
  'adventure',
  'luxury',
  'wellness',
  'sport',
  'fitness',
  'fashion',
  'beauty',
  'tech',
  'photography',
  'art',
  'music',
  'family',
  'pets',
  'eco_friendly',
  'business',
] as const;

export type HostReferenceNiche = (typeof HOST_REFERENCE_NICHES)[number];

export const HOST_KOLBED_SOCIAL_PLATFORMS = [
  { key: 'instagram' as const, labelKey: 'host.socialInstagram', placeholderKey: 'host.socialInstagramPlaceholder' },
  { key: 'facebook' as const, labelKey: 'host.socialFacebook', placeholderKey: 'host.socialFacebookPlaceholder' },
  { key: 'tiktok' as const, labelKey: 'host.socialTiktok', placeholderKey: 'host.socialTiktokPlaceholder' },
];

export const HOST_WEBSITE_SOCIAL_PLATFORMS = [
  { key: 'facebook' as const, labelKey: 'host.socialFacebook', placeholderKey: 'host.socialUrlPlaceholder' },
  { key: 'instagram' as const, labelKey: 'host.socialInstagram', placeholderKey: 'host.socialInstagramPlaceholder' },
  { key: 'tiktok' as const, labelKey: 'host.socialTiktok', placeholderKey: 'host.socialTiktokPlaceholder' },
  { key: 'youtube' as const, labelKey: 'host.socialYoutube', placeholderKey: 'host.socialUrlPlaceholder' },
  { key: 'linkedin' as const, labelKey: 'host.socialLinkedin', placeholderKey: 'host.socialUrlPlaceholder' },
  { key: 'x' as const, labelKey: 'host.socialX', placeholderKey: 'host.socialUrlPlaceholder' },
];

export const HOST_PROMOTION_PLATFORMS = [
  { key: 'instagram', labelKey: 'host.socialInstagram' },
  { key: 'tiktok', labelKey: 'host.socialTiktok' },
  { key: 'facebook', labelKey: 'host.socialFacebook' },
  { key: 'youtube', labelKey: 'host.socialYoutube' },
  { key: 'linkedin', labelKey: 'host.socialLinkedin' },
  { key: 'x', labelKey: 'host.socialX' },
] as const;

export type HostPromotionPlatform = (typeof HOST_PROMOTION_PLATFORMS)[number]['key'];

export const HOST_DELIVERABLE_TIERS = [
  { key: 'ugc_basic', labelKey: 'host.deliverableUgcBasic' },
  { key: 'micro_ugc2', labelKey: 'host.deliverableMicroUgc2' },
  { key: 'micro_influencer', labelKey: 'host.deliverableMicroInfluencer' },
  { key: 'macro_influencer', labelKey: 'host.deliverableMacroInfluencer' },
] as const;

export type HostDeliverableTierKey = (typeof HOST_DELIVERABLE_TIERS)[number]['key'];

export interface HostTierDeliverables {
  videoReel: string;
  staticPosts: string;
  stories: string;
  notes: string;
}

export type HostDeliverablesMap = Record<HostDeliverableTierKey, HostTierDeliverables>;

export const EMPTY_DELIVERABLES: HostTierDeliverables = {
  videoReel: '',
  staticPosts: '',
  stories: '',
  notes: '',
};

export function emptyDeliverablesMap(): HostDeliverablesMap {
  return {
    ugc_basic: { ...EMPTY_DELIVERABLES },
    micro_ugc2: { ...EMPTY_DELIVERABLES },
    micro_influencer: { ...EMPTY_DELIVERABLES },
    macro_influencer: { ...EMPTY_DELIVERABLES },
  };
}

export const HOST_KOLBED_PLANS = [
  {
    key: 'kolbed_100' as const,
    labelKey: 'host.kolbedPlan7Nights',
    descKey: 'host.kolbedPlan7NightsDesc',
    required: true,
  },
  {
    key: 'kolbed_50' as const,
    labelKey: 'host.kolbedPlan28Nights',
    descKey: 'host.kolbedPlan28NightsDesc',
    required: false,
  },
  {
    key: 'cleaning_only' as const,
    labelKey: 'host.kolbedPlan14Nights',
    descKey: 'host.kolbedPlan14NightsDesc',
    required: false,
  },
] as const;

export type HostKolbedPlanKey = (typeof HOST_KOLBED_PLANS)[number]['key'];

export type HostPaymentModel = 'personal_checkout' | 'nomadiqe_5_percent';

export const HOST_PAYMENT_MODELS: {
  key: HostPaymentModel;
  labelKey: string;
  descKey: string;
}[] = [
  {
    key: 'personal_checkout',
    labelKey: 'host.paymentPersonalCheckout',
    descKey: 'host.paymentPersonalCheckoutDesc',
  },
  {
    key: 'nomadiqe_5_percent',
    labelKey: 'host.paymentNomadiqe5',
    descKey: 'host.paymentNomadiqe5Desc',
  },
];

/** Info banner shown when host selects basic / medium / luxury property level. */
export const HOST_PROPERTY_LEVEL_INFO: Record<
  HostCollaborationLevel,
  { icon: string; titleKey: string; bodyKey: string }
> = {
  basic: {
    icon: '🎥',
    titleKey: 'host.propertyLevelBasicTitle',
    bodyKey: 'host.propertyLevelInfoBody',
  },
  medium: {
    icon: '📸',
    titleKey: 'host.propertyLevelMediumTitle',
    bodyKey: 'host.propertyLevelInfoBody',
  },
  luxury: {
    icon: '✨',
    titleKey: 'host.propertyLevelLuxuryTitle',
    bodyKey: 'host.propertyLevelInfoBody',
  },
};

/** Website amenities checklist (services/amenities section). */
export const HOST_ONBOARDING_AMENITIES = [
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

export type HostOnboardingAmenityKey = (typeof HOST_ONBOARDING_AMENITIES)[number];
