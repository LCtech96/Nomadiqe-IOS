/**
 * Host Onboarding — 6 steps aligned with the Nomadiqe website flow.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useInvite } from '../../contexts/InviteContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { AuthService } from '../../services/auth.service';
import { claimInvite } from '../../services/invitations.service';
import { awardPoints } from '../../services/points.service';
import { inviteRoleToPointAction } from '../../utils/inviteRoles';
import {
  HOST_COLLAB_MONTHS,
  HOST_DELIVERABLE_TIERS,
  HOST_KOLBED_PLANS,
  HOST_KOLBED_SOCIAL_PLATFORMS,
  HOST_ONBOARDING_AMENITIES,
  HOST_ONBOARDING_STEPS,
  HOST_PAYMENT_MODELS,
  HOST_PROMOTION_PLATFORMS,
  HOST_PROPERTY_LEVEL_INFO,
  HOST_REFERENCE_NICHES,
  HOST_WEBSITE_SOCIAL_PLATFORMS,
  MAX_HOST_PROPERTY_PHOTOS,
  MAX_PROPERTY_DESCRIPTION,
  MIN_TIER_JUSTIFICATION,
  type HostCollabMonth,
  type HostDeliverableTierKey,
  type HostKolbedPlanKey,
  type HostOnboardingAmenityKey,
  type HostPaymentModel,
  type HostPromotionPlatform,
  type HostReferenceNiche,
} from '../../constants/host';
import { HOST_COLLABORATION_LEVELS, type HostCollaborationLevel } from '../../constants/creator';
import { STRUCTURE_TYPES, type StructureTypeKey } from '../../constants/propertyOnboarding';
import {
  EMPTY_HOST_ONBOARDING_DATA,
  HostOnboardingLocalService,
} from '../../services/hostOnboardingLocal.service';
import { HostOnboardingService } from '../../services/hostOnboarding.service';
import type { OnboardingScreenProps } from '../../types/navigation';

function RadioCard({
  selected,
  onPress,
  title,
  description,
  disabled,
  textColor,
  secondaryColor,
  borderColor,
  cardBg,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  description?: string;
  disabled?: boolean;
  textColor: string;
  secondaryColor: string;
  borderColor: string;
  cardBg: string;
}) {
  return (
    <TouchableOpacity
      style={[
        radioCardStyles.card,
        {
          borderColor: selected ? theme.colors.primary.blue : borderColor,
          backgroundColor: selected ? theme.colors.primary.blue : cardBg,
          opacity: disabled ? 0.95 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={[radioCardStyles.outer, { borderColor: selected ? '#fff' : secondaryColor }]}>
        {selected ? <View style={radioCardStyles.inner} /> : null}
      </View>
      <View style={radioCardStyles.content}>
        <Text style={[radioCardStyles.title, { color: selected ? '#fff' : textColor }]}>{title}</Text>
        {description ? (
          <Text style={[radioCardStyles.desc, { color: selected ? 'rgba(255,255,255,0.9)' : secondaryColor }]}>
            {description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const radioCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: 8,
  },
  outer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  inner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  content: { flex: 1 },
  title: { ...theme.typography.subheadline, fontWeight: '700', textTransform: 'uppercase' },
  desc: { ...theme.typography.caption1, marginTop: 4, lineHeight: 16, textTransform: 'uppercase' },
});

export default function HostOnboardingScreen({ navigation }: OnboardingScreenProps<'HostOnboarding'>) {
  const { user, profile, refreshProfile } = useAuth();
  const { pendingInviteCode, clearPendingInviteCode } = useInvite();
  const { isDark } = useTheme();
  const { t } = useI18n();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [coverPhotoUri, setCoverPhotoUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [description, setDescription] = useState('');
  const [structureType, setStructureType] = useState<StructureTypeKey | null>(null);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [street, setStreet] = useState('');
  const [region, setRegion] = useState('');
  const [propertyPhotoUris, setPropertyPhotoUris] = useState<string[]>([]);
  const [guests, setGuests] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [amenities, setAmenities] = useState<HostOnboardingAmenityKey[]>([]);
  const [collabMonths, setCollabMonths] = useState<HostCollabMonth[]>([]);
  const [kolbedSocial, setKolbedSocial] = useState({ instagram: '', facebook: '', tiktok: '' });
  const [referenceNiches, setReferenceNiches] = useState<HostReferenceNiche[]>([]);
  const [propertyLevel, setPropertyLevel] = useState<HostCollaborationLevel | null>(null);
  const [propertyLevelJustification, setPropertyLevelJustification] = useState('');
  const [deliverables, setDeliverables] = useState(EMPTY_HOST_ONBOARDING_DATA.deliverables);
  const [promotionPlatforms, setPromotionPlatforms] = useState<HostPromotionPlatform[]>([]);
  const [sponsorPersonalWebsite, setSponsorPersonalWebsite] = useState(false);
  const [kolbedPlans, setKolbedPlans] = useState<HostKolbedPlanKey[]>(['kolbed_100']);
  const [openToPaidCollab, setOpenToPaidCollab] = useState(false);
  const [hasWebsite, setHasWebsite] = useState<boolean | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteSocial, setWebsiteSocial] = useState<Record<string, string>>({});
  const [paymentModel, setPaymentModel] = useState<HostPaymentModel | null>(null);
  const [paymentTermsAccepted, setPaymentTermsAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const backgroundColor = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondaryColor = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const applySaved = useCallback((saved: typeof EMPTY_HOST_ONBOARDING_DATA) => {
    setStep(saved.step);
    setCoverPhotoUri(saved.coverPhotoUri);
    setFullName(saved.fullName);
    setDescription(saved.description);
    setStructureType(saved.structureType);
    setCity(saved.city);
    setCountry(saved.country);
    setStreet(saved.street);
    setRegion(saved.region);
    setPropertyPhotoUris(saved.propertyPhotoUris);
    setGuests(saved.guests);
    setBedrooms(saved.bedrooms);
    setBeds(saved.beds);
    setBathrooms(saved.bathrooms);
    setAmenities(saved.amenities);
    setCollabMonths(saved.collabMonths);
    setKolbedSocial(saved.kolbedSocial);
    setReferenceNiches(saved.referenceNiches);
    setPropertyLevel(saved.propertyLevel);
    setPropertyLevelJustification(saved.propertyLevelJustification);
    setDeliverables(saved.deliverables);
    setPromotionPlatforms(saved.promotionPlatforms);
    setSponsorPersonalWebsite(saved.sponsorPersonalWebsite);
    setKolbedPlans(
      saved.kolbedPlans.includes('kolbed_100')
        ? saved.kolbedPlans
        : ['kolbed_100', ...saved.kolbedPlans]
    );
    setOpenToPaidCollab(saved.openToPaidCollab);
    setHasWebsite(saved.hasWebsite);
    setWebsiteUrl(saved.websiteUrl);
    setWebsiteSocial(saved.websiteSocial);
    setPaymentModel(saved.paymentModel);
    setPaymentTermsAccepted(saved.paymentTermsAccepted);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const saved = await HostOnboardingLocalService.load(user.id);
      if (saved) applySaved(saved);
      else if (profile?.full_name) setFullName(profile.full_name);
      setHydrated(true);
    })();
  }, [user?.id, profile?.full_name, applySaved]);

  const persistLocal = useCallback(async () => {
    if (!user?.id) return;
    await HostOnboardingLocalService.save(user.id, {
      step,
      coverPhotoUri,
      fullName,
      description,
      structureType,
      city,
      country,
      street,
      region,
      propertyPhotoUris,
      guests,
      bedrooms,
      beds,
      bathrooms,
      amenities,
      collabMonths,
      kolbedSocial,
      referenceNiches,
      propertyLevel,
      propertyLevelJustification,
      deliverables,
      promotionPlatforms,
      sponsorPersonalWebsite,
      kolbedPlans,
      openToPaidCollab,
      hasWebsite,
      websiteUrl,
      websiteSocial,
      paymentModel,
      paymentTermsAccepted,
    });
  }, [
    user?.id, step, coverPhotoUri, fullName, description, structureType,
    city, country, street, region, propertyPhotoUris, guests, bedrooms, beds, bathrooms,
    amenities, collabMonths, kolbedSocial, referenceNiches, propertyLevel,
    propertyLevelJustification, deliverables, promotionPlatforms, sponsorPersonalWebsite,
    kolbedPlans, openToPaidCollab, hasWebsite, websiteUrl, websiteSocial, paymentModel,
    paymentTermsAccepted,
  ]);

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.photoPermissionTitle'), t('common.photoPermissionMessage'));
      return false;
    }
    return true;
  };

  const pickCoverPhoto = async () => {
    if (!(await requestGalleryPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCoverPhotoUri(result.assets[0].uri);
    }
  };

  const pickPropertyPhotos = async () => {
    if (!(await requestGalleryPermission())) return;
    const slotsLeft = MAX_HOST_PROPERTY_PHOTOS - propertyPhotoUris.length;
    if (slotsLeft <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      setPropertyPhotoUris((prev) => [
        ...prev,
        ...result.assets.slice(0, slotsLeft).map((a) => a.uri),
      ]);
    }
  };

  const hasKolbedSocial =
    Boolean(kolbedSocial.instagram.trim()) ||
    Boolean(kolbedSocial.facebook.trim()) ||
    Boolean(kolbedSocial.tiktok.trim());

  const canProceedStep1 = Boolean(coverPhotoUri) && fullName.trim().length >= 2;
  const canProceedStep2 =
    description.trim().length > 0 &&
    structureType != null &&
    city.trim().length > 0 &&
    country.trim().length > 0 &&
    propertyPhotoUris.length >= 1 &&
    Number.isFinite(guests) &&
    guests >= 1;
  const canProceedStep3 =
    hasKolbedSocial &&
    propertyLevel != null &&
    propertyLevelJustification.trim().length > 0;
  const canProceedStep5Website = websiteUrl.trim().length >= 8;
  const canProceedStep5Payment = paymentModel != null && paymentTermsAccepted;

  const renderStepHeader = (titleKey: string, subtitleKey?: string) => (
    <View style={styles.stepHeader}>
      <Text style={[styles.stepOf, { color: secondaryColor }]}>
        {t('host.stepOf', { current: step, total: HOST_ONBOARDING_STEPS })}
      </Text>
      <Text style={[styles.title, { color: textColor }]}>{t(titleKey)}</Text>
      {subtitleKey ? (
        <Text style={[styles.subtitle, { color: secondaryColor }]}>{t(subtitleKey)}</Text>
      ) : null}
    </View>
  );

  const renderCheckbox = (checked: boolean, onToggle: () => void, label: string) => (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.7}>
      <View
        style={[
          styles.checkbox,
          {
            borderColor: checked ? theme.colors.primary.blue : secondaryColor,
            backgroundColor: checked ? theme.colors.primary.blue : 'transparent',
          },
        ]}
      >
        {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
      </View>
      <Text style={[styles.checkLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );

  const handleBack = () => {
    if (step === 5) {
      setStep(4);
      return;
    }
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!canProceedStep1) {
        Alert.alert(t('common.error'), t('host.step1Required'));
        return;
      }
      await persistLocal();
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!canProceedStep2) {
        Alert.alert(t('common.error'), t('host.step2Required'));
        return;
      }
      await persistLocal();
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!canProceedStep3) {
        if (!hasKolbedSocial) {
          Alert.alert(t('common.error'), t('host.socialRequired'));
        } else if (!propertyLevel) {
          Alert.alert(t('common.error'), t('host.propertyTypeRequired'));
        } else if (!propertyLevelJustification.trim()) {
          Alert.alert(t('common.error'), t('host.propertyLevelJustificationRequired'));
        } else {
          Alert.alert(t('common.error'), t('host.step3Required'));
        }
        return;
      }
      await persistLocal();
      setStep(4);
      return;
    }
    if (step === 4) return;
    if (step === 5) await handleSubmit();
  };

  const handleWebsiteChoice = async (value: boolean) => {
    setHasWebsite(value);
    await persistLocal();
    setStep(5);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (hasWebsite && !canProceedStep5Website) {
      Alert.alert(t('common.error'), t('host.websiteRequired'));
      return;
    }
    if (!hasWebsite && !canProceedStep5Payment) {
      Alert.alert(t('common.error'), t('host.paymentRequired'));
      return;
    }
    try {
      setLoading(true);
      let coverUri = coverPhotoUri;
      if (coverUri && user.id && !coverUri.startsWith('http')) {
        try {
          coverUri = await AuthService.uploadAvatar(user.id, coverUri);
        } catch {
          // keep local uri; property upload will retry
        }
      }
      await HostOnboardingService.submit(user.id, {
        ...EMPTY_HOST_ONBOARDING_DATA,
        step,
        coverPhotoUri: coverUri,
        fullName,
        description,
        structureType,
        city,
        country,
        street,
        region,
        propertyPhotoUris,
        guests,
        bedrooms,
        beds,
        bathrooms,
        amenities,
        collabMonths,
        kolbedSocial,
        referenceNiches,
        propertyLevel,
        propertyLevelJustification,
        deliverables,
        promotionPlatforms,
        sponsorPersonalWebsite,
        kolbedPlans,
        openToPaidCollab,
        hasWebsite,
        websiteUrl,
        websiteSocial,
        paymentModel,
        paymentTermsAccepted,
      });
      if (pendingInviteCode) {
        try {
          const result = await claimInvite(pendingInviteCode, user.id);
          if (result) await awardPoints(result.inviterId, inviteRoleToPointAction(result.role));
        } catch (_) {}
        await clearPendingInviteCode();
      }
      await HostOnboardingLocalService.clear(user.id);
      await refreshProfile();
      setSubmitted(true);
      setStep(6);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : '';
      Alert.alert(t('common.error'), msg || t('common.saveProfileError'));
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (key: HostOnboardingAmenityKey) => {
    setAmenities((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const toggleMonth = (month: HostCollabMonth) => {
    setCollabMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  const toggleNiche = (niche: HostReferenceNiche) => {
    setReferenceNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche]
    );
  };

  const toggleKolbedPlan = (plan: HostKolbedPlanKey) => {
    if (plan === 'kolbed_100') return;
    setKolbedPlans((prev) => {
      const withRequired: HostKolbedPlanKey[] = prev.includes('kolbed_100') ? prev : ['kolbed_100', ...prev];
      return withRequired.includes(plan)
        ? withRequired.filter((p) => p !== plan)
        : [...withRequired, plan];
    });
  };

  const setDeliverableField = (
    tier: HostDeliverableTierKey,
    field: 'videoReel' | 'staticPosts' | 'stories' | 'notes',
    value: string
  ) => {
    setDeliverables((prev) => ({
      ...prev,
      [tier]: { ...prev[tier], [field]: value },
    }));
  };

  const renderStep1 = () => (
    <View style={styles.stepBlock}>
      {renderStepHeader('host.step1Title', 'host.step1Subtitle')}
      <Text style={[styles.fieldLabel, { color: textColor }]}>{t('host.coverPhoto')} *</Text>
      {coverPhotoUri ? (
        <View style={[styles.coverBox, { borderColor, backgroundColor: inputBg }]}>
          <Image source={{ uri: coverPhotoUri }} style={styles.coverImage} resizeMode="cover" />
        </View>
      ) : (
        <View style={[styles.coverBox, { borderColor, backgroundColor: inputBg }]}>
          <Ionicons name="image-outline" size={40} color={secondaryColor} />
          <Text style={[styles.coverPlaceholder, { color: secondaryColor }]}>
            {t('host.coverPhotoEmpty')}
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.coverUploadRow, { borderColor, backgroundColor: cardBg }]}
        onPress={pickCoverPhoto}
        activeOpacity={0.7}
      >
        <Ionicons name="camera-outline" size={28} color={theme.colors.primary.blue} />
        <View style={styles.coverUploadText}>
          <Text style={[styles.choosePhotoBtn, { color: theme.colors.primary.blue }]}>
            {coverPhotoUri ? t('host.coverPhotoChange') : t('creator.choosePhoto')}
          </Text>
          <Text style={[styles.hint, { color: secondaryColor }]}>
            {coverPhotoUri ? t('host.coverPhotoSelected') : t('host.coverPhotoTapHint')}
          </Text>
        </View>
      </TouchableOpacity>
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.coverPhotoHint')}</Text>
      <Input
        label={`${t('host.fullName')} *`}
        placeholder="Jane Doe"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.fullNameHint')}</Text>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepBlock}>
      {renderStepHeader('host.step2Title', 'host.step2Subtitle')}
      <Text style={[styles.fieldLabel, { color: textColor }]}>{t('host.description')} *</Text>
      <TextInput
        style={[styles.textArea, { borderColor, backgroundColor: inputBg, color: textColor }]}
        value={description}
        onChangeText={setDescription}
        placeholder={t('host.descriptionPlaceholder')}
        placeholderTextColor={secondaryColor}
        multiline
        maxLength={MAX_PROPERTY_DESCRIPTION}
      />
      <Text style={[styles.counter, { color: secondaryColor }]}>
        {description.length}/{MAX_PROPERTY_DESCRIPTION}
      </Text>
      <Text style={[styles.fieldLabel, { color: textColor }]}>{t('host.propertyType')} *</Text>
      <View style={styles.typeGrid}>
        {STRUCTURE_TYPES.map((key) => {
          const selected = structureType === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.typeCard,
                {
                  backgroundColor: selected ? theme.colors.primary.blue : cardBg,
                  borderColor: selected ? theme.colors.primary.blue : borderColor,
                },
              ]}
              onPress={() => setStructureType(key)}
            >
              <Text style={[styles.typeLabel, { color: selected ? '#fff' : textColor }]}>
                {t(`propertyType.${key}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Input label={`${t('host.city')} *`} placeholder="Rome" value={city} onChangeText={setCity} />
        </View>
        <View style={styles.rowItem}>
          <Input label={`${t('host.country')} *`} placeholder="Italy" value={country} onChangeText={setCountry} />
        </View>
      </View>
      <Input
        label={t('host.street')}
        placeholder={t('host.streetPlaceholder')}
        value={street}
        onChangeText={setStreet}
      />
      <Input
        label={t('host.region')}
        placeholder={t('host.regionPlaceholder')}
        value={region}
        onChangeText={setRegion}
      />
      <View style={[styles.infoBox, { borderColor: theme.colors.primary.blue, backgroundColor: 'rgba(43,96,232,0.08)' }]}>
        <Text style={[styles.fieldLabel, { color: textColor }]}>
          {t('host.propertyPhotos', { max: MAX_HOST_PROPERTY_PHOTOS })} *
        </Text>
        <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.propertyPhotosHint', { max: MAX_HOST_PROPERTY_PHOTOS })}</Text>
        <Button variant="outline" onPress={pickPropertyPhotos} disabled={uploadingPhoto}>
          {t('creator.chooseFiles')}
        </Button>
        {propertyPhotoUris.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
            {propertyPhotoUris.map((uri, i) => (
              <View key={`${uri}-${i}`} style={styles.thumbWrap}>
                <Image source={{ uri }} style={styles.thumb} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => setPropertyPhotoUris((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : null}
        <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.propertyPhotosReorder')}</Text>
      </View>
      <View style={styles.capacityRow}>
        {[
          { label: `${t('host.maxGuests')} *`, value: guests, set: setGuests, min: 1 },
          { label: t('propertyOnboarding.bedrooms'), value: bedrooms, set: setBedrooms, min: 0 },
          { label: t('propertyOnboarding.beds'), value: beds, set: setBeds, min: 0 },
          { label: t('propertyOnboarding.bathrooms'), value: bathrooms, set: setBathrooms, min: 0 },
        ].map(({ label, value, set, min }) => (
          <View key={label} style={styles.capacityItem}>
            <Text style={[styles.capacityLabel, { color: textColor }]}>{label}</Text>
            <TextInput
              style={[styles.capacityInput, { borderColor, color: textColor, backgroundColor: inputBg }]}
              value={String(value)}
              onChangeText={(v) => {
                const parsed = parseInt(v.replace(/\D/g, ''), 10);
                if (v === '' || Number.isNaN(parsed)) {
                  set(min);
                  return;
                }
                set(Math.max(min, parsed));
              }}
              keyboardType="number-pad"
            />
          </View>
        ))}
      </View>
      <Text style={[styles.fieldLabel, { color: textColor }]}>{t('host.servicesAmenities')}</Text>
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.servicesAmenitiesHint')}</Text>
      <View style={styles.chipGrid}>
        {HOST_ONBOARDING_AMENITIES.map((key) => {
          const selected = amenities.includes(key);
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.colors.primary.blue : cardBg,
                  borderColor: selected ? theme.colors.primary.blue : borderColor,
                },
              ]}
              onPress={() => toggleAmenity(key)}
            >
              <Text style={{ color: selected ? '#fff' : textColor, ...theme.typography.caption2 }}>
                {t(`amenity.${key}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepBlock}>
      {renderStepHeader('host.step3Title', 'host.step3Subtitle')}

      <View style={[styles.infoBox, { borderColor: theme.colors.primary.blue, backgroundColor: 'rgba(43,96,232,0.08)' }]}>
        <Text style={[styles.infoTitle, { color: theme.colors.primary.blue }]}>{t('host.kolbedInfoTitle')}</Text>
        <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.kolbedInfoBody')}</Text>
      </View>

      <Text style={[styles.fieldLabel, { color: textColor }]}>{t('host.collabMonthsTitle')}</Text>
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.collabMonthsHint')}</Text>
      <View style={styles.monthRow}>
        {HOST_COLLAB_MONTHS.map((month) => {
          const selected = collabMonths.includes(month);
          return (
            <TouchableOpacity
              key={month}
              style={[
                styles.monthChip,
                {
                  backgroundColor: selected ? theme.colors.primary.blue : cardBg,
                  borderColor: selected ? theme.colors.primary.blue : borderColor,
                },
              ]}
              onPress={() => toggleMonth(month)}
            >
              <Text style={{ color: selected ? '#fff' : textColor, fontWeight: '600' }}>
                {t(`host.month.${month}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.fieldLabel, { color: textColor }]}>{t('host.socialProfilesTitle')} *</Text>
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.socialProfilesHint')}</Text>
      {HOST_KOLBED_SOCIAL_PLATFORMS.map(({ key, labelKey, placeholderKey }) => (
        <Input
          key={key}
          label={t(labelKey)}
          placeholder={t(placeholderKey)}
          value={kolbedSocial[key]}
          onChangeText={(v) => setKolbedSocial((prev) => ({ ...prev, [key]: v }))}
          autoCapitalize="none"
        />
      ))}

      <Text style={[styles.fieldLabel, { color: textColor }]}>{t('host.referenceNichesTitle')}</Text>
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.referenceNichesHint')}</Text>
      <View style={styles.chipGrid}>
        {HOST_REFERENCE_NICHES.map((niche) => {
          const selected = referenceNiches.includes(niche);
          return (
            <TouchableOpacity
              key={niche}
              style={[
                styles.nicheChip,
                {
                  backgroundColor: selected ? theme.colors.primary.blue : cardBg,
                  borderColor: selected ? theme.colors.primary.blue : borderColor,
                },
              ]}
              onPress={() => toggleNiche(niche)}
            >
              <Text style={{ color: selected ? '#fff' : textColor }}>{t(`host.niche.${niche}`)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.fieldLabel, { color: textColor }]}>{t('host.propertyLevelTitle')} *</Text>
      {HOST_COLLABORATION_LEVELS.map(({ value, labelKey }) => (
        <RadioCard
          key={value}
          selected={propertyLevel === value}
          onPress={() => setPropertyLevel(value)}
          title={t(labelKey).toUpperCase()}
          textColor={textColor}
          secondaryColor={secondaryColor}
          borderColor={borderColor}
          cardBg={cardBg}
        />
      ))}
      {propertyLevel ? (
        <>
          <Text style={[styles.fieldLabel, { color: textColor }]}>
            {t('host.propertyLevelJustification')} *
          </Text>
          <TextInput
            style={[styles.textArea, { borderColor, backgroundColor: inputBg, color: textColor }]}
            value={propertyLevelJustification}
            onChangeText={setPropertyLevelJustification}
            placeholder={t('host.propertyLevelJustificationPlaceholder')}
            placeholderTextColor={secondaryColor}
            multiline
          />
          <Text style={[styles.hint, { color: secondaryColor }]}>
            {t('host.propertyLevelJustificationHint', { min: MIN_TIER_JUSTIFICATION })}
          </Text>
          <View style={[styles.infoBox, { borderColor: theme.colors.primary.blue, backgroundColor: 'rgba(43,96,232,0.08)' }]}>
            <Text style={[styles.infoTitle, { color: textColor }]}>
              {HOST_PROPERTY_LEVEL_INFO[propertyLevel].icon}{' '}
              {t(HOST_PROPERTY_LEVEL_INFO[propertyLevel].titleKey)}
            </Text>
            <Text style={[styles.hint, { color: secondaryColor }]}>
              {t(HOST_PROPERTY_LEVEL_INFO[propertyLevel].bodyKey)}
            </Text>
          </View>
        </>
      ) : null}

      <Text style={[styles.title, { color: textColor, fontSize: 20, marginTop: theme.spacing.md }]}>
        {t('host.deliverablesTitle')}
      </Text>
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.deliverablesHint')}</Text>
      {HOST_DELIVERABLE_TIERS.map(({ key, labelKey }) => (
        <View key={key} style={[styles.deliverableCard, { borderColor }]}>
          <Text style={[styles.fieldLabel, { color: textColor }]}>{t(labelKey)}</Text>
          <View style={styles.deliverableRow}>
            {(['videoReel', 'staticPosts', 'stories'] as const).map((field) => (
              <View key={field} style={styles.deliverableField}>
                <Text style={[styles.capacityLabel, { color: secondaryColor }]}>
                  {t(field === 'videoReel' ? 'host.videoReel' : field === 'staticPosts' ? 'host.staticPosts' : 'host.stories')}
                </Text>
                <TextInput
                  style={[styles.capacityInput, { borderColor, color: textColor, backgroundColor: inputBg }]}
                  value={deliverables[key][field]}
                  onChangeText={(v) => setDeliverableField(key, field, v.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                />
              </View>
            ))}
          </View>
          <Text style={[styles.capacityLabel, { color: secondaryColor }]}>{t('host.notesOptional')}</Text>
          <TextInput
            style={[styles.notesInput, { borderColor, color: textColor, backgroundColor: inputBg }]}
            value={deliverables[key].notes}
            onChangeText={(v) => setDeliverableField(key, 'notes', v)}
            placeholder={t('host.notesPlaceholder')}
            placeholderTextColor={secondaryColor}
          />
        </View>
      ))}

      <Text style={[styles.fieldLabel, { color: textColor }]}>{t('host.promotionPlatformsTitle')}</Text>
      <View style={styles.chipGrid}>
        {HOST_PROMOTION_PLATFORMS.map(({ key, labelKey }) => {
          const selected = promotionPlatforms.includes(key);
          return (
            <View key={key} style={[styles.promoChip, { borderColor, backgroundColor: cardBg }]}>
              {renderCheckbox(
                selected,
                () =>
                  setPromotionPlatforms((prev) =>
                    prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
                  ),
                t(labelKey)
              )}
            </View>
          );
        })}
      </View>
      {renderCheckbox(sponsorPersonalWebsite, () => setSponsorPersonalWebsite((v) => !v), t('host.sponsorWebsite'))}

      <Text style={[styles.fieldLabel, { color: textColor }]}>{t('host.kolbedPlanTitle')} *</Text>
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.kolbedPlanHint')}</Text>
      {HOST_KOLBED_PLANS.map(({ key, labelKey, descKey, required }) => (
        <RadioCard
          key={key}
          selected={kolbedPlans.includes(key)}
          onPress={() => {
            if (!required) toggleKolbedPlan(key);
          }}
          title={t(labelKey)}
          description={t(descKey)}
          disabled={required}
          textColor={textColor}
          secondaryColor={secondaryColor}
          borderColor={borderColor}
          cardBg={cardBg}
        />
      ))}

      <View style={[styles.paidCollabBox, { borderColor }]}>
        {renderCheckbox(openToPaidCollab, () => setOpenToPaidCollab((v) => !v), t('host.paidCollabTitle'))}
        <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.paidCollabBody')}</Text>
        <Text style={[styles.hint, { color: secondaryColor, marginTop: 8 }]}>{t('host.paidCollabTerms')}</Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepBlock}>
      {renderStepHeader('host.step4Title', 'host.step4Subtitle')}
      <Text style={[styles.intro, { color: secondaryColor }]}>{t('host.step4Question')}</Text>
      <RadioCard
        selected={false}
        onPress={() => handleWebsiteChoice(true)}
        title={t('host.step4Yes')}
        textColor={textColor}
        secondaryColor={secondaryColor}
        borderColor={borderColor}
        cardBg={cardBg}
      />
      <RadioCard
        selected={false}
        onPress={() => handleWebsiteChoice(false)}
        title={t('host.step4No')}
        textColor={textColor}
        secondaryColor={secondaryColor}
        borderColor={borderColor}
        cardBg={cardBg}
      />
    </View>
  );

  const renderStep5Website = () => (
    <View style={styles.stepBlock}>
      {renderStepHeader('host.step5WebsiteTitle', 'host.step5WebsiteSubtitle')}
      <Input
        label={`${t('host.websiteLink')} *`}
        placeholder={t('host.websiteLinkPlaceholder')}
        value={websiteUrl}
        onChangeText={setWebsiteUrl}
        autoCapitalize="none"
        keyboardType="url"
      />
      <View style={styles.socialGrid}>
        {HOST_WEBSITE_SOCIAL_PLATFORMS.map(({ key, labelKey, placeholderKey }) => (
          <View key={key} style={styles.socialGridItem}>
            <Input
              label={t(labelKey)}
              placeholder={t(placeholderKey)}
              value={websiteSocial[key] ?? ''}
              onChangeText={(v) => setWebsiteSocial((prev) => ({ ...prev, [key]: v }))}
              autoCapitalize="none"
            />
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep5Payment = () => (
    <View style={styles.stepBlock}>
      {renderStepHeader('host.step5PaymentTitle', 'host.step5PaymentSubtitle')}
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.step5PaymentHint')}</Text>
      {HOST_PAYMENT_MODELS.map(({ key, labelKey, descKey }) => (
        <RadioCard
          key={key}
          selected={paymentModel === key}
          onPress={() => setPaymentModel(key)}
          title={t(labelKey)}
          description={t(descKey)}
          textColor={textColor}
          secondaryColor={secondaryColor}
          borderColor={borderColor}
          cardBg={cardBg}
        />
      ))}
      <TouchableOpacity
        style={[styles.termsLinkBox, { borderColor }]}
        onPress={() => setTermsVisible(true)}
      >
        <Text style={{ color: theme.colors.primary.blue, fontWeight: '600' }}>{t('host.termsLink')}</Text>
      </TouchableOpacity>
      {renderCheckbox(paymentTermsAccepted, () => setPaymentTermsAccepted((v) => !v), t('host.termsCheckbox'))}
    </View>
  );

  const renderStep6 = () => (
    <View style={[styles.stepBlock, styles.centeredBlock]}>
      {renderStepHeader('host.step6Title', 'host.step6Subtitle')}
      <Text style={[styles.intro, { color: textColor }]}>{t('host.step6Message')}</Text>
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.step6MessageSecondary')}</Text>
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('host.step6AdminNote')}</Text>
      {submitted ? (
        <Button size="lg" style={styles.button} onPress={() => refreshProfile()}>
          {t('host.backToHome')}
        </Button>
      ) : null}
    </View>
  );

  if (!hydrated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const showFooter = step !== 4 && step !== 6;
  const footerDisabled =
    loading ||
    (step === 1 && !canProceedStep1) ||
    (step === 2 && !canProceedStep2) ||
    (step === 3 && !canProceedStep3) ||
    (step === 5 && hasWebsite === true && !canProceedStep5Website) ||
    (step === 5 && hasWebsite === false && !canProceedStep5Payment);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <View style={styles.header}>
        {step < 6 ? (
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && hasWebsite === true && renderStep5Website()}
          {step === 5 && hasWebsite === false && renderStep5Payment()}
          {step === 6 && renderStep6()}
        </ScrollView>

        {showFooter ? (
          <View style={styles.footer}>
            <Button variant="outline" onPress={handleBack} style={styles.backButton}>
              {t('common.back')}
            </Button>
            <Button
              onPress={step === 5 ? handleSubmit : handleNext}
              loading={loading}
              disabled={footerDisabled}
              size="lg"
              style={styles.buttonFlex}
            >
              {t('onboarding.continue')}
            </Button>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <Modal visible={termsVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setTermsVisible(false)}>
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.title, { color: textColor, fontSize: 18 }]}>{t('host.termsLink')}</Text>
            <Pressable onPress={() => setTermsVisible(false)}>
              <Ionicons name="close" size={24} color={textColor} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.hint, { color: secondaryColor, lineHeight: 20 }]}>{t('host.termsBody')}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  scrollContent: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing['3xl'],
  },
  stepBlock: { gap: theme.spacing.md },
  stepHeader: { marginBottom: theme.spacing.sm },
  stepOf: { ...theme.typography.caption1, textTransform: 'uppercase', marginBottom: theme.spacing.xs },
  title: { ...theme.typography.largeTitle, fontWeight: '700', textTransform: 'uppercase' },
  subtitle: { ...theme.typography.body, textTransform: 'uppercase', marginTop: theme.spacing.xs },
  fieldLabel: { ...theme.typography.subheadline, fontWeight: '700', textTransform: 'uppercase' },
  hint: { ...theme.typography.caption1, lineHeight: 16, textTransform: 'uppercase' },
  intro: { ...theme.typography.footnote, textTransform: 'uppercase', lineHeight: 20 },
  coverBox: {
    height: 180,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 8,
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { ...theme.typography.caption1, textTransform: 'uppercase' },
  coverUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  coverUploadText: { flex: 1 },
  choosePhotoBtn: { ...theme.typography.subheadline, fontWeight: '600' },
  textArea: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  counter: { alignSelf: 'flex-end', ...theme.typography.caption2 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeCard: {
    width: '31%',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeLabel: { ...theme.typography.caption2, textAlign: 'center', textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },
  infoBox: { borderWidth: 1, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, gap: 8 },
  infoTitle: { ...theme.typography.subheadline, fontWeight: '700', textTransform: 'uppercase' },
  thumbRow: { marginTop: 8 },
  thumbWrap: { width: 72, height: 72, marginRight: 8, borderRadius: 8, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 2,
  },
  capacityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  capacityItem: { width: '23%', minWidth: 72 },
  capacityLabel: { ...theme.typography.caption2, marginBottom: 4, textTransform: 'uppercase' },
  capacityInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    textAlign: 'center',
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { width: '48%', borderWidth: 1, borderRadius: 8, padding: 4 },
  nicheChip: { width: '23%', minWidth: 72, borderWidth: 1, borderRadius: 20, paddingVertical: 10, alignItems: 'center' },
  promoChip: { width: '48%', borderWidth: 1, borderRadius: 8, padding: 4 },
  monthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthChip: { borderWidth: 1, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14 },
  deliverableCard: { borderWidth: 1, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, gap: 8 },
  deliverableRow: { flexDirection: 'row', gap: 8 },
  deliverableField: { flex: 1 },
  notesInput: { borderWidth: 1, borderRadius: 8, padding: 10 },
  paidCollabBox: { borderWidth: 1, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, gap: 8 },
  socialGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  socialGridItem: { width: '48%' },
  termsLinkBox: { borderWidth: 1, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, alignItems: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkLabel: { ...theme.typography.caption1, flex: 1, lineHeight: 18, textTransform: 'uppercase' },
  centeredBlock: { alignItems: 'center' },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.lg,
  },
  backButton: { flex: 1 },
  buttonFlex: { flex: 2 },
  button: { marginTop: theme.spacing.lg, alignSelf: 'stretch' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.screenPadding,
  },
});
