/**
 * Host Structure Screen
 * Carica foto della struttura + calendario (mese) con selezione date + bottom sheet prezzo/disponibilità
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { it } from 'date-fns/locale';

import * as Clipboard from 'expo-clipboard';
import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { config } from '../../constants/config';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService, type AvailabilityStatus, type PropertyMediaRow } from '../../services/properties.service';
import { useFocusEffect } from '@react-navigation/native';
import type { Property } from '../../types/property';
import type { ProfileScreenProps } from '../../types/navigation';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

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
  const [month, setMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Record<string, { status: AvailabilityStatus; price_override: number | null }>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStatus, setModalStatus] = useState<AvailabilityStatus>('available');
  const [modalPrice, setModalPrice] = useState('');
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [airbnbIcalUrl, setAirbnbIcalUrl] = useState('');
  const [bookingIcalUrl, setBookingIcalUrl] = useState('');
  const [savingCalendarSync, setSavingCalendarSync] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [selectedPhotoUris, setSelectedPhotoUris] = useState<string[]>([]);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const lastTapRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

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

  const VALID_STATUSES: AvailabilityStatus[] = ['available', 'occupied', 'closed', 'collab_available'];
  const normalizeStatus = (s: string | undefined): AvailabilityStatus =>
    (s && VALID_STATUSES.includes(s as AvailabilityStatus) ? s : 'available') as AvailabilityStatus;

  useEffect(() => {
    if (!property?.id) return;
    const start = format(startOfMonth(month), 'yyyy-MM-dd');
    const end = format(endOfMonth(month), 'yyyy-MM-dd');
    PropertiesService.getAvailability(property.id, start, end)
      .then((rows) => {
        const map: Record<string, { status: AvailabilityStatus; price_override: number | null }> = {};
        rows.forEach((r) => {
          map[r.date] = {
            status: normalizeStatus(r.status),
            price_override: r.price_override ?? null,
          };
        });
        setAvailability((prev) => ({ ...prev, ...map }));
      })
      .catch(() => {});
  }, [property?.id, month]);

  useEffect(() => {
    if (!property?.id) return;
    PropertiesService.getPendingPropertyMedia(property.id)
      .then(setPendingMedia)
      .catch(() => setPendingMedia([]));
  }, [property?.id]);

  useEffect(() => {
    setAirbnbIcalUrl(property?.airbnb_ical_import_url ?? '');
    setBookingIcalUrl(property?.booking_ical_import_url ?? '');
  }, [property?.id, property?.airbnb_ical_import_url, property?.booking_ical_import_url]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const list = await PropertiesService.getPropertiesByHost(user.id);
      setProperties(list);
    } catch (e) {
      console.error(e);
      Alert.alert('Errore', 'Impossibile caricare le strutture.');
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
      Alert.alert('Errore', 'Impossibile creare la struttura.');
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
      Alert.alert('Limite raggiunto', `Puoi caricare al massimo ${maxPhotos} foto per struttura.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso necessario', 'Abilita l\'accesso alla galleria.');
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
      Alert.alert('Errore', e?.message ?? 'Carica le foto dopo aver creato il bucket "properties" in Supabase Storage.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemoveApprovedImage = (uri: string) => {
    if (!property?.id) return;
    Alert.alert('Rimuovere foto?', 'La foto sarà rimossa dalla struttura.', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Rimuovi',
        style: 'destructive',
        onPress: async () => {
          try {
            await PropertiesService.removePropertyImage(property.id, uri);
            setProperty((p) =>
              p ? { ...p, images: (p.images ?? []).filter((url) => url !== uri) } : null
            );
          } catch (e) {
            Alert.alert('Errore', 'Impossibile rimuovere la foto.');
          }
        },
      },
    ]);
  };

  const handleRemovePendingImage = (m: PropertyMediaRow) => {
    if (!property?.id) return;
    Alert.alert('Rimuovere foto?', 'La foto in attesa di approvazione sarà eliminata.', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Rimuovi',
        style: 'destructive',
        onPress: async () => {
          try {
            await PropertiesService.deletePendingPropertyMedia(m.id);
            setPendingMedia((prev) => prev.filter((x) => x.id !== m.id));
          } catch (e) {
            Alert.alert('Errore', 'Impossibile rimuovere la foto.');
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
      Alert.alert('Limite mensile raggiunto', `Puoi caricare al massimo ${maxVideosPerMonth} video al mese per struttura. Riprova il mese prossimo.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso necessario', 'Abilita l\'accesso alla galleria per i video.');
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
      Alert.alert('Errore', e?.message ?? 'Impossibile caricare il video.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  // Pad start so first day aligns with Monday (1)
  const startPad = (monthStart.getDay() + 6) % 7;
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const handleDayPress = async (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    const now = Date.now();
    const isDoubleTap = lastTapRef.current.key === key && now - lastTapRef.current.time < 400;
    lastTapRef.current = { key, time: now };

    if (isDoubleTap && property?.id) {
      try {
        await PropertiesService.setAvailability(property.id, [key], 'collab_available', availability[key]?.price_override ?? null);
        setAvailability((prev) => ({ ...prev, [key]: { status: 'collab_available', price_override: prev[key]?.price_override ?? null } }));
      } catch (_) {}
      return;
    }
    setSelectedDates((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const openModal = () => {
    const first = selectedDates[0];
    const current = first ? availability[first] : null;
    setModalStatus(normalizeStatus(current?.status));
    setModalPrice(current?.price_override != null ? String(current.price_override) : '');
    setModalVisible(true);
  };

  const saveAvailability = async () => {
    if (!property?.id || selectedDates.length === 0) return;
    setSavingAvailability(true);
    try {
      const price = modalPrice.trim() ? parseFloat(modalPrice.replace(',', '.')) : null;
      await PropertiesService.setAvailability(property.id, selectedDates, modalStatus, price);
      selectedDates.forEach((d) => {
        setAvailability((prev) => ({ ...prev, [d]: { status: modalStatus, price_override: price } }));
      });
      setSelectedDates([]);
      setModalVisible(false);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string'
          ? (e as { message: string }).message.trim()
          : '';
      const body = msg
        ? `${msg}\n\n${t('propertyOnboarding.availabilitySaveErrorDetail')}`
        : t('propertyOnboarding.availabilitySaveError');
      Alert.alert(t('common.error'), body);
    } finally {
      setSavingAvailability(false);
    }
  };

  const saveCalendarSync = async () => {
    if (!property?.id) return;
    setSavingCalendarSync(true);
    try {
      await PropertiesService.updatePropertyCalendarSync(property.id, {
        airbnb_ical_import_url: airbnbIcalUrl.trim() || null,
        booking_ical_import_url: bookingIcalUrl.trim() || null,
      });
      setProperty((p) =>
        p
          ? {
              ...p,
              airbnb_ical_import_url: airbnbIcalUrl.trim() || null,
              booking_ical_import_url: bookingIcalUrl.trim() || null,
            }
          : null
      );
      Alert.alert('Salvato', 'Link calendari aggiornati. Usa "Sincronizza ora" per importare le prenotazioni.');
    } catch (e) {
      Alert.alert('Errore', 'Impossibile salvare i link.');
    } finally {
      setSavingCalendarSync(false);
    }
  };

  const triggerCalendarSync = async () => {
    if (!property?.id) return;
    setSyncingCalendar(true);
    try {
      const result = await PropertiesService.triggerCalendarSync(property.id);
      if (result.ok) {
        const start = format(startOfMonth(month), 'yyyy-MM-dd');
        const end = format(endOfMonth(month), 'yyyy-MM-dd');
        const rows = await PropertiesService.getAvailability(property.id, start, end);
        const map: Record<string, { status: AvailabilityStatus; price_override: number | null }> = {};
        rows.forEach((r) => {
          map[r.date] = { status: normalizeStatus(r.status), price_override: r.price_override ?? null };
        });
        setAvailability((prev) => ({ ...prev, ...map }));
        const list = await PropertiesService.getPropertiesByHost(user!.id);
        setProperties(list);
        const updated = list.find((p) => p.id === property.id);
        if (updated) setProperty(updated);
        Alert.alert('Fatto', 'Sincronizzazione completata. Le date occupate su Airbnb/Booking sono ora segnate come prenotate.');
      } else {
        Alert.alert('Sincronizzazione', result.error ?? 'Riprova più tardi.');
      }
    } catch (e) {
      Alert.alert('Errore', 'Sincronizzazione non disponibile.');
    } finally {
      setSyncingCalendar(false);
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
          <Text style={[styles.headerTitle, { color: textColor }]}>La mia struttura</Text>
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
          {property?.title || 'Struttura'}
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
              Modifica dati struttura (nome, camere, letti, servizi, paese, prezzo, sconti)
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
            <Text style={[styles.sectionTitle, { color: textColor }]}>Foto struttura</Text>
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
                  {canAddPhoto ? 'Carica foto (anche più insieme)' : 'Limite raggiunto'}
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
                  <Text style={styles.pendingBadgeText}>In attesa</Text>
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
                  <Text style={styles.selectedBadgeText}>Da salvare</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          {selectedPhotoUris.length > 0 && (
            <View style={styles.saveMediaRow}>
              <Text style={[styles.saveMediaHint, { color: secondary }]}>
                {selectedPhotoUris.length} foto selezionate. Clicca Salva per caricarle.
              </Text>
              <Button onPress={handleSavePhotos} disabled={uploadingPhoto} style={styles.saveMediaBtn}>
                {uploadingPhoto ? <ActivityIndicator size="small" color="#fff" /> : 'Salva'}
              </Button>
            </View>
          )}
          {(pendingImages.length > 0 || pendingVideos.length > 0) && (
            <Text style={[styles.pendingHint, { color: secondary }]}>
              Foto e video saranno visibili in app dopo l'approvazione dell'admin.
            </Text>
          )}
        </View>

        {/* Video struttura (max 5 al mese) */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Video struttura</Text>
            <Text style={[styles.counter, { color: secondary }]}>
              {videosThisMonth}/{maxVideosPerMonth} questo mese
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
              <Text style={[styles.photoAddText, { color: secondary }]}>Video selezionato</Text>
            ) : (
              <>
                <Ionicons name="videocam" size={32} color={secondary} />
                <Text style={[styles.photoAddText, { color: secondary }]}>
                  {canAddVideo ? 'Scegli video' : 'Limite mensile raggiunto'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {selectedVideoUri && (
            <>
              <View style={[styles.videoPreviewWrap, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7' }]}>
                <Ionicons name="videocam" size={48} color={secondary} />
                <Text style={[styles.saveMediaHint, { color: secondary }]}>Video selezionato. Clicca Salva per caricarlo.</Text>
              </View>
              <View style={styles.saveMediaActions}>
                <Button onPress={handleSaveVideo} disabled={uploadingVideo} style={styles.saveMediaBtn}>
                  {uploadingVideo ? <ActivityIndicator size="small" color="#fff" /> : 'Salva'}
                </Button>
                <TouchableOpacity
                  style={[styles.cancelMediaBtn, { borderColor: secondary }]}
                  onPress={() => setSelectedVideoUri(null)}
                >
                  <Text style={[styles.cancelMediaBtnText, { color: secondary }]}>Annulla</Text>
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

        {/* Calendario */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Disponibilità e prezzo</Text>
          <View style={styles.calendarNav}>
            <TouchableOpacity onPress={() => setMonth((m) => subMonths(m, 1))}>
              <Ionicons name="chevron-back" size={24} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: textColor }]}>
              {format(month, 'MMMM yyyy', { locale: it })}
            </Text>
            <TouchableOpacity onPress={() => setMonth((m) => addMonths(m, 1))}>
              <Ionicons name="chevron-forward" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={[styles.weekday, { color: secondary }]}>{w}</Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {paddedDays.map((date, i) => {
              if (!date) return <View key={`pad-${i}`} style={styles.dayCell} />;
              const key = format(date, 'yyyy-MM-dd');
              const isSelected = selectedDates.includes(key);
              const info = availability[key];
              const status = normalizeStatus(info?.status);
              const isCurrentMonth = isSameMonth(date, month);
              const dayBg =
                status === 'occupied'
                  ? styles.dayOccupied
                  : status === 'closed'
                    ? styles.dayClosed
                    : status === 'collab_available'
                      ? styles.dayCollab
                      : null;
              const dayTextColor =
                status === 'closed'
                  ? '#fff'
                  : status === 'collab_available'
                    ? '#fff'
                    : status === 'occupied'
                      ? (isDark ? '#ffb3ae' : '#8b0000')
                      : isCurrentMonth
                        ? textColor
                        : secondary;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.dayCell,
                    !isCurrentMonth && styles.dayOtherMonth,
                    dayBg,
                    isSelected && styles.daySelected,
                  ]}
                  onPress={() => handleDayPress(date)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: isSelected ? '#fff' : dayTextColor },
                    ]}
                  >
                    {format(date, 'd')}
                  </Text>
                  {info?.price_override != null && (
                    <Text style={[styles.dayPrice, { color: isSelected ? '#fff' : (status === 'closed' || status === 'collab_available' ? 'rgba(255,255,255,0.9)' : secondary) }]} numberOfLines={1}>
                      €{info.price_override}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#fff', borderWidth: 1, borderColor: secondary }]} />
              <Text style={[styles.legendText, { color: secondary }]}>Libera</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#c0392b' }]} />
              <Text style={[styles.legendText, { color: secondary }]}>Prenotata</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#1a1a1a' }]} />
              <Text style={[styles.legendText, { color: secondary }]}>Chiusa</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#27ae60' }]} />
              <Text style={[styles.legendText, { color: secondary }]}>Collaborazioni</Text>
            </View>
          </View>
          <Text style={[styles.doubleTapHint, { color: secondary }]}>
            Doppio tap su una data → disponibile per creator/influencer
          </Text>
          {selectedDates.length > 0 && (
            <>
              <Text style={[styles.selectedHint, { color: secondary }]}>
                {selectedDates.length} data/e selezionate
              </Text>
              <Button onPress={openModal} style={styles.setPriceBtn}>
                Imposta prezzo e disponibilità
              </Button>
            </>
          )}
        </View>

        {/* Sincronizza con Airbnb e Booking.com */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Sincronizza con Airbnb e Booking.com</Text>
          <Text style={[styles.calendarSyncHint, { color: secondary }]}>
            Collega i calendari delle tue strutture su Airbnb e Booking: incolla l'URL iCal che trovi nelle impostazioni della proprietà. Le date prenotate verranno importate qui come "Prenotata".
          </Text>
          <Text style={[styles.inputLabel, { color: secondary }]}>URL calendario Airbnb (iCal)</Text>
          <TextInput
            style={[styles.calendarInput, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7', color: textColor }]}
            placeholder="https://www.airbnb.com/calendar/ical/..."
            placeholderTextColor={secondary}
            value={airbnbIcalUrl}
            onChangeText={setAirbnbIcalUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.inputLabel, { color: secondary }]}>URL calendario Booking.com (iCal)</Text>
          <TextInput
            style={[styles.calendarInput, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7', color: textColor }]}
            placeholder="https://admin.booking.com/..."
            placeholderTextColor={secondary}
            value={bookingIcalUrl}
            onChangeText={setBookingIcalUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {property?.calendar_sync_last_at && (
            <Text style={[styles.lastSyncText, { color: secondary }]}>
              Ultima sincronizzazione: {format(parseISO(property.calendar_sync_last_at), "d MMM yyyy, HH:mm", { locale: it })}
            </Text>
          )}
          <Button onPress={saveCalendarSync} disabled={savingCalendarSync} style={styles.calendarSyncBtn}>
            {savingCalendarSync ? <ActivityIndicator size="small" color="#fff" /> : 'Salva link calendari'}
          </Button>
          <Button
            variant="secondary"
            onPress={triggerCalendarSync}
            disabled={syncingCalendar || (!airbnbIcalUrl.trim() && !bookingIcalUrl.trim())}
            style={styles.calendarSyncBtn}
          >
            {syncingCalendar ? <ActivityIndicator size="small" color={theme.colors.primary.blue} /> : 'Sincronizza ora'}
          </Button>
          <Text style={[styles.inputLabel, { color: secondary, marginTop: 16 }]}>
            Esporta il tuo calendario su Airbnb e Booking
          </Text>
          <Text style={[styles.calendarSyncHint, { color: secondary }]}>
            Copia questo link e incollalo in Airbnb/Booking nella sezione «Importa calendario»: le date che blocchi qui saranno visibili lì.
          </Text>
          {property?.id && (
            <>
              <Text style={[styles.calendarExportUrl, { color: textColor }]} numberOfLines={2} selectable>
                {config.app.calendarExportBaseUrl
                  ? `${config.app.calendarExportBaseUrl}?property_id=${property.id}`
                  : `(Configura EXPO_PUBLIC_CALENDAR_EXPORT_BASE_URL)`}
              </Text>
              {config.app.calendarExportBaseUrl ? (
                <TouchableOpacity
                  style={styles.copyLinkBtn}
                  onPress={async () => {
                    const url = `${config.app.calendarExportBaseUrl}?property_id=${property.id}`;
                    await Clipboard.setStringAsync(url);
                    Alert.alert('Link copiato', 'Incollalo in Airbnb o Booking nella sezione Importa calendario.');
                  }}
                >
                  <Ionicons name="copy-outline" size={20} color={theme.colors.primary.blue} />
                  <Text style={[styles.copyLinkText, { color: theme.colors.primary.blue }]}>Copia link esportazione</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom sheet: prezzo e stato */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: bg }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: textColor }]}>Prezzo e disponibilità</Text>
            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: secondary }]}>Stato</Text>
              <View style={[styles.statusRow, styles.statusWrap]}>
                <TouchableOpacity
                  style={[styles.statusBtn, modalStatus === 'available' && styles.statusBtnActive]}
                  onPress={() => setModalStatus('available')}
                >
                  <Text style={[styles.statusBtnText, { color: modalStatus === 'available' ? '#fff' : textColor }]}>Libera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusBtn, modalStatus === 'occupied' && styles.statusBtnActive]}
                  onPress={() => setModalStatus('occupied')}
                >
                  <Text style={[styles.statusBtnText, { color: modalStatus === 'occupied' ? '#fff' : textColor }]}>Prenotata</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusBtn, modalStatus === 'closed' && styles.statusBtnClosed]}
                  onPress={() => setModalStatus('closed')}
                >
                  <Text style={[styles.statusBtnText, { color: modalStatus === 'closed' ? '#fff' : textColor }]}>Chiusa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusBtn, modalStatus === 'collab_available' && styles.statusBtnCollab]}
                  onPress={() => setModalStatus('collab_available')}
                >
                  <Text style={[styles.statusBtnText, { color: modalStatus === 'collab_available' ? '#fff' : textColor }]}>Collaborazioni</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: secondary }]}>Prezzo (€) per le date selezionate</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7', color: textColor }]}
                placeholder="Es. 120 (lascia vuoto per prezzo base)"
                placeholderTextColor={secondary}
                value={modalPrice}
                onChangeText={setModalPrice}
                keyboardType="decimal-pad"
              />
            </View>
            <Button onPress={saveAvailability} disabled={savingAvailability} style={styles.modalSave}>
              {savingAvailability ? <ActivityIndicator size="small" color="#fff" /> : 'Salva'}
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
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
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthTitle: { ...theme.typography.headline, fontWeight: '600' },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center', ...theme.typography.caption1 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  dayOtherMonth: { opacity: 0.4 },
  daySelected: { backgroundColor: theme.colors.primary.blue, borderRadius: 8 },
  dayOccupied: { backgroundColor: '#c0392b', borderRadius: 8 },
  dayClosed: { backgroundColor: '#1a1a1a', borderRadius: 8 },
  dayCollab: { backgroundColor: '#27ae60', borderRadius: 8 },
  dayText: { ...theme.typography.footnote, fontWeight: '600' },
  dayPrice: { fontSize: 9, marginTop: 0 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 4 },
  legendText: { ...theme.typography.caption1 },
  doubleTapHint: { ...theme.typography.caption1, marginTop: 6 },
  selectedHint: { ...theme.typography.caption1, marginTop: 12 },
  setPriceBtn: { marginTop: 8 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: theme.spacing.screenPadding,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.5)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { ...theme.typography.title2, fontWeight: '700', marginBottom: 20 },
  modalRow: { marginBottom: 16 },
  modalLabel: { ...theme.typography.caption1, marginBottom: 6 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusWrap: { flexWrap: 'wrap' },
  statusBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  statusBtnActive: { backgroundColor: theme.colors.primary.blue },
  statusBtnClosed: { backgroundColor: '#1a1a1a' },
  statusBtnCollab: { backgroundColor: '#27ae60' },
  statusBtnText: { ...theme.typography.body, fontWeight: '600', fontSize: 13 },
  modalInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...theme.typography.body,
  },
  modalSave: { marginTop: 8 },
  calendarSyncHint: { ...theme.typography.caption1, marginBottom: 12 },
  inputLabel: { ...theme.typography.caption1, marginBottom: 4, marginTop: 8 },
  calendarInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...theme.typography.body,
    fontSize: 13,
  },
  calendarSyncBtn: { marginTop: 12 },
  lastSyncText: { ...theme.typography.caption1, marginTop: 8 },
  calendarExportUrl: { ...theme.typography.caption1, marginTop: 8 },
  copyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
  },
  copyLinkText: { ...theme.typography.subheadline, fontWeight: '600' },
});
