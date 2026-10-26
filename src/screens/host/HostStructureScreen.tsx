/**
 * Host Structure Screen
 * Carica foto e video della struttura (calendario e guida ospiti sono nella vista struttura).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService, type PropertyMediaRow } from '../../services/properties.service';
import { useFocusEffect } from '@react-navigation/native';
import type { Property } from '../../types/property';
import type { ProfileScreenProps } from '../../types/navigation';

export default function HostStructureScreen({
  navigation,
  route,
}: ProfileScreenProps<'HostStructure'>) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const propertyId = route.params?.propertyId;

  const [property, setProperty] = useState<Property | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [pendingMedia, setPendingMedia] = useState<PropertyMediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [selectedPhotoUris, setSelectedPhotoUris] = useState<string[]>([]);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.id) return;
      load();
    }, [user?.id])
  );

  useEffect(() => {
    if (propertyId && properties.length) {
      const p = properties.find((x) => x.id === propertyId) ?? properties[0];
      setProperty(p);
    } else if (properties.length) {
      setProperty(properties[0]);
    } else {
      setProperty(null);
    }
  }, [propertyId, properties]);

  useEffect(() => {
    if (!property?.id) return;
    PropertiesService.getPendingPropertyMedia(property.id)
      .then(setPendingMedia)
      .catch(() => setPendingMedia([]));
  }, [property?.id]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const list = await PropertiesService.getPropertiesByHost(user.id);
      setProperties(list);
    } catch (e) {
      console.error(e);
      Alert.alert(t('common.error'), t('propertyOnboarding.loadStructuresError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStructure = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const p = await PropertiesService.createProperty(user.id);
      setProperties((prev) => [p, ...prev]);
      setProperty(p);
    } catch (e) {
      Alert.alert(t('common.error'), t('propertyOnboarding.createStructureError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStructure = () => {
    if (!property?.id) return;
    Alert.alert(
      t('propertyOnboarding.deleteStructureTitle'),
      t('propertyOnboarding.deleteStructureMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await PropertiesService.deleteProperty(property.id);
              await load();
            } catch (e) {
              Alert.alert(t('common.error'), t('propertyOnboarding.deleteStructureError'));
            }
          },
        },
      ]
    );
  };

  const maxPhotos = PropertiesService.maxPhotosPerProperty;
  const pendingImages = pendingMedia.filter((m) => m.type === 'image');
  const approvedImages = property?.images ?? [];
  const photoCount = approvedImages.length + pendingImages.length;
  const canAddPhoto = photoCount + selectedPhotoUris.length < maxPhotos;

  const handlePickPhoto = async () => {
    if (!property?.id || !user?.id) return;
    const currentTotal = photoCount + selectedPhotoUris.length;
    if (currentTotal >= maxPhotos) {
      Alert.alert(t('propertyOnboarding.photoLimitTitle'), t('propertyOnboarding.photoLimitMessage', { max: maxPhotos }));
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('propertyOnboarding.galleryPermissionTitle'), t('propertyOnboarding.galleryPermissionPhotosMessage'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const maxToAdd = maxPhotos - currentTotal;
    const uris = result.assets.slice(0, maxToAdd).map((a) => a.uri);
    setSelectedPhotoUris((prev) => [...prev, ...uris].slice(0, maxPhotos - approvedImages.length - pendingImages.length));
  };

  const handleSavePhotos = async () => {
    if (!property?.id || !user?.id || selectedPhotoUris.length === 0) return;
    setUploadingPhoto(true);
    try {
      for (const uri of selectedPhotoUris) {
        await PropertiesService.uploadPropertyImage(property.id, user.id, uri, null);
      }
      setSelectedPhotoUris([]);
      const list = await PropertiesService.getPendingPropertyMedia(property.id);
      setPendingMedia(list);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('propertyOnboarding.uploadPhotosFallbackError'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemoveApprovedImage = (uri: string) => {
    if (!property?.id) return;
    Alert.alert(t('propertyOnboarding.removePhotoTitle'), t('propertyOnboarding.removePhotoApprovedMessage'), [
      { text: t('propertyOnboarding.removePhotoCancel'), style: 'cancel' },
      {
        text: t('propertyOnboarding.removePhotoConfirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            await PropertiesService.removePropertyImage(property.id, uri);
            setProperty((p) =>
              p ? { ...p, images: (p.images ?? []).filter((url) => url !== uri) } : null
            );
          } catch (e) {
            Alert.alert(t('common.error'), t('propertyOnboarding.removePhotoError'));
          }
        },
      },
    ]);
  };

  const handleRemovePendingImage = (m: PropertyMediaRow) => {
    if (!property?.id) return;
    Alert.alert(t('propertyOnboarding.removePhotoTitle'), t('propertyOnboarding.removePhotoPendingMessage'), [
      { text: t('propertyOnboarding.removePhotoCancel'), style: 'cancel' },
      {
        text: t('propertyOnboarding.removePhotoConfirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            await PropertiesService.deletePendingPropertyMedia(m.id);
            setPendingMedia((prev) => prev.filter((x) => x.id !== m.id));
          } catch (e) {
            Alert.alert(t('common.error'), t('propertyOnboarding.removePhotoError'));
          }
        },
      },
    ]);
  };

  const handleSetCoverImage = async (uri: string) => {
    if (!property?.id) return;
    const current = property.images ?? [];
    if (current[0] === uri) return;
    try {
      await PropertiesService.setPropertyCoverImage(property.id, uri);
      const next = [uri, ...current.filter((url) => url !== uri)];
      setProperty((p) => (p ? { ...p, images: next } : null));
      setProperties((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, images: next } : p))
      );
    } catch (e) {
      Alert.alert(t('common.error'), t('propertyOnboarding.setCoverError'));
    }
  };

  const videoUploads = property?.video_uploads ?? [];
  const pendingVideos = pendingMedia.filter((m) => m.type === 'video');
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const approvedVideosThisMonth = videoUploads.filter((e) => {
    const d = new Date(e.uploaded_at);
    return d.getFullYear() === y && d.getMonth() === m;
  }).length;
  const pendingVideosThisMonth = pendingVideos.filter((e) => {
    const d = new Date(e.uploaded_at);
    return d.getFullYear() === y && d.getMonth() === m;
  }).length;
  const videosThisMonth = approvedVideosThisMonth + pendingVideosThisMonth;
  const maxVideosPerMonth = PropertiesService.maxVideosPerMonthPerProperty;
  const canAddVideo = videosThisMonth < maxVideosPerMonth;

  const handlePickVideo = async () => {
    if (!property?.id || !user?.id) return;
    if (!canAddVideo && !selectedVideoUri) {
      Alert.alert(
        t('propertyOnboarding.monthlyVideoLimitTitle'),
        t('propertyOnboarding.monthlyVideoLimitMessage', { max: maxVideosPerMonth })
      );
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('propertyOnboarding.galleryPermissionTitle'), t('propertyOnboarding.galleryPermissionVideosMessage'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setSelectedVideoUri(result.assets[0].uri);
  };

  const handleSaveVideo = async () => {
    if (!property?.id || !user?.id || !selectedVideoUri) return;
    setUploadingVideo(true);
    try {
      await PropertiesService.uploadPropertyVideo(property.id, user.id, selectedVideoUri);
      setSelectedVideoUri(null);
      const list = await PropertiesService.getPendingPropertyMedia(property.id);
      setPendingMedia(list);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('propertyOnboarding.uploadVideoError'));
    } finally {
      setUploadingVideo(false);
    }
  };

  if (loading && properties.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
      </View>
    );
  }

  if (!property && properties.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('propertyOnboarding.myStructureTitle')}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: textColor }]}>{t('propertyOnboarding.noStructure')}</Text>
          <Text style={[styles.emptyHint, { color: secondary }]}>
            {t('propertyOnboarding.addStructureHint')}
          </Text>
          <Button onPress={() => navigation.navigate('NewPropertyOnboarding')} style={styles.addBtn}>
            {t('propertyOnboarding.addStructure')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          {property?.title || t('propertyOnboarding.structureFallbackTitle')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Selettore strutture: distingue e permette di passare da una all'altra */}
        <View style={styles.structuresSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{t('propertyOnboarding.yourStructures')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.structuresScrollContent}
          >
            {properties.map((prop) => {
              const isSelected = property?.id === prop.id;
              const thumb = (prop.images ?? [])[0];
              return (
                <TouchableOpacity
                  key={prop.id}
                  style={[
                    styles.structureCard,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                    isSelected && styles.structureCardSelected,
                  ]}
                  onPress={() => setProperty(prop)}
                  activeOpacity={0.8}
                >
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={styles.structureCardThumb} />
                  ) : (
                    <View style={[styles.structureCardThumb, styles.structureCardThumbPlaceholder]}>
                      <Ionicons name="business-outline" size={28} color={secondary} />
                    </View>
                  )}
                  <Text style={[styles.structureCardTitle, { color: textColor }]} numberOfLines={2}>
                    {prop.title || t('profile.myStructure')}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.structureCardAdd, { borderColor: theme.colors.primary.blue }]}
              onPress={() => navigation.navigate('NewPropertyOnboarding')}
            >
              <Ionicons name="add" size={32} color={theme.colors.primary.blue} />
              <Text style={[styles.structureCardAddText, { color: theme.colors.primary.blue }]}>
                {t('propertyOnboarding.addStructure')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {property?.id && (
          <TouchableOpacity
            style={[styles.editDataRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            onPress={() => navigation.navigate('EditStructure', { propertyId: property.id })}
          >
            <Ionicons name="create-outline" size={22} color={theme.colors.primary.blue} />
            <Text style={[styles.editDataText, { color: theme.colors.primary.blue }]}>
              {t('propertyOnboarding.editStructureDataCta')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={secondary} />
          </TouchableOpacity>
        )}

        {property?.id && (
          <TouchableOpacity
            style={[styles.editDataRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            onPress={handleDeleteStructure}
          >
            <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
            <Text style={[styles.editDataText, { color: theme.colors.error }]}>
              {t('propertyOnboarding.deleteStructureAction')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={secondary} />
          </TouchableOpacity>
        )}

        {/* Foto struttura (max 50) */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>{t('propertyOnboarding.photosSectionTitle')}</Text>
            <Text style={[styles.counter, { color: secondary }]}>{photoCount}/{maxPhotos}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.photoGrid,
              styles.photoAdd,
              { borderColor: secondary },
              !canAddPhoto && styles.photoAddDisabled,
            ]}
            onPress={handlePickPhoto}
            disabled={uploadingPhoto || !canAddPhoto}
          >
            {uploadingPhoto ? (
              <ActivityIndicator color={theme.colors.primary.blue} />
            ) : (
              <>
                <Ionicons name="camera" size={32} color={secondary} />
                <Text style={[styles.photoAddText, { color: secondary }]}>
                  {canAddPhoto ? t('propertyOnboarding.uploadPhotosCta') : t('propertyOnboarding.limitReached')}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
            {approvedImages.map((uri, i) => (
              <View key={`a-${i}`} style={styles.thumbWrap}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => handleRemoveApprovedImage(uri)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
                {i === 0 ? (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>{t('propertyOnboarding.coverLabel')}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.setCoverBtn}
                    onPress={() => handleSetCoverImage(uri)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="image-outline" size={18} color="#fff" />
                    <Text style={styles.setCoverBtnText} numberOfLines={1}>{t('propertyOnboarding.setAsCover')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {pendingImages.map((m) => (
              <View key={m.id} style={styles.thumbWrap}>
                <Image source={{ uri: m.url }} style={styles.photoThumb} />
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{t('propertyOnboarding.pending')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => handleRemovePendingImage(m)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {selectedPhotoUris.map((uri, i) => (
              <View key={`sel-${i}`} style={styles.thumbWrap}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>{t('propertyOnboarding.selectedToSave')}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          {selectedPhotoUris.length > 0 && (
            <View style={styles.saveMediaRow}>
              <Text style={[styles.saveMediaHint, { color: secondary }]}>
                {t('propertyOnboarding.photosSelectedToSaveHint', { count: selectedPhotoUris.length })}
              </Text>
              <Button onPress={handleSavePhotos} disabled={uploadingPhoto} style={styles.saveMediaBtn}>
                {uploadingPhoto ? <ActivityIndicator size="small" color="#fff" /> : t('propertyOnboarding.save')}
              </Button>
            </View>
          )}
          {(pendingImages.length > 0 || pendingVideos.length > 0) && (
            <Text style={[styles.pendingHint, { color: secondary }]}>
              {t('propertyOnboarding.adminApprovalHint')}
            </Text>
          )}
        </View>

        {/* Video struttura (max 5 al mese) */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>{t('propertyOnboarding.videoSectionTitle')}</Text>
            <Text style={[styles.counter, { color: secondary }]}>
              {videosThisMonth}/{maxVideosPerMonth} {t('propertyOnboarding.thisMonth')}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.photoGrid,
              styles.photoAdd,
              { borderColor: secondary },
              (!canAddVideo && !selectedVideoUri) && styles.photoAddDisabled,
            ]}
            onPress={handlePickVideo}
            disabled={uploadingVideo || (!canAddVideo && !selectedVideoUri)}
          >
            {uploadingVideo ? (
              <ActivityIndicator color={theme.colors.primary.blue} />
            ) : selectedVideoUri ? (
              <Text style={[styles.photoAddText, { color: secondary }]}>{t('propertyOnboarding.selectedVideo')}</Text>
            ) : (
              <>
                <Ionicons name="videocam" size={32} color={secondary} />
                <Text style={[styles.photoAddText, { color: secondary }]}>
                  {canAddVideo ? t('propertyOnboarding.chooseVideo') : t('propertyOnboarding.monthlyVideoLimitTitle')}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {selectedVideoUri && (
            <>
              <View style={[styles.videoPreviewWrap, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7' }]}>
                <Ionicons name="videocam" size={48} color={secondary} />
                <Text style={[styles.saveMediaHint, { color: secondary }]}>{t('propertyOnboarding.selectedVideoSaveHint')}</Text>
              </View>
              <View style={styles.saveMediaActions}>
                <Button onPress={handleSaveVideo} disabled={uploadingVideo} style={styles.saveMediaBtn}>
                  {uploadingVideo ? <ActivityIndicator size="small" color="#fff" /> : t('propertyOnboarding.save')}
                </Button>
                <TouchableOpacity
                  style={[styles.cancelMediaBtn, { borderColor: secondary }]}
                  onPress={() => setSelectedVideoUri(null)}
                >
                  <Text style={[styles.cancelMediaBtnText, { color: secondary }]}>{t('propertyOnboarding.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {(videoUploads.length > 0 || pendingVideos.length > 0) && (
            <Text style={[styles.videoHint, { color: secondary }]}>
              {videoUploads.length} approvati · {pendingVideos.length} in attesa
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerRight: { width: 24 },
  scroll: { flex: 1 },
  scrollContent: { padding: theme.spacing.screenPadding, paddingBottom: 40 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { ...theme.typography.title1, marginBottom: 8 },
  emptyHint: { ...theme.typography.body, textAlign: 'center', marginBottom: 24 },
  addBtn: { minWidth: 200 },
  structuresSection: { marginBottom: theme.spacing.lg },
  structuresScrollContent: { paddingVertical: 4, paddingRight: theme.spacing.screenPadding },
  structureCard: {
    width: 120,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  structureCardSelected: { borderColor: theme.colors.primary.blue },
  structureCardThumb: { width: '100%', height: 80 },
  structureCardThumbPlaceholder: {
    backgroundColor: 'rgba(128,128,128,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  structureCardTitle: {
    ...theme.typography.caption1,
    fontWeight: '600',
    padding: 8,
    paddingTop: 6,
  },
  structureCardAdd: {
    width: 120,
    minHeight: 120,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  structureCardAddText: { ...theme.typography.caption1, marginTop: 6, fontWeight: '600' },
  editDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: 10,
    marginBottom: theme.spacing.lg,
    gap: 10,
  },
  editDataText: { ...theme.typography.subheadline, fontWeight: '600', flex: 1 },
  section: { marginBottom: theme.spacing['2xl'] },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  sectionTitle: { ...theme.typography.headline, fontWeight: '600' },
  counter: { ...theme.typography.caption1 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoAdd: {
    width: 120,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoAddText: { ...theme.typography.caption1, marginTop: 4 },
  photoAddDisabled: { opacity: 0.6 },
  photoList: { marginTop: 12, flexGrow: 0 },
  thumbWrap: { position: 'relative', marginRight: 8 },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  pendingBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 2,
    alignItems: 'center',
    borderRadius: 4,
  },
  pendingBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: theme.colors.primary.blue,
    paddingVertical: 2,
    alignItems: 'center',
    borderRadius: 4,
  },
  coverBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  setCoverBtn: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 4,
    borderRadius: 4,
  },
  setCoverBtnText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  selectedBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: theme.colors.primary.blue,
    paddingVertical: 2,
    alignItems: 'center',
    borderRadius: 4,
  },
  selectedBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  saveMediaRow: { marginTop: 12 },
  saveMediaHint: { ...theme.typography.caption1, marginBottom: 8 },
  saveMediaBtn: { marginTop: 4 },
  saveMediaActions: { flexDirection: 'row', gap: 12, marginTop: 12, alignItems: 'center' },
  cancelMediaBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelMediaBtnText: { ...theme.typography.headline, fontWeight: '600' },
  videoPreviewWrap: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  pendingHint: { ...theme.typography.caption1, marginTop: 8 },
  videoHint: { ...theme.typography.caption1, marginTop: 8 },
  photoThumb: { width: 100, height: 80, borderRadius: 8, marginRight: 8 },
});
