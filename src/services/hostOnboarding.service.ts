/**
 * Host onboarding submission — creates property, uploads media, saves profile for admin review.
 */

import { AuthService } from './auth.service';
import { PropertiesService } from './properties.service';
import { ProfilesService } from './profiles.service';
import type { HostOnboardingLocalData } from './hostOnboardingLocal.service';
import type { HostCollaborationLevel } from '../constants/creator';

function mapKolbedProgram(plans: HostOnboardingLocalData['kolbedPlans']) {
  if (plans.includes('kolbed_100')) return 'kolbed_100' as const;
  if (plans.includes('kolbed_50')) return 'kolbed_50' as const;
  if (plans.includes('cleaning_only')) return 'kolbed_50' as const;
  return 'kolbed_100' as const;
}

function mapOfferType(level: HostCollaborationLevel, paidCollab: boolean) {
  if (level === 'basic') return paidCollab ? 'basic_paid' : 'basic';
  if (level === 'medium') return paidCollab ? 'medium_fees' : 'medium';
  return paidCollab ? 'luxury_paid' : 'luxury';
}

export class HostOnboardingService {
  static async submit(userId: string, data: HostOnboardingLocalData): Promise<void> {
    const { data: authData, error: authError } = await (await import('./supabase')).supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData.user || authData.user.id !== userId) {
      throw new Error('Session invalid. Please sign in again.');
    }

    await ProfilesService.ensureProfile(
      userId,
      authData.user.email ?? '',
      data.fullName.trim() || undefined,
      authData.user.user_metadata?.username as string | undefined
    );

    const propertyTitle =
      data.city.trim() && data.country.trim()
        ? `${data.city.trim()}, ${data.country.trim()}`
        : 'My property';

    const property = await PropertiesService.createProperty(
      userId,
      propertyTitle,
      data.structureType
    );

    const addressParts = [data.street.trim(), data.city.trim(), data.region.trim(), data.country.trim()]
      .filter(Boolean);
    const address = addressParts.join(', ') || data.city.trim() || 'TBD';

    await PropertiesService.updateProperty(property.id, {
      title: propertyTitle,
      description: data.description.trim(),
      structure_type: data.structureType,
      city: data.city.trim(),
      country: data.country.trim().toUpperCase(),
      street_address: data.street.trim() || null,
      region: data.region.trim() || null,
      address,
      max_guests: data.guests,
      bedrooms: data.bedrooms,
      beds: data.beds,
      bathrooms: data.bathrooms,
      amenities: data.amenities,
      kolbed_program: mapKolbedProgram(data.kolbedPlans),
      offer_type: data.propertyLevel
        ? mapOfferType(data.propertyLevel, data.openToPaidCollab)
        : null,
      tier_deliverables: data.deliverables,
      status: 'draft',
      is_active: false,
    });

    if (data.coverPhotoUri) {
      try {
        const coverUrl = await PropertiesService.uploadPropertyImage(
          property.id,
          userId,
          data.coverPhotoUri
        );
        await PropertiesService.updateProperty(property.id, {
          images: [coverUrl],
        });
      } catch {
        // Cover upload failure should not block submission
      }
    }

    for (const uri of data.propertyPhotoUris) {
      try {
        await PropertiesService.uploadPropertyImage(property.id, userId, uri);
      } catch {
        // Individual photo failures are non-blocking
      }
    }

    const kolbedSocial: Record<string, string | null> = {
      instagram: data.kolbedSocial.instagram.trim() || null,
      facebook: data.kolbedSocial.facebook.trim() || null,
      tiktok: data.kolbedSocial.tiktok.trim() || null,
    };

    const websiteSocial: Record<string, string | null> = {};
    Object.entries(data.websiteSocial).forEach(([key, value]) => {
      websiteSocial[key] = value.trim() || null;
    });

    const socialLinks = data.hasWebsite
      ? { ...kolbedSocial, ...websiteSocial, website: data.websiteUrl.trim() || null }
      : kolbedSocial;

    await AuthService.updateProfile(userId, {
      full_name: data.fullName.trim(),
      avatar_url: data.coverPhotoUri?.startsWith('http') ? data.coverPhotoUri : undefined,
      profile_cover_images: data.coverPhotoUri ? [data.coverPhotoUri] : undefined,
      host_tier: data.propertyLevel,
      host_tier_justification: data.propertyLevelJustification.trim() || null,
      accepts_paid_collaborations: data.openToPaidCollab,
      has_own_website: data.hasWebsite,
      payment_model: data.hasWebsite ? null : data.paymentModel,
      reference_niches: data.referenceNiches,
      collab_months: data.collabMonths,
      promotion_platforms: data.promotionPlatforms,
      sponsor_personal_website: data.sponsorPersonalWebsite,
      kolbed_plans: data.kolbedPlans,
      social_links: socialLinks,
      host_onboarding_data: {
        deliverables: data.deliverables,
        kolbedPlans: data.kolbedPlans,
        propertyId: property.id,
        paymentTermsAccepted: data.paymentTermsAccepted,
      },
      host_status: 'pending',
      onboarding_completed: true,
    } as Parameters<typeof AuthService.updateProfile>[1]);

  }
}
