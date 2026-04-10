/**
 * Content creator: categorie, tipi strutture, social
 */

export type CreatorCategory = 'micro_influencer' | 'influencer' | 'ugc_creator';

export type StructureOpportunity =
  | 'basic'
  | 'basic_paid'
  | 'medium'
  | 'medium_fees'
  | 'luxury'
  | 'luxury_paid';

export type CreatorStatus = 'pending' | 'approved' | 'rejected';

export const CREATOR_CATEGORIES: { value: CreatorCategory; labelKey: string }[] = [
  { value: 'micro_influencer', labelKey: 'creator.categoryMicroInfluencer' },
  { value: 'influencer', labelKey: 'creator.categoryInfluencer' },
  { value: 'ugc_creator', labelKey: 'creator.categoryUgcCreator' },
];

export const STRUCTURE_OPPORTUNITIES: { value: StructureOpportunity; labelKey: string }[] = [
  { value: 'basic', labelKey: 'creator.structureBasic' },
  { value: 'basic_paid', labelKey: 'creator.structureBasicPaid' },
  { value: 'medium', labelKey: 'creator.structureMedium' },
  { value: 'medium_fees', labelKey: 'creator.structureMediumFees' },
  { value: 'luxury', labelKey: 'creator.structureLuxury' },
  { value: 'luxury_paid', labelKey: 'creator.structureLuxuryPaid' },
];

export const MIN_STRUCTURE_SELECTIONS = 2;

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'x'
  | 'youtube'
  | 'pinterest'
  | 'linkedin';

export const SOCIAL_PLATFORMS: { key: SocialPlatform; labelKey: string; placeholder: string }[] = [
  { key: 'instagram', labelKey: 'creator.socialInstagram', placeholder: 'https://instagram.com/...' },
  { key: 'tiktok', labelKey: 'creator.socialTiktok', placeholder: 'https://tiktok.com/@...' },
  { key: 'facebook', labelKey: 'creator.socialFacebook', placeholder: 'https://facebook.com/...' },
  { key: 'x', labelKey: 'creator.socialX', placeholder: 'https://x.com/...' },
  { key: 'youtube', labelKey: 'creator.socialYoutube', placeholder: 'https://youtube.com/...' },
  { key: 'pinterest', labelKey: 'creator.socialPinterest', placeholder: 'https://pinterest.com/...' },
  { key: 'linkedin', labelKey: 'creator.socialLinkedin', placeholder: 'https://linkedin.com/in/...' },
];

export interface SocialLinksMap {
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
  x?: string | null;
  youtube?: string | null;
  pinterest?: string | null;
  linkedin?: string | null;
}
