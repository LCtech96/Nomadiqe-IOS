/**
 * Content creator onboarding constants
 */

export type CreatorCategory = 'ugc_creator' | 'micro_influencer' | 'influencer';

export type HostCollaborationLevel = 'basic' | 'medium' | 'luxury';

/** @deprecated Legacy structure options — kept for admin/seed compatibility */
export type StructureOpportunity =
  | 'basic'
  | 'basic_paid'
  | 'medium'
  | 'medium_fees'
  | 'luxury'
  | 'luxury_paid';

export type CreatorStatus = 'pending' | 'approved' | 'rejected';

export const CREATOR_ONBOARDING_STEPS = 6;

export const MIN_GALLERY_IMAGES = 5;
export const MAX_GALLERY_IMAGES = 20;
export const MAX_ANALYTICS_SCREENSHOTS = 50;
export const MAX_CREATOR_BIO_LENGTH = 300;

export const CREATOR_CATEGORIES: {
  value: CreatorCategory;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    value: 'ugc_creator',
    labelKey: 'creator.tierUgc',
    descriptionKey: 'creator.tierUgcDesc',
  },
  {
    value: 'micro_influencer',
    labelKey: 'creator.tierMicro',
    descriptionKey: 'creator.tierMicroDesc',
  },
  {
    value: 'influencer',
    labelKey: 'creator.tierMacro',
    descriptionKey: 'creator.tierMacroDesc',
  },
];

export const HOST_COLLABORATION_LEVELS: { value: HostCollaborationLevel; labelKey: string }[] = [
  { value: 'basic', labelKey: 'creator.hostLevelBasic' },
  { value: 'medium', labelKey: 'creator.hostLevelMedium' },
  { value: 'luxury', labelKey: 'creator.hostLevelLuxury' },
];

/** Host-level collaboration hint shown under each tier option once creator type is selected (step 3). */
export const HOST_LEVEL_TIER_MESSAGES: Record<
  CreatorCategory,
  Record<HostCollaborationLevel, string>
> = {
  ugc_creator: {
    basic: 'creator.hostLevelMsgUgcBasic',
    medium: 'creator.hostLevelMsgUgcMedium',
    luxury: 'creator.hostLevelMsgUgcLuxury',
  },
  micro_influencer: {
    basic: 'creator.hostLevelMsgMicroBasic',
    medium: 'creator.hostLevelMsgMicroMedium',
    luxury: 'creator.hostLevelMsgMicroLuxury',
  },
  influencer: {
    basic: 'creator.hostLevelMsgMacroBasic',
    medium: 'creator.hostLevelMsgMacroMedium',
    luxury: 'creator.hostLevelMsgMacroLuxury',
  },
};

/** @deprecated Legacy — use HOST_COLLABORATION_LEVELS in creator onboarding */
export const STRUCTURE_OPPORTUNITIES: { value: StructureOpportunity; labelKey: string }[] = [
  { value: 'basic', labelKey: 'creator.structureBasic' },
  { value: 'basic_paid', labelKey: 'creator.structureBasicPaid' },
  { value: 'medium', labelKey: 'creator.structureMedium' },
  { value: 'medium_fees', labelKey: 'creator.structureMediumFees' },
  { value: 'luxury', labelKey: 'creator.structureLuxury' },
  { value: 'luxury_paid', labelKey: 'creator.structureLuxuryPaid' },
];

export const MIN_STRUCTURE_SELECTIONS = 1;

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'x'
  | 'linkedin'
  | 'youtube'
  | 'reddit';

export const CREATOR_SOCIAL_PLATFORMS: {
  key: SocialPlatform;
  labelKey: string;
  placeholderKey: string;
  required?: boolean;
}[] = [
  { key: 'instagram', labelKey: 'creator.socialInstagram', placeholderKey: 'creator.socialInstagramPlaceholder', required: true },
  { key: 'tiktok', labelKey: 'creator.socialTiktok', placeholderKey: 'creator.socialUrlPlaceholder' },
  { key: 'facebook', labelKey: 'creator.socialFacebook', placeholderKey: 'creator.socialUrlPlaceholder' },
  { key: 'x', labelKey: 'creator.socialX', placeholderKey: 'creator.socialUrlPlaceholder' },
  { key: 'linkedin', labelKey: 'creator.socialLinkedin', placeholderKey: 'creator.socialUrlPlaceholder' },
  { key: 'youtube', labelKey: 'creator.socialYoutube', placeholderKey: 'creator.socialUrlPlaceholder' },
  { key: 'reddit', labelKey: 'creator.socialReddit', placeholderKey: 'creator.socialUrlPlaceholder' },
];

/** @deprecated Use CREATOR_SOCIAL_PLATFORMS */
export const SOCIAL_PLATFORMS: { key: SocialPlatform; labelKey: string; placeholder: string }[] =
  CREATOR_SOCIAL_PLATFORMS.map(({ key, labelKey, placeholderKey }) => ({
    key,
    labelKey,
    placeholder: placeholderKey,
  }));

export type RateFieldKey =
  | 'reel'
  | 'post'
  | 'carousel'
  | 'story'
  | 'talkingFaceReel'
  | 'silentReelWithFace'
  | 'aestheticOnly'
  | 'paidAds';

export const CREATOR_RATE_FIELDS: {
  key: RateFieldKey;
  labelKey: string;
  section: 'main' | 'reels';
  fullWidth?: boolean;
}[] = [
  { key: 'reel', labelKey: 'creator.rateReel', section: 'main' },
  { key: 'post', labelKey: 'creator.ratePost', section: 'main' },
  { key: 'carousel', labelKey: 'creator.rateCarousel', section: 'main' },
  { key: 'story', labelKey: 'creator.rateStory', section: 'main' },
  { key: 'talkingFaceReel', labelKey: 'creator.rateTalkingFaceReel', section: 'reels' },
  { key: 'silentReelWithFace', labelKey: 'creator.rateSilentReel', section: 'reels' },
  { key: 'aestheticOnly', labelKey: 'creator.rateAestheticOnly', section: 'reels', fullWidth: true },
  { key: 'paidAds', labelKey: 'creator.ratePaidAds', section: 'reels', fullWidth: true },
];

export interface SocialLinksMap {
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
  x?: string | null;
  youtube?: string | null;
  linkedin?: string | null;
  reddit?: string | null;
}
