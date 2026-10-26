/**
 * Creator Onboarding — 6 steps aligned with the Nomadiqe website flow.
 * Profile photo and aesthetic gallery upload on submit; analytics stay local until wired.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { parse, isValid, format } from 'date-fns';

import { Button, Input, Avatar } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { AuthService } from '../../services/auth.service';
import { ProfilesService } from '../../services/profiles.service';
import {
  CreatorOnboardingLocalService,
  EMPTY_LOCAL_DATA,
  type CreatorOnboardingCurrency,
  type CreatorOnboardingLocalData,
} from '../../services/creatorOnboardingLocal.service';
import type { OnboardingScreenProps } from '../../types/navigation';
import {
  CREATOR_CATEGORIES,
  CREATOR_ONBOARDING_STEPS,
  CREATOR_RATE_FIELDS,
  CREATOR_SOCIAL_PLATFORMS,
  HOST_COLLABORATION_LEVELS,
  HOST_LEVEL_TIER_MESSAGES,
  MAX_ANALYTICS_SCREENSHOTS,
  MAX_CREATOR_BIO_LENGTH,
  MAX_GALLERY_IMAGES,
  MIN_GALLERY_IMAGES,
  type CreatorCategory,
  type HostCollaborationLevel,
  type SocialLinksMap,
} from '../../constants/creator';

const CREATOR_USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,30}$/;

function parseDateInput(value: string): Date | null {
  const trimmed = value.trim().split('T')[0];
  if (!trimmed) return null;
  const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'M/d/yyyy', 'dd/MM/yyyy', 'd/M/yyyy'];
  for (const f of formats) {
    const d = parse(trimmed, f, new Date());
    if (isValid(d)) return d;
  }
  const iso = new Date(trimmed);
  if (isValid(iso) && !Number.isNaN(iso.getTime())) return iso;
  return null;
}

function isStep1FieldsComplete(params: {
  profilePhotoUri: string | null;
  fullName: string;
  username: string;
  dateOfBirth: string;
  nationality: string;
  city: string;
  airport: string;
  galleryCount: number;
  minGallery: number;
}): boolean {
  return (
    params.profilePhotoUri != null &&
    params.fullName.trim().length >= 2 &&
    CREATOR_USERNAME_REGEX.test(params.username.trim()) &&
    parseDateInput(params.dateOfBirth) != null &&
    /^[A-Z]{2}$/i.test(params.nationality.trim()) &&
    params.city.trim().length >= 2 &&
    /^[A-Z]{3}$/i.test(params.airport.trim()) &&
    params.galleryCount >= params.minGallery
  );
}

export default function CreatorOnboardingScreen({ navigation }: OnboardingScreenProps<'CreatorOnboarding'>) {
  const { user, profile, refreshProfile } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'available' | 'taken' | 'invalid'>('idle');

  // Step 1
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [city, setCity] = useState('');
  const [airport, setAirport] = useState('');
  const [galleryUris, setGalleryUris] = useState<string[]>([]);

  // Step 2
  const [socialLinks, setSocialLinks] = useState<SocialLinksMap>({});
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(['']);
  const [analyticsUris, setAnalyticsUris] = useState<string[]>([]);

  // Step 3
  const [category, setCategory] = useState<CreatorCategory | null>(null);
  const [hostLevels, setHostLevels] = useState<HostCollaborationLevel[]>([]);

  // Step 4
  const [currency, setCurrency] = useState<CreatorOnboardingCurrency>('EUR');
  const [rates, setRates] = useState({ ...EMPTY_LOCAL_DATA.rates });
  const [rateNotes, setRateNotes] = useState({ ...EMPTY_LOCAL_DATA.rateNotes });
  const [organicUseAccepted, setOrganicUseAccepted] = useState(false);

  // Step 5
  const [showcaseInterest, setShowcaseInterest] = useState<boolean | null>(null);
  const [activateShowcase, setActivateShowcase] = useState(false);

  // Step 6
  const [premiumCreator, setPremiumCreator] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const backgroundColor = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondaryColor = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const currencySymbol = currency === 'EUR' ? '€' : '$';

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const media = await CreatorOnboardingLocalService.loadMedia(user.id);
      if (media?.profilePhotoUri) setProfilePhotoUri(media.profilePhotoUri);
      if (media?.galleryUris?.length) setGalleryUris(media.galleryUris);
      if (media?.analyticsUris?.length) setAnalyticsUris(media.analyticsUris);
      const saved = await CreatorOnboardingLocalService.loadData(user.id);
      if (saved) {
        setNationality(saved.nationality);
        setAirport(saved.nearestAirport);
        if (saved.portfolioLinks.length) setPortfolioLinks(saved.portfolioLinks);
        setCurrency(saved.currency);
        setRates(saved.rates);
        setRateNotes(saved.rateNotes);
        setOrganicUseAccepted(saved.organicUseAccepted);
        if (saved.showcaseInterest != null) setShowcaseInterest(saved.showcaseInterest);
        setActivateShowcase(saved.activateShowcase);
        setPremiumCreator(saved.premiumCreator);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (profile?.full_name && !fullName) setFullName(profile.full_name);
    if (profile?.username && !username) setUsername(profile.username);
    if (profile?.bio && !bio) setBio(profile.bio);
    if (profile?.location && !city) setCity(profile.location);
    if (profile?.date_of_birth && !dateOfBirth) setDateOfBirth(profile.date_of_birth);
    if (profile?.avatar_url && !profilePhotoUri) setProfilePhotoUri(profile.avatar_url);
  }, [profile]);

  const checkUsername = useCallback(async (value: string): Promise<boolean> => {
    const trimmed = value.trim();
    if (!CREATOR_USERNAME_REGEX.test(trimmed)) {
      setUsernameStatus(trimmed.length > 0 ? 'invalid' : 'idle');
      return false;
    }
    if (!user?.id) return false;
    if (profile?.username && trimmed.toLowerCase() === profile.username.toLowerCase()) {
      setUsernameStatus('available');
      return true;
    }
    setCheckingUsername(true);
    try {
      const available = await ProfilesService.isUsernameAvailable(trimmed, user.id);
      setUsernameStatus(available ? 'available' : 'taken');
      return available;
    } catch {
      // Don't block the user if the availability check fails (e.g. offline).
      setUsernameStatus('available');
      return true;
    } finally {
      setCheckingUsername(false);
    }
  }, [user?.id, profile?.username]);

  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed || !user?.id) {
      setUsernameStatus('idle');
      return;
    }
    if (!CREATOR_USERNAME_REGEX.test(trimmed)) {
      setUsernameStatus('invalid');
      return;
    }
    if (profile?.username && trimmed.toLowerCase() === profile.username.toLowerCase()) {
      setUsernameStatus('available');
      return;
    }
    setUsernameStatus('idle');
    const timer = setTimeout(() => {
      void checkUsername(trimmed);
    }, 450);
    return () => clearTimeout(timer);
  }, [username, user?.id, profile?.username, checkUsername]);

  const persistLocal = useCallback(async () => {
    if (!user?.id) return;
    const data: CreatorOnboardingLocalData = {
      profilePhotoUri,
      galleryUris,
      analyticsUris,
      nationality: nationality.trim().toUpperCase(),
      nearestAirport: airport.trim().toUpperCase(),
      portfolioLinks,
      currency,
      rates,
      rateNotes,
      organicUseAccepted,
      showcaseInterest,
      activateShowcase,
      premiumCreator,
      termsAccepted,
    };
    await CreatorOnboardingLocalService.saveAll(user.id, data);
  }, [
    user?.id, profilePhotoUri, galleryUris, analyticsUris, nationality, airport,
    portfolioLinks, currency, rates, rateNotes, organicUseAccepted, showcaseInterest,
    activateShowcase, premiumCreator, termsAccepted,
  ]);

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.photoPermissionTitle'), t('common.photoPermissionMessage'));
      return false;
    }
    return true;
  };

  const pickProfilePhoto = async () => {
    if (!user?.id) return;
    if (!(await requestGalleryPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingPhoto(true);
    try {
      const url = await AuthService.uploadAvatar(
        user.id,
        result.assets[0].uri,
        result.assets[0].base64 ?? null
      );
      setProfilePhotoUri(url);
      await refreshProfile();
    } catch {
      Alert.alert(t('common.error'), t('common.photoError'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const pickGalleryImages = async () => {
    if (!(await requestGalleryPermission())) return;
    const slotsLeft = MAX_GALLERY_IMAGES - galleryUris.length;
    if (slotsLeft <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      const uris = result.assets.slice(0, slotsLeft).map((a) => a.uri);
      setGalleryUris((prev) => [...prev, ...uris]);
    }
  };

  const pickAnalyticsImages = async () => {
    if (!(await requestGalleryPermission())) return;
    const slotsLeft = MAX_ANALYTICS_SCREENSHOTS - analyticsUris.length;
    if (slotsLeft <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      const uris = result.assets.slice(0, slotsLeft).map((a) => a.uri);
      setAnalyticsUris((prev) => [...prev, ...uris]);
    }
  };

  const setSocialLink = (key: keyof SocialLinksMap, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [key]: value.trim() || null }));
  };

  const toggleHostLevel = (value: HostCollaborationLevel) => {
    setHostLevels((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const step1FieldsComplete = isStep1FieldsComplete({
    profilePhotoUri,
    fullName,
    username,
    dateOfBirth,
    nationality,
    city,
    airport,
    galleryCount: galleryUris.length,
    minGallery: MIN_GALLERY_IMAGES,
  });

  const canProceedStep1 =
    step1FieldsComplete &&
    usernameStatus !== 'taken' &&
    usernameStatus !== 'invalid';

  const canProceedStep2 = Boolean(socialLinks.instagram?.trim());
  const canProceedStep3 = category != null && hostLevels.length >= 1;
  const canProceedStep4 = organicUseAccepted;
  const canProceedStep6 = termsAccepted;

  const handleNext = async () => {
    if (step === 1) {
      if (!step1FieldsComplete) {
        Alert.alert(t('common.error'), t('creator.step1Required', { min: MIN_GALLERY_IMAGES }));
        return;
      }
      if (usernameStatus !== 'available') {
        const available = await checkUsername(username);
        if (!available) {
          Alert.alert(t('common.error'), t('creator.usernameTaken'));
          return;
        }
      }
    }
    if (step === 2 && !canProceedStep2) {
      Alert.alert(t('common.error'), t('creator.instagramRequired'));
      return;
    }
    if (step === 3 && !canProceedStep3) {
      Alert.alert(
        t('common.error'),
        !category ? t('creator.tierRequired') : t('creator.hostLevelRequired')
      );
      return;
    }
    if (step === 4 && !canProceedStep4) {
      Alert.alert(t('common.error'), t('creator.organicUseRequired'));
      return;
    }
    await persistLocal();
    if (step < CREATOR_ONBOARDING_STEPS) setStep(step + 1);
  };

  const handleStep5Continue = async (withShowcase: boolean) => {
    setActivateShowcase(withShowcase);
    if (withShowcase) {
      Alert.alert(t('common.success'), t('creator.showcaseComingSoon'));
    }
    await persistLocal();
    setStep(6);
  };

  const handleSubmit = async () => {
    if (!user || !category || hostLevels.length === 0) return;
    if (!termsAccepted) {
      Alert.alert(t('common.error'), t('creator.termsRequired'));
      return;
    }
    try {
      setLoading(true);
      await persistLocal();

      if (profilePhotoUri) {
        const isLocalUri =
          profilePhotoUri.startsWith('file://') ||
          profilePhotoUri.startsWith('content://') ||
          profilePhotoUri.startsWith('ph://');
        if (isLocalUri) {
          await AuthService.uploadAvatar(user.id, profilePhotoUri);
        } else if (!profile?.avatar_url) {
          await AuthService.updateProfile(user.id, { avatar_url: profilePhotoUri });
        }
      }

      const dob = parseDateInput(dateOfBirth);
      const dobIso = dob ? format(dob, 'yyyy-MM-dd') : null;

      await AuthService.updateProfile(user.id, {
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim() || null,
        date_of_birth: dobIso,
        location: city.trim(),
      });

      const links: Record<string, string | null> = {};
      CREATOR_SOCIAL_PLATFORMS.forEach(({ key }) => {
        links[key] = socialLinks[key] ?? null;
      });
      const portfolio = portfolioLinks.map((l) => l.trim()).filter(Boolean);
      if (portfolio.length) links.portfolio = portfolio.join(',');

      const profileCoverImages =
        galleryUris.length > 0
          ? await ProfilesService.uploadCreatorCoverImages(user.id, galleryUris)
          : [];

      await ProfilesService.submitCreatorApplication(user.id, {
        creator_category: category,
        creator_structure_preferences: hostLevels,
        social_links: links,
        date_of_birth: dobIso,
        location: city.trim(),
        profile_cover_images: profileCoverImages,
      });

      await refreshProfile();
      Alert.alert(t('common.success'), t('creator.submitSuccess'));
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('username') || msg.includes('unique')) {
        Alert.alert(t('common.error'), t('creator.usernameTaken'));
      } else {
        Alert.alert(t('common.error'), msg || t('common.saveProfileError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepHeader = (titleKey: string, subtitleKey?: string) => (
    <View style={styles.stepHeader}>
      <Text style={[styles.stepOf, { color: secondaryColor }]}>
        {t('creator.stepOf', { current: step, total: CREATOR_ONBOARDING_STEPS })}
      </Text>
      <Text style={[styles.title, { color: textColor }]}>{t(titleKey)}</Text>
      {subtitleKey ? (
        <Text style={[styles.subtitle, { color: secondaryColor }]}>{t(subtitleKey)}</Text>
      ) : null}
    </View>
  );

  const renderImageGrid = (
    uris: string[],
    onRemove: (index: number) => void,
    max: number
  ) => (
    <View style={styles.imageGrid}>
      {uris.map((uri, i) => (
        <View key={`${uri}-${i}`} style={styles.gridItem}>
          <Image source={{ uri }} style={styles.gridImage} />
          <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(i)}>
            <Ionicons name="close" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      ))}
      {uris.length < max && (
        <Text style={[styles.fileCount, { color: secondaryColor }]}>
          {uris.length}/{max}
        </Text>
      )}
    </View>
  );

  const renderCheckbox = (
    checked: boolean,
    onToggle: () => void,
    label: string
  ) => (
    <TouchableOpacity
      style={[styles.checkRow, { borderColor, backgroundColor: cardBg }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: checked ? theme.colors.primary.blue : secondaryColor,
            backgroundColor: checked ? theme.colors.primary.blue : 'transparent',
          },
        ]}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text style={[styles.checkLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderStep1 = () => (
    <View style={styles.stepBlock}>
      {renderStepHeader('creator.step1Title', 'creator.step1Subtitle')}

      <Text style={[styles.fieldLabel, { color: textColor }]}>{t('creator.profilePhoto')} *</Text>
      <TouchableOpacity
        style={[styles.photoRow, { borderColor }]}
        onPress={pickProfilePhoto}
        disabled={uploadingPhoto}
      >
        <View style={styles.photoAvatarWrap}>
          <Avatar uri={profilePhotoUri} size={56} />
          {uploadingPhoto && (
            <View style={styles.photoUploadOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.photoRowText}>
          <Text style={[styles.chooseFiles, { color: theme.colors.primary.blue }]}>
            {t('creator.choosePhoto')}
          </Text>
          <Text style={[styles.hint, { color: secondaryColor }]}>
            {uploadingPhoto ? t('common.loading') : profilePhotoUri ? '1 file' : t('creator.choosePhoto')}
          </Text>
        </View>
      </TouchableOpacity>
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('creator.profilePhotoHint')}</Text>

      <Input
        label={`${t('creator.fullNamePrivate')} *`}
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />

      <Input
        label={`${t('creator.usernamePublic')} *`}
        value={username}
        onChangeText={setUsername}
        onBlur={() => void checkUsername(username)}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {checkingUsername && <ActivityIndicator size="small" color={theme.colors.primary.blue} />}
      {usernameStatus === 'available' && (
        <Text style={[styles.statusOk, { color: theme.colors.primary.blue }]}>
          {t('creator.usernameAvailable')}
        </Text>
      )}
      {usernameStatus === 'taken' && (
        <Text style={[styles.statusErr, { color: theme.colors.error }]}>{t('creator.usernameTaken')}</Text>
      )}
      {usernameStatus === 'invalid' && (
        <Text style={[styles.statusErr, { color: theme.colors.error }]}>{t('creator.usernameInvalid')}</Text>
      )}

      <Input
        label={t('creator.bioMax', { max: MAX_CREATOR_BIO_LENGTH })}
        value={bio}
        onChangeText={setBio}
        placeholder={t('creator.bioPlaceholder')}
        multiline
        numberOfLines={4}
        maxLength={MAX_CREATOR_BIO_LENGTH}
        helperText={`${bio.length}/${MAX_CREATOR_BIO_LENGTH}`}
      />

      <Input
        label={`${t('creator.dateOfBirth')} *`}
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        helperText={t('creator.dateOfBirthHint')}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Input
            label={`${t('creator.nationality')} *`}
            value={nationality}
            onChangeText={(v) => setNationality(v.toUpperCase().slice(0, 2))}
            autoCapitalize="characters"
            maxLength={2}
            helperText={t('creator.nationalityHint')}
          />
        </View>
        <View style={styles.half}>
          <Input
            label={`${t('creator.nearestAirport')} *`}
            value={airport}
            onChangeText={(v) => setAirport(v.toUpperCase().slice(0, 3))}
            autoCapitalize="characters"
            maxLength={3}
            helperText={t('creator.nearestAirportHint')}
          />
        </View>
      </View>

      <Input
        label={`${t('creator.cityOfResidence')} *`}
        value={city}
        onChangeText={setCity}
        helperText={t('creator.cityOfResidenceHint')}
      />

      <View style={styles.galleryHeader}>
        <Text style={[styles.fieldLabel, { color: textColor }]}>
          {t('creator.galleryTitle', { min: MIN_GALLERY_IMAGES, max: MAX_GALLERY_IMAGES })} *
        </Text>
        <Text style={[styles.counter, { color: theme.colors.primary.blue }]}>
          {galleryUris.length}/{MAX_GALLERY_IMAGES}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.filePicker, { borderColor }]}
        onPress={pickGalleryImages}
      >
        <Text style={[styles.chooseFiles, { color: theme.colors.primary.blue }]}>
          {t('creator.chooseFiles')}
        </Text>
        <Text style={[styles.hint, { color: secondaryColor }]}>
          {galleryUris.length > 0 ? `${galleryUris.length} files` : ''}
        </Text>
      </TouchableOpacity>
      {galleryUris.length > 0 &&
        renderImageGrid(galleryUris, (i) => setGalleryUris((p) => p.filter((_, idx) => idx !== i)), MAX_GALLERY_IMAGES)}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepBlock}>
      {renderStepHeader('creator.step2Title', 'creator.step2Subtitle')}
      <Text style={[styles.intro, { color: secondaryColor }]}>{t('creator.step2Intro')}</Text>

      {CREATOR_SOCIAL_PLATFORMS.map(({ key, labelKey, placeholderKey, required }) => (
        <View key={key}>
          <Input
            label={`${t(labelKey)}${required ? ' *' : ''}`}
            placeholder={t(placeholderKey)}
            value={socialLinks[key] ?? ''}
            onChangeText={(v) => setSocialLink(key, v)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {key === 'instagram' && (
            <Text style={[styles.hint, { color: secondaryColor, marginTop: -8 }]}>
              {t('creator.socialInstagramHint')}
            </Text>
          )}
        </View>
      ))}

      <Text style={[styles.fieldLabel, { color: textColor }]}>{t('creator.portfolioTitle')}</Text>
      {portfolioLinks.map((link, i) => (
        <View key={i} style={styles.portfolioRow}>
          <Input
            placeholder={t('creator.portfolioPlaceholder')}
            value={link}
            onChangeText={(v) => {
              const next = [...portfolioLinks];
              next[i] = v;
              setPortfolioLinks(next);
            }}
            containerStyle={styles.portfolioInput}
            autoCapitalize="none"
          />
          {i === portfolioLinks.length - 1 && portfolioLinks.length < 5 && (
            <TouchableOpacity
              style={[styles.addBtn, { borderColor }]}
              onPress={() => setPortfolioLinks([...portfolioLinks, ''])}
            >
              <Ionicons name="add" size={20} color={textColor} />
            </TouchableOpacity>
          )}
        </View>
      ))}

      <View style={[styles.analyticsBox, { borderColor, backgroundColor: cardBg }]}>
        <Text style={[styles.fieldLabel, { color: textColor }]}>
          {t('creator.analyticsTitle', { max: MAX_ANALYTICS_SCREENSHOTS })}
        </Text>
        <Text style={[styles.hint, { color: secondaryColor }]}>{t('creator.analyticsHint')}</Text>
        <TouchableOpacity style={styles.filePickerInner} onPress={pickAnalyticsImages}>
          <Text style={[styles.chooseFiles, { color: theme.colors.primary.blue }]}>
            {t('creator.chooseFiles')}
          </Text>
          <Text style={[styles.hint, { color: secondaryColor }]}>
            {analyticsUris.length > 0 ? `${analyticsUris.length}/${MAX_ANALYTICS_SCREENSHOTS}` : ''}
          </Text>
        </TouchableOpacity>
        {analyticsUris.length > 0 &&
          renderImageGrid(
            analyticsUris,
            (i) => setAnalyticsUris((p) => p.filter((_, idx) => idx !== i)),
            MAX_ANALYTICS_SCREENSHOTS
          )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepBlock}>
      {renderStepHeader('creator.step3Title', 'creator.step3Subtitle')}

      <Text style={[styles.sectionTitle, { color: textColor }]}>{t('creator.tierQuestion')}</Text>
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('creator.tierIntro1')}</Text>
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('creator.tierIntro2')}</Text>
      <Text style={[styles.hint, { color: secondaryColor, marginBottom: theme.spacing.md }]}>
        {t('creator.tierIntro3')}
      </Text>

      {CREATOR_CATEGORIES.map((opt) => {
        const selected = category === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.tierCard,
              {
                borderColor: selected ? theme.colors.primary.blue : borderColor,
                backgroundColor: selected ? 'rgba(43,96,232,0.08)' : 'transparent',
              },
            ]}
            onPress={() => setCategory(opt.value)}
          >
            <Text
              style={[
                styles.tierTitle,
                { color: selected ? theme.colors.primary.blue : textColor },
              ]}
            >
              {t(opt.labelKey)}
            </Text>
            <Text
              style={[
                styles.tierDesc,
                { color: selected ? theme.colors.primary.blue : secondaryColor },
              ]}
            >
              {t(opt.descriptionKey)}
            </Text>
          </TouchableOpacity>
        );
      })}

      <Text style={[styles.sectionTitle, { color: textColor, marginTop: theme.spacing.lg }]}>
        {t('creator.hostLevelsTitle')}
      </Text>
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('creator.hostLevelsHint')}</Text>

      {HOST_COLLABORATION_LEVELS.map((opt) => {
        const selected = hostLevels.includes(opt.value);
        const tierMessageKey = category != null ? HOST_LEVEL_TIER_MESSAGES[category][opt.value] : null;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.levelChip,
              {
                borderColor: selected ? theme.colors.primary.blue : borderColor,
                backgroundColor: selected ? 'rgba(43,96,232,0.08)' : 'transparent',
              },
            ]}
            onPress={() => toggleHostLevel(opt.value)}
          >
            <Text style={[styles.levelChipText, { color: selected ? theme.colors.primary.blue : textColor }]}>
              {t(opt.labelKey)}
            </Text>
            {tierMessageKey != null && (
              <Text
                style={[
                  styles.levelChipDesc,
                  { color: selected ? theme.colors.primary.blue : secondaryColor },
                ]}
              >
                {t(tierMessageKey)}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      <Text style={[styles.sectionTitle, { color: textColor, marginTop: theme.spacing.lg }]}>
        {t('creator.collabExchangeNote')}
      </Text>
      <View style={[styles.infoBox, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.hint, { color: secondaryColor }]}>{t('creator.collabHowItWorks')}</Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepBlock}>
      {renderStepHeader('creator.step4Title', 'creator.step4Subtitle')}
      <Text style={[styles.intro, { color: secondaryColor }]}>{t('creator.step4Intro')}</Text>

      <Text style={[styles.fieldLabel, { color: textColor }]}>{t('creator.currency')}</Text>
      <View style={styles.currencyRow}>
        {(['EUR', 'USD'] as CreatorOnboardingCurrency[]).map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.currencyChip,
              {
                borderColor: currency === c ? theme.colors.primary.blue : borderColor,
                backgroundColor: currency === c ? 'rgba(43,96,232,0.08)' : 'transparent',
              },
            ]}
            onPress={() => setCurrency(c)}
          >
            <Text style={{ color: currency === c ? theme.colors.primary.blue : textColor }}>
              {c === 'EUR' ? t('creator.currencyEur') : t('creator.currencyUsd')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.rateGrid}>
        {CREATOR_RATE_FIELDS.filter((f) => f.section === 'main').map((field) => (
          <View key={field.key} style={styles.rateHalf}>
            <Input
              label={`${t(field.labelKey)} (${currencySymbol})`}
              value={rates[field.key]}
              onChangeText={(v) => setRates((p) => ({ ...p, [field.key]: v.replace(/[^0-9.]/g, '') }))}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: textColor }]}>{t('creator.reelsAndContent')}</Text>
      <View style={styles.rateGrid}>
        {CREATOR_RATE_FIELDS.filter((f) => f.section === 'reels').map((field) => (
          <View key={field.key} style={field.fullWidth ? styles.rateFull : styles.rateHalf}>
            <Input
              label={`${t(field.labelKey)} (${currencySymbol})`}
              value={rates[field.key]}
              onChangeText={(v) => setRates((p) => ({ ...p, [field.key]: v.replace(/[^0-9.]/g, '') }))}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
        ))}
      </View>

      {renderCheckbox(organicUseAccepted, () => setOrganicUseAccepted((v) => !v), `${t('creator.organicUseAccept')} *`)}

      <View style={styles.divider} />
      <Text style={[styles.hint, { color: secondaryColor }]}>{t('creator.rateNotesTitle')}</Text>
      <Input
        label={t('creator.hostLevelBasic')}
        value={rateNotes.basic}
        onChangeText={(v) => setRateNotes((p) => ({ ...p, basic: v }))}
        placeholder={t('creator.rateNoteBasicPlaceholder')}
      />
      <Input
        label={t('creator.hostLevelMedium')}
        value={rateNotes.medium}
        onChangeText={(v) => setRateNotes((p) => ({ ...p, medium: v }))}
        placeholder={t('creator.rateNoteMediumPlaceholder')}
      />
      <Input
        label={t('creator.hostLevelLuxury')}
        value={rateNotes.luxury}
        onChangeText={(v) => setRateNotes((p) => ({ ...p, luxury: v }))}
        placeholder={t('creator.rateNoteLuxuryPlaceholder')}
      />
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepBlock}>
      {renderStepHeader('creator.step5Title', 'creator.step5Subtitle')}
      <Text style={[styles.intro, { color: secondaryColor }]}>{t('creator.step5Intro')}</Text>

      <View style={[styles.showcaseOffer, { backgroundColor: theme.colors.primary.blue }]}>
        <Text style={styles.showcaseOfferLabel}>{t('creator.showcaseOfferLabel')}</Text>
        <Text style={styles.showcasePrice}>{t('creator.showcasePrice')}</Text>
        <Text style={styles.showcaseOfferDetail}>{t('creator.showcaseOfferDetail')}</Text>
      </View>

      <View style={[styles.sponsoredBox, { borderColor, backgroundColor: cardBg }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('creator.sponsoredTitle')}</Text>
        <Text style={[styles.hint, { color: secondaryColor }]}>{t('creator.sponsoredBody')}</Text>
        <View style={styles.sponsoredRow}>
          <TouchableOpacity
            style={[
              styles.sponsoredBtn,
              {
                borderColor,
                backgroundColor: showcaseInterest === true ? 'rgba(43,96,232,0.08)' : cardBg,
              },
            ]}
            onPress={() => setShowcaseInterest(true)}
          >
            <Text style={{ color: textColor }}>{t('creator.sponsoredYes')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sponsoredBtn,
              {
                borderColor: theme.colors.primary.blue,
                backgroundColor: showcaseInterest === false ? theme.colors.primary.blue : cardBg,
              },
            ]}
            onPress={() => setShowcaseInterest(false)}
          >
            <Text style={{ color: showcaseInterest === false ? '#fff' : textColor }}>
              {t('creator.sponsoredNo')}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.disclaimer, { color: secondaryColor }]}>{t('creator.sponsoredDisclaimer')}</Text>
      </View>

      <Button size="lg" style={styles.button} onPress={() => handleStep5Continue(true)}>
        {t('creator.activateShowcase')}
      </Button>
      <Button
        variant="outline"
        size="lg"
        style={styles.button}
        onPress={() => handleStep5Continue(false)}
      >
        {t('creator.continueWithoutShowcase')}
      </Button>
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.stepBlock}>
      {renderStepHeader('creator.step6Title')}
      <Text style={[styles.congrats, { color: textColor }]}>{t('creator.step6Congrats')}</Text>
      <Text style={[styles.congratsBlue, { color: theme.colors.primary.blue }]}>
        {t('creator.step6CongratsBlue')}
      </Text>
      <View style={styles.divider} />

      <Text style={[styles.bullet, { color: secondaryColor }]}>• {t('creator.premiumBullet')}</Text>
      {renderCheckbox(premiumCreator, () => setPremiumCreator((v) => !v), t('creator.premiumCheckbox'))}

      <Text style={[styles.bullet, { color: secondaryColor }]}>• {t('creator.paymentBullet1')}</Text>
      <Text style={[styles.bullet, { color: secondaryColor }]}>• {t('creator.paymentBullet2')}</Text>
      <Text style={[styles.bullet, { color: secondaryColor }]}>• {t('creator.discountBullet')}</Text>
      <Text style={[styles.bullet, { color: secondaryColor }]}>• {t('creator.sharingBullet')}</Text>

      {renderCheckbox(termsAccepted, () => setTermsAccepted((v) => !v), `${t('creator.termsCheckbox')} *`)}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.stepIndicator, { color: secondaryColor }]}>
          {step} / {CREATOR_ONBOARDING_STEPS}
        </Text>
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
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
        </ScrollView>

        {step !== 5 && (
          <View style={styles.footer}>
            {step > 1 && step < CREATOR_ONBOARDING_STEPS && (
              <Button variant="outline" onPress={() => setStep(step - 1)} style={styles.backButton}>
                {t('common.back')}
              </Button>
            )}
            {step < CREATOR_ONBOARDING_STEPS ? (
              <Button
                onPress={handleNext}
                disabled={
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2) ||
                  (step === 3 && !canProceedStep3) ||
                  (step === 4 && !canProceedStep4)
                }
                size="lg"
                style={styles.buttonFlex}
              >
                {t('onboarding.continue')}
              </Button>
            ) : (
              <Button
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || !canProceedStep6}
                size="lg"
                style={styles.buttonFlex}
              >
                {t('creator.finish')}
              </Button>
            )}
          </View>
        )}

        {step === 5 && (
          <View style={styles.footerCenter}>
            <TouchableOpacity onPress={() => setStep(4)}>
              <Text style={[styles.backLink, { color: secondaryColor }]}>{t('common.back').toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  stepIndicator: { ...theme.typography.subheadline },
  scrollContent: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing['3xl'],
  },
  stepBlock: { gap: theme.spacing.md },
  stepHeader: { marginBottom: theme.spacing.sm },
  stepOf: { ...theme.typography.caption1, textTransform: 'uppercase', marginBottom: theme.spacing.xs },
  title: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subtitle: {
    ...theme.typography.body,
    textTransform: 'uppercase',
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    ...theme.typography.headline,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  fieldLabel: {
    ...theme.typography.subheadline,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  intro: { ...theme.typography.footnote, textTransform: 'uppercase', lineHeight: 18 },
  hint: { ...theme.typography.caption1, lineHeight: 16 },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  photoAvatarWrap: { position: 'relative' },
  photoUploadOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRowText: { flex: 1 },
  chooseFiles: { ...theme.typography.subheadline, fontWeight: '600' },
  statusOk: { ...theme.typography.caption1, marginTop: -8 },
  statusErr: { ...theme.typography.caption1, marginTop: -8 },
  row: { flexDirection: 'row', gap: theme.spacing.md },
  half: { flex: 1 },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: { ...theme.typography.subheadline, fontWeight: '600' },
  filePicker: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filePickerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  gridItem: { position: 'relative', width: 72, height: 72 },
  gridImage: { width: 72, height: 72, borderRadius: theme.borderRadius.md },
  removeBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileCount: { ...theme.typography.caption1, alignSelf: 'center' },
  portfolioRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  portfolioInput: { flex: 1 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  analyticsBox: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  tierCard: {
    borderWidth: 2,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  tierTitle: { ...theme.typography.headline, fontWeight: '700', textTransform: 'uppercase' },
  tierDesc: { ...theme.typography.caption1, lineHeight: 16, textTransform: 'uppercase' },
  levelChip: {
    borderWidth: 2,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  levelChipText: { ...theme.typography.title3, fontWeight: '600' },
  levelChipDesc: { ...theme.typography.caption1, lineHeight: 16, textTransform: 'uppercase' },
  infoBox: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  currencyRow: { flexDirection: 'row', gap: theme.spacing.sm },
  currencyChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  rateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  rateHalf: { width: '47%' },
  rateFull: { width: '100%' },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: theme.spacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkLabel: { ...theme.typography.subheadline, flex: 1, textTransform: 'uppercase' },
  showcaseOffer: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  showcaseOfferLabel: {
    color: '#fff',
    ...theme.typography.caption1,
    textTransform: 'uppercase',
  },
  showcasePrice: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
  },
  showcaseOfferDetail: {
    color: '#fff',
    ...theme.typography.caption1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  sponsoredBox: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sponsoredRow: { flexDirection: 'row', gap: theme.spacing.sm },
  sponsoredBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  disclaimer: { ...theme.typography.caption2, fontStyle: 'italic', textTransform: 'uppercase' },
  congrats: { ...theme.typography.headline, fontWeight: '700', textTransform: 'uppercase' },
  congratsBlue: { ...theme.typography.headline, fontWeight: '700', textTransform: 'uppercase' },
  bullet: { ...theme.typography.footnote, lineHeight: 20 },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.screenPadding,
    paddingTop: theme.spacing.md,
  },
  footerCenter: {
    padding: theme.spacing.screenPadding,
    alignItems: 'center',
  },
  backButton: { minWidth: 90 },
  buttonFlex: { flex: 1 },
  button: { width: '100%' },
  backLink: { ...theme.typography.caption1, letterSpacing: 1 },
});
