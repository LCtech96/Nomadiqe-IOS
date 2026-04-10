/**
 * Host Property Photos Screen
 * Sesta fase onboarding host: caricare foto struttura, scegliere copertina, ordinare (max 50)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import type { OnboardingScreenProps } from '../../types/navigation';

const ONBOARDING_STRUCTURE_TYPE_KEY = '@nomadiqe/onboarding_selected_structure_type';
const ONBOARDING_BASIC_INFO_KEY = '@nomadiqe/onboarding_basic_info';
const ONBOARDING_AMENITIES_KEY = '@nomadiqe/onboarding_amenities';
const MAX_PHOTOS = PropertiesService.maxPhotosPerProperty;

export default function HostPropertyPhotosScreen({
  navigation,
}: OnboardingScreenProps<'HostPropertyPhotos'>) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();

  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        if (!cancelled) setInitError(t('common.error'));
        return;
      }
      try {
        const [structureTypeRaw, basicInfoRaw, amenitiesRaw] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_STRUCTURE_TYPE_KEY),
          AsyncStorage.getItem(ONBOARDING_BASIC_INFO_KEY),
          AsyncStorage.getItem(ONBOARDING_AMENITIES_KEY),
        ]);
        const structureType = structureTypeRaw ?? null;
        const basicInfo = basicInfoRaw ? JSON.parse(basicInfoRaw) : { guests: 2, bedrooms: 1, beds: 1, bathrooms: 1 };
        const amenities = amenitiesRaw ? (JSON.parse(amenitiesRaw) as string[]) : [];

        const property = await PropertiesService.createProperty(
          user.id,
          'La mia struttura',
          structureType
        );
        if (cancelled) return;

        await PropertiesService.updateProperty(property.id, {
          max_guests: basicInfo.guests ?? 2,
          bedrooms: basicInfo.bedrooms ?? 1,
          beds: basicInfo.beds ?? 1,
          bathrooms: basicInfo.bathrooms ?? 1,
          amenities,
        });
        if (cancelled) return;

        setPropertyId(property.id);
        const pending = await PropertiesService.getPendingPropertyMedia(property.id);
        const pendingUrls = (pending ?? []).filter((m) => m.type === 'image').map((m) => m.url);
        setImages([...(property.images ?? []), ...pendingUrls]);
        setCoverIndex(0);
      } catch (e: any) {
        if (!cancelled) setInitError(e?.message ?? t('common.error'));
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, t]);

  const handleAddPhoto = async () => {
    if (!propertyId || !user?.id || images.length >= MAX_PHOTOS) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.photoPermissionTitle'), t('common.photoPermissionMessage'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const slotsLeft = MAX_PHOTOS - images.length;
    const toUpload = result.assets.slice(0, slotsLeft);
    setUploadingPhoto(true);
    try {
      const newUrls: string[] = [];
      for (const asset of toUpload) {
        const url = await PropertiesService.uploadPropertyImage(
          propertyId,
          user.id,
          asset.uri,
          asset.base64 ?? null
        );
        newUrls.push(url);
      }
      setImages((prev) => [...prev, ...newUrls]);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('common.photoError'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const moveImage = (from: number, to: number) => {
    const arr = [...images];
    const [removed] = arr.splice(from, 1);
    arr.splice(to, 0, removed);
    setImages(arr);
    if (coverIndex === from) setCoverIndex(to);
    else if (coverIndex === to) setCoverIndex(from);
    else if (coverIndex > from && coverIndex <= to) setCoverIndex(coverIndex - 1);
    else if (coverIndex >= to && coverIndex < from) setCoverIndex(coverIndex + 1);
  };

  const handleContinue = async () => {
    if (!propertyId) return;
    // Le foto restano in property_media (pending) e saranno visibili dopo approvazione admin
    navigation.navigate('HostCollaborationSettings', { propertyId });
  };

  if (initializing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
          <Text style={[styles.loadingText, { color: secondary }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (initError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: textColor }]}>{initError}</Text>
          <Button variant="outline" onPress={() => navigation.goBack()} style={styles.backBtn}>
            {t('common.back')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.stepTitle, { color: textColor }]}>
          {t('propertyOnboarding.step4Title')}
        </Text>
        <Text style={[styles.stepSubtitle, { color: secondary }]}>
          {t('propertyOnboarding.step4Subtitle')}
        </Text>
        <Text style={[styles.maxPhotosHint, { color: secondary }]}>
          {t('propertyOnboarding.step4MaxPhotos')}
        </Text>
        <Text style={[styles.multiSelectHint, { color: secondary }]}>
          {t('propertyOnboarding.step4MultiSelectHint')}
        </Text>

        {images.length > 0 ? (
          <>
            <View style={styles.coverWrap}>
              <Image
                source={{ uri: images[coverIndex] }}
                style={styles.coverImage}
                resizeMode="cover"
              />
              <View style={styles.coverBadge}>
                <Text style={styles.coverBadgeText}>
                  {t('propertyOnboarding.step4CoverPhoto')}
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbRow}
            >
              {images.map((uri, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setCoverIndex(i)}
                  style={[
                    styles.thumbWrap,
                    i === coverIndex && styles.thumbSelected,
                  ]}
                >
                  <Image source={{ uri }} style={styles.thumb} />
                  {i > 0 && (
                    <TouchableOpacity
                      style={styles.thumbMove}
                      onPress={() => moveImage(i, i - 1)}
                    >
                      <Ionicons name="chevron-back" size={16} color="#fff" />
                    </TouchableOpacity>
                  )}
                  {i < images.length - 1 && (
                    <TouchableOpacity
                      style={[styles.thumbMove, { right: 0 }]}
                      onPress={() => moveImage(i, i + 1)}
                    >
                      <Ionicons name="chevron-forward" size={16} color="#fff" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
              {images.length < MAX_PHOTOS && (
                <TouchableOpacity
                  style={[styles.thumbAdd, { borderColor: secondary }]}
                  onPress={handleAddPhoto}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <ActivityIndicator size="small" color={theme.colors.primary.blue} />
                  ) : (
                    <Ionicons name="add" size={32} color={secondary} />
                  )}
                </TouchableOpacity>
              )}
            </ScrollView>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.photoAddBig, { borderColor: secondary }]}
            onPress={handleAddPhoto}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <ActivityIndicator size="large" color={theme.colors.primary.blue} />
            ) : (
              <>
                <Ionicons name="camera" size={48} color={secondary} />
                <Text style={[styles.photoAddBigText, { color: secondary }]}>
                  {t('propertyOnboarding.step4Organize')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <Button
          onPress={handleContinue}
          size="lg"
          style={styles.button}
          disabled={images.length === 0}
        >
          {t('onboarding.continue')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  loadingText: { marginTop: theme.spacing.md },
  errorText: { ...theme.typography.body, textAlign: 'center', marginBottom: theme.spacing.lg },
  backBtn: { marginTop: theme.spacing.md },
  scroll: { flex: 1 },
  scrollContent: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing['3xl'],
  },
  stepTitle: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  stepSubtitle: { ...theme.typography.body, marginBottom: theme.spacing.xs },
  maxPhotosHint: { ...theme.typography.footnote, marginBottom: theme.spacing.xs },
  multiSelectHint: { ...theme.typography.footnote, marginBottom: theme.spacing.lg },
  coverWrap: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  coverImage: { width: '100%', height: '100%' },
  coverBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coverBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  thumbRow: { flexDirection: 'row', marginBottom: 24 },
  thumbWrap: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbSelected: { borderWidth: 3, borderColor: theme.colors.primary.blue },
  thumb: { width: '100%', height: '100%' },
  thumbMove: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbAdd: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoAddBig: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  photoAddBigText: { ...theme.typography.body, marginTop: 8 },
  button: { marginTop: theme.spacing['2xl'] },
});
