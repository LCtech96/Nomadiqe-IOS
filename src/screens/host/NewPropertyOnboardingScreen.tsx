/**
 * New Property Onboarding Screen
 * Wizard 8 step per host: tipo struttura → info base → servizi → foto → impostazioni collaborazione → chi ospitare → prezzo → programma
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Button, Card } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { usePropertyOnboarding, PropertyOnboardingProvider } from '../../contexts/PropertyOnboardingContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import {
  STRUCTURE_TYPES,
  AMENITIES_REQUESTED,
  AMENITIES_INTEREST,
  AMENITIES_SECURITY,
  type StructureTypeKey,
  type AmenityKey,
} from '../../constants/propertyOnboarding';
import type { ProfileScreenProps } from '../../types/navigation';

const TOTAL_STEPS = 8;

// Map structure type to icon name (Ionicons)
const STRUCTURE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  casa: 'home',
  appartamento: 'business',
  fienile: 'storefront',
  bnb: 'cafe',
  barca: 'boat',
  baita: 'home-outline',
  camper_roulotte: 'car',
  casa_particular: 'home',
  castello: 'business',
  grotta: 'ellipse',
  container: 'cube',
  casa_cicladica: 'square',
  dammuso: 'home',
  cupola: 'ellipse',
  casa_organica: 'leaf',
  fattoria: 'leaf',
  pensione: 'business',
  hotel: 'business',
  casa_galleggiante: 'water',
  kezhan: 'business',
  minsu: 'business',
  riad: 'business',
  ryokan: 'business',
  capanna: 'home',
  tenda: 'bonfire',
  minicasa: 'home',
  torre: 'cellular',
  casa_sull_albero: 'leaf',
  trullo: 'home',
  mulino: 'snow',
  iurta: 'ellipse',
};

function NewPropertyOnboardingScreenInner({
  navigation,
}: ProfileScreenProps<'NewPropertyOnboarding'>) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const { state, nextStep, prevStep, setStructureType, setPropertyTitle, setLocation, setBasicInfo, setWeekendSupplementPercent, toggleAmenity, setImages, setCoverIndex, setCollaborationMode, setWhoToHost, setBasePriceWeekday, setKolbedProgram, setPaidCollabBudget, setPropertyId, reset } = usePropertyOnboarding();

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [paidMin, setPaidMin] = useState(state.paidCollabMin?.toString() ?? '');
  const [paidMax, setPaidMax] = useState(state.paidCollabMax?.toString() ?? '');

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const handleStep1Next = async () => {
    if (!state.structureType || !user?.id) return;
    setLoading(true);
    try {
      const p = await PropertiesService.createProperty(user.id, 'La mia struttura', state.structureType);
      setPropertyId(p.id);
      nextStep();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('onboarding.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const maxPhotosStep4 = PropertiesService.maxPhotosPerProperty;
  const canAddPhotoStep4 = state.images.length < maxPhotosStep4;

  const handleStep4AddPhoto = async () => {
    if (!state.propertyId || !user?.id) return;
    if (state.images.length >= maxPhotosStep4) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.photoPermissionTitle'), t('common.photoPermissionMessage'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const slotsLeft = maxPhotosStep4 - state.images.length;
    const toUpload = result.assets.slice(0, slotsLeft);
    setUploadingPhoto(true);
    try {
      const newUrls: string[] = [];
      for (const asset of toUpload) {
        const url = await PropertiesService.uploadPropertyImage(
          state.propertyId!,
          user.id,
          asset.uri,
          asset.base64 ?? null
        );
        newUrls.push(url);
      }
      setImages([...state.images, ...newUrls]);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('common.photoError'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const moveImage = (from: number, to: number) => {
    const arr = [...state.images];
    const [removed] = arr.splice(from, 1);
    arr.splice(to, 0, removed);
    setImages(arr);
    if (state.coverIndex === from) setCoverIndex(to);
    else if (state.coverIndex === to) setCoverIndex(from);
    else if (state.coverIndex > from && state.coverIndex <= to) setCoverIndex(state.coverIndex - 1);
    else if (state.coverIndex >= to && state.coverIndex < from) setCoverIndex(state.coverIndex + 1);
  };

  const handleFinish = async () => {
    if (!state.propertyId || !user?.id) return;
    setLoading(true);
    try {
      const address = [state.city, state.country].filter(Boolean).join(', ') || 'Da compilare';
      // Le foto sono in property_media (pending) e saranno visibili dopo approvazione admin
      await PropertiesService.updateProperty(state.propertyId, {
        title: state.propertyTitle?.trim() || 'La mia struttura',
        address,
        city: state.city?.trim() || 'Da compilare',
        country: state.country?.trim() || 'IT',
        bedrooms: state.bedrooms,
        bathrooms: state.bathrooms,
        beds: state.beds,
        max_guests: state.guests,
        amenities: state.amenities,
        base_price_per_night: state.basePriceWeekday,
        weekend_supplement_percent: state.weekendSupplementPercent,
        instant_book: state.collaborationMode === 'instant',
        collaboration_booking_mode: state.collaborationMode,
        first_guest_type: state.whoToHost,
        kolbed_program: state.kolbedProgram,
        paid_collab_min_budget: state.kolbedProgram === 'paid_collab' && paidMin ? parseFloat(paidMin) : null,
        paid_collab_max_budget: state.kolbedProgram === 'paid_collab' && paidMax ? parseFloat(paidMax) : null,
        status: 'draft',
      });
      reset();
      navigation.replace('HostStructure', { propertyId: state.propertyId });
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('onboarding.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (state.step) {
      case 1: return !!state.structureType;
      case 2: return (state.propertyTitle?.trim()?.length ?? 0) >= 2 && (state.city?.trim()?.length ?? 0) >= 2;
      case 5: return !!state.collaborationMode;
      case 6: return !!state.whoToHost;
      case 7: return state.basePriceWeekday > 0;
      case 8: return !!state.kolbedProgram && (state.kolbedProgram !== 'paid_collab' || (paidMin && paidMax && parseFloat(paidMin) <= parseFloat(paidMax)));
      default: return true;
    }
  };

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: textColor }]}>{t('propertyOnboarding.step1Title')}</Text>
            <View style={styles.typeGrid}>
              {STRUCTURE_TYPES.map((key) => {
                const selected = state.structureType === key;
                const iconName = STRUCTURE_ICONS[key] ?? 'home';
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.typeCard, { backgroundColor: selected ? (isDark ? `${theme.colors.primary.blue}40` : `${theme.colors.primary.blue}20`) : cardBg }]}
                    onPress={() => setStructureType(key)}
                  >
                    <Ionicons name={iconName} size={28} color={theme.colors.primary.blue} />
                    <Text style={[styles.typeLabel, { color: textColor }]} numberOfLines={2}>
                      {t(`propertyType.${key}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: textColor }]}>{t('propertyOnboarding.step2Title')}</Text>
            <Text style={[styles.stepSubtitle, { color: secondary }]}>{t('propertyOnboarding.step2Subtitle')}</Text>
            <Text style={[styles.inputLabel, { color: textColor }]}>{t('propertyOnboarding.step2PropertyName')}</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: cardBg, color: textColor }]}
              placeholder={t('propertyOnboarding.step2PropertyNamePlaceholder')}
              placeholderTextColor={secondary}
              value={state.propertyTitle}
              onChangeText={setPropertyTitle}
              maxLength={80}
            />
            <Text style={[styles.inputLabel, { color: textColor }]}>{t('propertyOnboarding.step2City')}</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: cardBg, color: textColor }]}
              placeholder={t('propertyOnboarding.step2CityPlaceholder')}
              placeholderTextColor={secondary}
              value={state.city}
              onChangeText={(v) => setLocation(v, state.country)}
            />
            <Text style={[styles.inputLabel, { color: textColor }]}>{t('propertyOnboarding.step2Country')}</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: cardBg, color: textColor }]}
              placeholder={t('propertyOnboarding.step2CountryPlaceholder')}
              placeholderTextColor={secondary}
              value={state.country}
              onChangeText={(v) => setLocation(state.city, v)}
            />
            <StepperRow label={t('propertyOnboarding.guests')} value={state.guests} onChange={(v) => setBasicInfo({ guests: v })} min={1} max={20} textColor={textColor} secondary={secondary} />
            <StepperRow label={t('propertyOnboarding.bedrooms')} value={state.bedrooms} onChange={(v) => setBasicInfo({ bedrooms: v })} min={0} max={20} textColor={textColor} secondary={secondary} />
            <StepperRow label={t('propertyOnboarding.beds')} value={state.beds} onChange={(v) => setBasicInfo({ beds: v })} min={1} max={30} textColor={textColor} secondary={secondary} />
            <StepperRow label={t('propertyOnboarding.bathrooms')} value={state.bathrooms} onChange={(v) => setBasicInfo({ bathrooms: v })} min={1} max={20} textColor={textColor} secondary={secondary} />
          </View>
        );

      case 3:
        return (
          <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepTitle, { color: textColor }]}>{t('propertyOnboarding.step3Title')}</Text>
            <Text style={[styles.stepSubtitle, { color: secondary }]}>{t('propertyOnboarding.step3Subtitle')}</Text>
            <Text style={[styles.sectionLabel, { color: textColor }]}>{t('propertyOnboarding.step3SectionRequested')}</Text>
            <View style={styles.amenityGrid}>
              {AMENITIES_REQUESTED.map((key) => (
                <AmenityChip key={key} id={key} selected={state.amenities.includes(key)} onToggle={() => toggleAmenity(key)} textColor={textColor} cardBg={cardBg} t={t} />
              ))}
            </View>
            <Text style={[styles.sectionLabel, { color: textColor }]}>{t('propertyOnboarding.step3SectionInterest')}</Text>
            <View style={styles.amenityGrid}>
              {AMENITIES_INTEREST.map((key) => (
                <AmenityChip key={key} id={key} selected={state.amenities.includes(key)} onToggle={() => toggleAmenity(key)} textColor={textColor} cardBg={cardBg} t={t} />
              ))}
            </View>
            <Text style={[styles.sectionLabel, { color: textColor }]}>{t('propertyOnboarding.step3SectionSecurity')}</Text>
            <View style={styles.amenityGrid}>
              {AMENITIES_SECURITY.map((key) => (
                <AmenityChip key={key} id={key} selected={state.amenities.includes(key)} onToggle={() => toggleAmenity(key)} textColor={textColor} cardBg={cardBg} t={t} />
              ))}
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: textColor }]}>{t('propertyOnboarding.step4Title')}</Text>
            <Text style={[styles.stepSubtitle, { color: secondary }]}>{t('propertyOnboarding.step4Subtitle')} ({state.images.length}/{maxPhotosStep4})</Text>
            <Text style={[styles.stepHint, { color: secondary }]}>{t('propertyOnboarding.step4MultiSelectHint')}</Text>
            {state.images.length > 0 ? (
              <>
                <View style={styles.coverWrap}>
                  <Image source={{ uri: state.images[state.coverIndex] }} style={styles.coverImage} resizeMode="cover" />
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>{t('propertyOnboarding.step4CoverPhoto')}</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
                  {state.images.map((uri, i) => (
                    <TouchableOpacity key={i} onPress={() => setCoverIndex(i)} style={[styles.thumbWrap, i === state.coverIndex && styles.thumbSelected]}>
                      <Image source={{ uri }} style={styles.thumb} />
                      {i > 0 && (
                        <TouchableOpacity style={styles.thumbMove} onPress={() => moveImage(i, i - 1)}>
                          <Ionicons name="chevron-back" size={16} color="#fff" />
                        </TouchableOpacity>
                      )}
                      {i < state.images.length - 1 && (
                        <TouchableOpacity style={[styles.thumbMove, { right: 0 }]} onPress={() => moveImage(i, i + 1)}>
                          <Ionicons name="chevron-forward" size={16} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  ))}
                  {canAddPhotoStep4 && (
                    <TouchableOpacity style={[styles.thumbAdd, { borderColor: secondary }]} onPress={handleStep4AddPhoto} disabled={uploadingPhoto}>
                      {uploadingPhoto ? <ActivityIndicator size="small" color={theme.colors.primary.blue} /> : <Ionicons name="add" size={32} color={secondary} />}
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </>
            ) : (
              <TouchableOpacity style={[styles.photoAddBig, { borderColor: secondary }]} onPress={handleStep4AddPhoto} disabled={uploadingPhoto || !canAddPhotoStep4}>
                {uploadingPhoto ? <ActivityIndicator size="large" color={theme.colors.primary.blue} /> : <Ionicons name="camera" size={48} color={secondary} />}
                <Text style={[styles.photoAddBigText, { color: secondary }]}>{t('propertyOnboarding.step4Organize')}</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: textColor }]}>{t('propertyOnboarding.step5Title')}</Text>
            <Text style={[styles.stepSubtitle, { color: secondary }]}>{t('propertyOnboarding.step5Subtitle')} <Text style={styles.link}>{t('propertyOnboarding.step5LearnMore')}</Text></Text>
            <TouchableOpacity style={[styles.optionCard, { backgroundColor: state.collaborationMode === 'approve_first_5' ? cardBg : 'transparent', borderWidth: 2, borderColor: state.collaborationMode === 'approve_first_5' ? theme.colors.primary.blue : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') }]} onPress={() => setCollaborationMode('approve_first_5')}>
              <View style={styles.optionCardContent}>
                <Text style={[styles.optionTitle, { color: textColor }]}>{t('propertyOnboarding.step5Option1Title')}</Text>
                <View style={styles.recommendedBadge}><Text style={styles.recommendedText}>{t('propertyOnboarding.step5Option1Badge')}</Text></View>
                <Text style={[styles.optionDesc, { color: secondary }]}>{t('propertyOnboarding.step5Option1Desc')}</Text>
              </View>
              <Ionicons name="calendar" size={32} color={theme.colors.primary.blue} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.optionCard, { backgroundColor: state.collaborationMode === 'instant' ? cardBg : 'transparent', borderWidth: 2, borderColor: state.collaborationMode === 'instant' ? theme.colors.primary.blue : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') }]} onPress={() => setCollaborationMode('instant')}>
              <View style={styles.optionCardContent}>
                <Text style={[styles.optionTitle, { color: textColor }]}>{t('propertyOnboarding.step5Option2Title')}</Text>
                <Text style={[styles.optionDesc, { color: secondary }]}>{t('propertyOnboarding.step5Option2Desc')}</Text>
              </View>
              <Ionicons name="flash" size={32} color={theme.colors.primary.blue} />
            </TouchableOpacity>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: textColor }]}>{t('propertyOnboarding.step6Title')}</Text>
            <Text style={[styles.stepSubtitle, { color: secondary }]}>{t('propertyOnboarding.step6Subtitle')} <Text style={styles.link}>{t('propertyOnboarding.step5LearnMore')}</Text></Text>
            <TouchableOpacity style={[styles.optionCard, { backgroundColor: state.whoToHost === 'any_creator' ? cardBg : 'transparent', borderWidth: 2, borderColor: state.whoToHost === 'any_creator' ? theme.colors.primary.blue : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') }]} onPress={() => setWhoToHost('any_creator')}>
              <View style={styles.optionCardContent}>
                <Text style={[styles.optionTitle, { color: textColor }]}>{t('propertyOnboarding.step6Option1Title')}</Text>
                <Text style={[styles.optionDesc, { color: secondary }]}>{t('propertyOnboarding.step6Option1Desc')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.optionCard, { backgroundColor: state.whoToHost === 'verified_creator' ? cardBg : 'transparent', borderWidth: 2, borderColor: state.whoToHost === 'verified_creator' ? theme.colors.primary.blue : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') }]} onPress={() => setWhoToHost('verified_creator')}>
              <View style={styles.optionCardContent}>
                <Text style={[styles.optionTitle, { color: textColor }]}>{t('propertyOnboarding.step6Option2Title')}</Text>
                <Text style={[styles.optionDesc, { color: secondary }]}>{t('propertyOnboarding.step6Option2Desc')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        );

      case 7:
        const weekendOptions = [0, 10, 15, 20, 25, 30];
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: textColor }]}>{t('propertyOnboarding.step7Title')}</Text>
            <Text style={[styles.stepSubtitle, { color: secondary }]}>{t('propertyOnboarding.step7Tip')}</Text>
            <View style={styles.priceInputWrap}>
              <Text style={[styles.priceCurrency, { color: textColor }]}>€</Text>
              <TextInput
                style={[styles.priceInput, { color: textColor }]}
                value={state.basePriceWeekday ? state.basePriceWeekday.toString() : ''}
                onChangeText={(v) => setBasePriceWeekday(v ? Math.max(0, parseFloat(v.replace(',', '.')) || 0) : 0)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={secondary}
              />
            </View>
            <Text style={[styles.guestPriceLine, { color: secondary }]}>{t('propertyOnboarding.step7GuestPrice')}: €{Math.round(state.basePriceWeekday * 1.14)}</Text>
            <Text style={[styles.sectionLabel, { color: textColor }]}>{t('propertyOnboarding.step7WeekendSupplement')}</Text>
            <View style={styles.weekendRow}>
              {weekendOptions.map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={[
                    styles.weekendChip,
                    { backgroundColor: state.weekendSupplementPercent === pct ? (isDark ? `${theme.colors.primary.blue}40` : `${theme.colors.primary.blue}20`) : cardBg },
                    state.weekendSupplementPercent === pct && { borderColor: theme.colors.primary.blue, borderWidth: 2 },
                  ]}
                  onPress={() => setWeekendSupplementPercent(pct)}
                >
                  <Text style={[styles.weekendChipText, { color: state.weekendSupplementPercent === pct ? theme.colors.primary.blue : textColor }]}>{pct}%</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button variant="outline" onPress={() => {}} style={styles.showSimilarBtn}>{t('propertyOnboarding.step7ShowSimilar')}</Button>
            <Text style={[styles.link, { color: theme.colors.primary.blue }]}>{t('propertyOnboarding.step7LearnMorePrices')}</Text>
          </View>
        );

      case 8:
        return (
          <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepTitle, { color: textColor }]}>{t('propertyOnboarding.step8Title')}</Text>
            <Text style={[styles.stepSubtitle, { color: secondary }]}>{t('propertyOnboarding.step8Subtitle')}</Text>
            <TouchableOpacity style={[styles.programCard, { backgroundColor: state.kolbedProgram === 'kolbed_100' ? cardBg : 'transparent', borderWidth: 2, borderColor: state.kolbedProgram === 'kolbed_100' ? theme.colors.primary.blue : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') }]} onPress={() => setKolbedProgram('kolbed_100')}>
              <Text style={[styles.programTitle, { color: textColor }]}>{t('propertyOnboarding.programKolbed100Title')}</Text>
              <Text style={[styles.programDesc, { color: secondary }]}>{t('propertyOnboarding.programKolbed100Desc')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.programCard, { backgroundColor: state.kolbedProgram === 'gigo_50' ? cardBg : 'transparent', borderWidth: 2, borderColor: state.kolbedProgram === 'gigo_50' ? theme.colors.primary.blue : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') }]} onPress={() => setKolbedProgram('gigo_50')}>
              <Text style={[styles.programTitle, { color: textColor }]}>{t('propertyOnboarding.programGigo50Title')}</Text>
              <Text style={[styles.programDesc, { color: secondary }]}>{t('propertyOnboarding.programGigo50Desc')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.programCard, { backgroundColor: state.kolbedProgram === 'paid_collab' ? cardBg : 'transparent', borderWidth: 2, borderColor: state.kolbedProgram === 'paid_collab' ? theme.colors.primary.blue : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') }]} onPress={() => setKolbedProgram('paid_collab')}>
              <Text style={[styles.programTitle, { color: textColor }]}>{t('propertyOnboarding.programPaidTitle')}</Text>
              <Text style={[styles.programDesc, { color: secondary }]}>{t('propertyOnboarding.programPaidDesc')}</Text>
              {state.kolbedProgram === 'paid_collab' && (
                <View style={styles.budgetRow}>
                  <TextInput style={[styles.budgetInput, { backgroundColor: cardBg, color: textColor }]} placeholder="Min €" placeholderTextColor={secondary} value={paidMin} onChangeText={setPaidMin} keyboardType="decimal-pad" />
                  <Text style={[styles.budgetSep, { color: secondary }]}>–</Text>
                  <TextInput style={[styles.budgetInput, { backgroundColor: cardBg, color: textColor }]} placeholder="Max €" placeholderTextColor={secondary} value={paidMax} onChangeText={setPaidMax} keyboardType="decimal-pad" />
                </View>
              )}
            </TouchableOpacity>
            <View style={{ height: 24 }} />
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => state.step === 1 ? navigation.goBack() : prevStep()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: secondary }]}>{state.step} / {TOTAL_STEPS}</Text>
        <View style={styles.headerRight} />
      </View>
      {state.step <= 4 ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>
      ) : (
        <View style={styles.scroll}>
          {renderStep()}
        </View>
      )}
      <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
        {state.step < TOTAL_STEPS ? (
          <Button
            onPress={state.step === 1 ? handleStep1Next : nextStep}
            disabled={!canProceed() || loading}
            loading={loading}
            size="lg"
            style={styles.nextBtn}
          >
            {t('propertyOnboarding.next')}
          </Button>
        ) : (
          <Button onPress={handleFinish} disabled={!canProceed() || loading} loading={loading} size="lg" style={styles.nextBtn}>
            {t('propertyOnboarding.finish')}
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

function StepperRow({
  label,
  value,
  onChange,
  min,
  max,
  textColor,
  secondary,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  textColor: string;
  secondary: string;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={[styles.stepperLabel, { color: textColor }]}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.max(min, value - 1))}>
          <Ionicons name="remove" size={24} color={secondary} />
        </TouchableOpacity>
        <Text style={[styles.stepperValue, { color: textColor }]}>{value}</Text>
        <TouchableOpacity style={styles.stepperBtn} onPress={() => onChange(Math.min(max, value + 1))}>
          <Ionicons name="add" size={24} color={secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AmenityChip({
  id,
  selected,
  onToggle,
  textColor,
  cardBg,
  t,
}: {
  id: AmenityKey;
  selected: boolean;
  onToggle: () => void;
  textColor: string;
  cardBg: string;
  t: (key: string) => string;
}) {
  return (
    <TouchableOpacity
      style={[styles.amenityChip, { backgroundColor: selected ? theme.colors.primary.blue : cardBg, borderWidth: selected ? 2 : 1, borderColor: selected ? theme.colors.primary.blue : 'transparent' }]}
      onPress={onToggle}
    >
      <Text style={[styles.amenityChipText, { color: selected ? '#fff' : textColor }]} numberOfLines={2}>{t(`amenity.${id}`)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: { ...theme.typography.subheadline },
  headerRight: { width: 24 },
  scroll: { flex: 1 },
  scrollContent: { padding: theme.spacing.screenPadding, paddingBottom: 100 },
  stepContent: { padding: theme.spacing.screenPadding, paddingBottom: 100 },
  stepScroll: { flex: 1, paddingHorizontal: theme.spacing.screenPadding },
  stepTitle: { ...theme.typography.largeTitle, fontWeight: '700', marginBottom: theme.spacing.sm },
  stepSubtitle: { ...theme.typography.body, marginBottom: theme.spacing.sm },
  stepHint: { ...theme.typography.footnote, marginBottom: theme.spacing.lg },
  link: { textDecorationLine: 'underline' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  typeCard: {
    width: '31%',
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 88,
  },
  typeLabel: { ...theme.typography.caption1, marginTop: 6, textAlign: 'center' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.2)' },
  stepperLabel: { ...theme.typography.body, fontWeight: '500' },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(128,128,128,0.2)', justifyContent: 'center', alignItems: 'center' },
  stepperValue: { ...theme.typography.title2, fontWeight: '700', minWidth: 32, textAlign: 'center' },
  inputLabel: { ...theme.typography.body, fontWeight: '600', marginTop: theme.spacing.md, marginBottom: 4 },
  textInput: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, ...theme.typography.body, marginBottom: theme.spacing.sm },
  sectionLabel: { ...theme.typography.headline, fontWeight: '600', marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm },
  weekendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  weekendChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  weekendChipText: { ...theme.typography.subheadline, fontWeight: '600' },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityChip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  amenityChipText: { ...theme.typography.subheadline },
  coverWrap: { width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  coverImage: { width: '100%', height: '100%' },
  coverBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  coverBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  thumbRow: { flexDirection: 'row', marginBottom: 24 },
  thumbWrap: { width: 80, height: 80, borderRadius: 8, marginRight: 8, overflow: 'hidden', position: 'relative' },
  thumbSelected: { borderWidth: 3, borderColor: theme.colors.primary.blue },
  thumb: { width: '100%', height: '100%' },
  thumbMove: { position: 'absolute', top: 0, bottom: 0, width: 24, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  thumbAdd: { width: 80, height: 80, borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  photoAddBig: { width: '100%', height: 200, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  photoAddBigText: { ...theme.typography.body, marginTop: 8 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
  },
  optionCardContent: { flex: 1 },
  optionTitle: { ...theme.typography.headline, fontWeight: '600', marginBottom: 4 },
  optionDesc: { ...theme.typography.subheadline },
  recommendedBadge: { alignSelf: 'flex-start', backgroundColor: '#34C759', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 6 },
  recommendedText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  priceInputWrap: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: theme.colors.primary.blue, marginBottom: 12 },
  priceCurrency: { ...theme.typography.largeTitle, fontWeight: '700', marginRight: 4 },
  priceInput: { flex: 1, ...theme.typography.largeTitle, fontWeight: '700', paddingVertical: 8 },
  guestPriceLine: { ...theme.typography.subheadline, marginBottom: 16 },
  showSimilarBtn: { marginBottom: 16 },
  programCard: { padding: theme.spacing.lg, borderRadius: 12, marginBottom: theme.spacing.md },
  programTitle: { ...theme.typography.headline, fontWeight: '600', marginBottom: 8 },
  programDesc: { ...theme.typography.subheadline },
  budgetRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  budgetInput: { flex: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, ...theme.typography.body },
  budgetSep: { ...theme.typography.body },
  footer: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
  },
  nextBtn: {},
});

export default function NewPropertyOnboardingScreen(props: ProfileScreenProps<'NewPropertyOnboarding'>) {
  return (
    <PropertyOnboardingProvider>
      <NewPropertyOnboardingScreenInner {...props} />
    </PropertyOnboardingProvider>
  );
}
