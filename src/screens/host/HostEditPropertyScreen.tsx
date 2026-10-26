/**
 * Host Edit Property Screen
 * Full property edit form from the host dashboard (layout aligned with web dashboard).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import {
  PropertiesService,
  type PropertyMediaRow,
} from '../../services/properties.service';
import type { Property, PropertyType } from '../../types/property';
import type { HostDashboardScreenProps } from '../../types/navigation';
import {
  DESCRIPTION_MAX_LENGTH,
  EDIT_PROPERTY_AMENITY_KEYS,
  EDIT_PROPERTY_SHARED_AREAS,
  EDIT_PROPERTY_TYPES,
} from '../../constants/hostEditProperty';
import {
  mergePropertyEditExtras,
  readPropertyEditExtras,
  type PropertyEditExtras,
  type PropertyRoomRow,
} from '../../utils/propertyEditExtras';

function FormLabel({
  label,
  required,
  color,
  secondary,
}: {
  label: string;
  required?: boolean;
  color: string;
  secondary: string;
}) {
  return (
    <Text style={[styles.fieldLabel, { color }]}>
      {label}
      {required ? <Text style={{ color: theme.colors.error }}> *</Text> : null}
    </Text>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  cardBg,
  borderColor,
  textColor,
  secondary,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  cardBg: string;
  borderColor: string;
  textColor: string;
  secondary: string;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
      <Text style={[styles.sectionCardTitle, { color: textColor }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sectionCardSubtitle, { color: secondary }]}>{subtitle}</Text>
      ) : null}
      {children}
    </View>
  );
}

export default function HostEditPropertyScreen({
  navigation,
  route,
}: HostDashboardScreenProps<'HostEditProperty'>) {
  const { propertyId } = route.params;
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCleaning, setSavingCleaning] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<PropertyMediaRow[]>([]);
  const [mapModalVisible, setMapModalVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('house');
  const [basePrice, setBasePrice] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [nearestAirport, setNearestAirport] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [maxGuests, setMaxGuests] = useState('2');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [cleaningFee, setCleaningFee] = useState('');
  const [cleaningEveryDays, setCleaningEveryDays] = useState('');
  const [rooms, setRooms] = useState<PropertyRoomRow[]>([]);
  const [roomName, setRoomName] = useState('');
  const [roomBeds, setRoomBeds] = useState('1');
  const [roomType, setRoomType] = useState('');
  const [sharedAreas, setSharedAreas] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [checkInTime, setCheckInTime] = useState('03:00 PM');
  const [checkOutTime, setCheckOutTime] = useState('10:00 AM');
  const [cleaningTimezone, setCleaningTimezone] = useState('Europe/Rome');
  const [cleaningHoursAfterCheckout, setCleaningHoursAfterCheckout] = useState('4');
  const [floorAccess, setFloorAccess] = useState('');
  const [keyboxCodes, setKeyboxCodes] = useState('');

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? theme.colors.dark.secondaryBackground : '#fff';
  const borderColor = isDark ? theme.colors.dark.separator : 'rgba(0,0,0,0.12)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#fafafa';

  const goBackToProperties = useCallback(() => {
    navigation.navigate('HostDashboard', { section: 'your_properties' });
  }, [navigation]);

  const applyProperty = useCallback((p: Property, extras: PropertyEditExtras) => {
    setProperty(p);
    setTitle(p.title || '');
    setDescription((p.description || '').slice(0, DESCRIPTION_MAX_LENGTH));
    setPropertyType((p.type as PropertyType) || 'house');
    setBasePrice(p.base_price_per_night != null ? String(p.base_price_per_night) : '');
    setStreet(p.street_address || p.address || '');
    setCity(p.city || '');
    setCountry(p.country || '');
    setNearestAirport(extras.nearest_airport || '');
    setStreetNumber(extras.street_number || '');
    setLatitude(String(p.latitude ?? 0));
    setLongitude(String(p.longitude ?? 0));
    setMaxGuests(String(p.max_guests ?? 2));
    setBedrooms(p.bedrooms != null ? String(p.bedrooms) : '');
    setBathrooms(p.bathrooms != null ? String(p.bathrooms) : '');
    setAmenities(p.amenities ?? []);
    setCustomAmenities(extras.custom_amenities ?? []);
    setPetsAllowed(
      extras.pets_allowed ?? (p.amenities ?? []).includes('animali_ammessi')
    );
    setCleaningFee(p.cleaning_fee != null ? String(p.cleaning_fee) : '');
    setCleaningEveryDays(
      extras.cleaning_every_days != null ? String(extras.cleaning_every_days) : ''
    );
    setRooms(extras.rooms ?? []);
    setSharedAreas(extras.shared_areas ?? []);
    setIsActive(p.is_active ?? true);
    setCheckInTime(p.check_in_time || '03:00 PM');
    setCheckOutTime(p.check_out_time || '10:00 AM');
    setCleaningTimezone(extras.cleaning_timezone || 'Europe/Rome');
    setCleaningHoursAfterCheckout(
      extras.cleaning_hours_after_checkout != null
        ? String(extras.cleaning_hours_after_checkout)
        : '4'
    );
    setFloorAccess(extras.floor_access || '');
    setKeyboxCodes(extras.keybox_codes || '');
  }, []);

  const loadProperty = useCallback(async () => {
    setLoading(true);
    try {
      const p = await PropertiesService.getProperty(propertyId);
      if (!p) {
        setProperty(null);
        return;
      }
      const extras = readPropertyEditExtras(p.tier_deliverables);
      applyProperty(p, extras);
      const pending = await PropertiesService.getPendingPropertyMedia(propertyId);
      setPendingMedia(pending);
    } catch {
      setProperty(null);
    } finally {
      setLoading(false);
    }
  }, [applyProperty, propertyId]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  const buildExtras = (): PropertyEditExtras => ({
    nearest_airport: nearestAirport.trim().toUpperCase() || undefined,
    street_number: streetNumber.trim() || undefined,
    pets_allowed: petsAllowed,
    cleaning_every_days: cleaningEveryDays.trim()
      ? parseInt(cleaningEveryDays, 10)
      : null,
    rooms,
    shared_areas: sharedAreas,
    cleaning_timezone: cleaningTimezone.trim() || undefined,
    cleaning_hours_after_checkout: cleaningHoursAfterCheckout.trim()
      ? parseInt(cleaningHoursAfterCheckout, 10)
      : null,
    floor_access: floorAccess.trim() || undefined,
    keybox_codes: keyboxCodes.trim() || undefined,
    custom_amenities: customAmenities,
  });

  const buildAmenitiesList = (): string[] => {
    const base = amenities.filter((a) => !customAmenities.includes(a));
    const merged = [...base, ...customAmenities];
    if (petsAllowed && !merged.includes('animali_ammessi')) {
      merged.push('animali_ammessi');
    }
    if (!petsAllowed) {
      return merged.filter((a) => a !== 'animali_ammessi');
    }
    return merged;
  };

  const handleSaveProperty = async () => {
    if (!property?.id) return;
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('hostEditProperty.nameRequired'));
      return;
    }
    const price = parseFloat(basePrice.replace(',', '.'));
    if (Number.isNaN(price) || price < 0) {
      Alert.alert(t('common.error'), t('propertyOnboarding.invalidPriceMessage'));
      return;
    }
    const guests = parseInt(maxGuests, 10);
    if (Number.isNaN(guests) || guests < 1) {
      Alert.alert(t('common.error'), t('hostEditProperty.guestsRequired'));
      return;
    }

    setSaving(true);
    try {
      const extras = buildExtras();
      const lat = parseFloat(latitude.replace(',', '.'));
      const lng = parseFloat(longitude.replace(',', '.'));
      const addressParts = [street.trim(), streetNumber.trim(), city.trim(), country.trim()].filter(Boolean);
      await PropertiesService.updateProperty(property.id, {
        title: title.trim(),
        description: description.trim(),
        type: propertyType,
        base_price_per_night: price,
        street_address: street.trim() || null,
        address: addressParts.join(', ') || street.trim() || property.address,
        city: city.trim(),
        country: country.trim().toUpperCase(),
        max_guests: guests,
        bedrooms: bedrooms.trim() ? parseInt(bedrooms, 10) : 0,
        bathrooms: bathrooms.trim() ? parseInt(bathrooms, 10) : 0,
        amenities: buildAmenitiesList(),
        cleaning_fee: cleaningFee.trim() ? parseFloat(cleaningFee.replace(',', '.')) : null,
        is_active: isActive,
        latitude: Number.isNaN(lat) ? property.latitude : lat,
        longitude: Number.isNaN(lng) ? property.longitude : lng,
        tier_deliverables: mergePropertyEditExtras(property.tier_deliverables, extras),
      });
      Alert.alert(t('propertyOnboarding.savedTitle'), t('propertyOnboarding.savedMessage'));
      goBackToProperties();
    } catch {
      Alert.alert(t('common.error'), t('propertyOnboarding.saveErrorMessage'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCleaning = async () => {
    if (!property?.id) return;
    setSavingCleaning(true);
    try {
      const extras = buildExtras();
      await PropertiesService.updateProperty(property.id, {
        check_in_time: checkInTime.trim() || null,
        check_out_time: checkOutTime.trim() || null,
        tier_deliverables: mergePropertyEditExtras(property.tier_deliverables, extras),
      });
      Alert.alert(t('propertyOnboarding.savedTitle'), t('hostEditProperty.cleaningSaved'));
    } catch {
      Alert.alert(t('common.error'), t('propertyOnboarding.saveErrorMessage'));
    } finally {
      setSavingCleaning(false);
    }
  };

  const handlePickImages = async () => {
    if (!property?.id || !user?.id) return;
    const approvedCount = property.images?.length ?? 0;
    const pendingCount = pendingMedia.filter((m) => m.type === 'image').length;
    const maxPhotos = PropertiesService.maxPhotosPerProperty;
    if (approvedCount + pendingCount >= maxPhotos) {
      Alert.alert(
        t('propertyOnboarding.photoLimitTitle'),
        t('propertyOnboarding.photoLimitMessage', { max: maxPhotos })
      );
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('propertyOnboarding.galleryPermissionTitle'),
        t('propertyOnboarding.galleryPermissionPhotosMessage')
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploadingPhoto(true);
    try {
      const slotsLeft = maxPhotos - approvedCount - pendingCount;
      for (const asset of result.assets.slice(0, slotsLeft)) {
        await PropertiesService.uploadPropertyImage(
          property.id,
          user.id,
          asset.uri,
          asset.base64 ?? null
        );
      }
      const list = await PropertiesService.getPendingPropertyMedia(property.id);
      setPendingMedia(list);
    } catch (e: unknown) {
      Alert.alert(
        t('common.error'),
        (e as Error)?.message ?? t('propertyOnboarding.uploadPhotosFallbackError')
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemoveApprovedImage = (uri: string) => {
    if (!property?.id) return;
    Alert.alert(
      t('propertyOnboarding.removePhotoTitle'),
      t('propertyOnboarding.removePhotoApprovedMessage'),
      [
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
            } catch {
              Alert.alert(t('common.error'), t('propertyOnboarding.removePhotoError'));
            }
          },
        },
      ]
    );
  };

  const handleRemovePendingImage = (media: PropertyMediaRow) => {
    Alert.alert(
      t('propertyOnboarding.removePhotoTitle'),
      t('propertyOnboarding.removePhotoPendingMessage'),
      [
        { text: t('propertyOnboarding.removePhotoCancel'), style: 'cancel' },
        {
          text: t('propertyOnboarding.removePhotoConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await PropertiesService.deletePendingPropertyMedia(media.id);
              setPendingMedia((prev) => prev.filter((m) => m.id !== media.id));
            } catch {
              Alert.alert(t('common.error'), t('propertyOnboarding.removePhotoError'));
            }
          },
        },
      ]
    );
  };

  const toggleAmenity = (key: string) => {
    setAmenities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const addCustomAmenity = () => {
    const value = customAmenityInput.trim();
    if (!value) return;
    if (!customAmenities.includes(value)) {
      setCustomAmenities((prev) => [...prev, value]);
    }
    setCustomAmenityInput('');
  };

  const removeCustomAmenity = (value: string) => {
    setCustomAmenities((prev) => prev.filter((a) => a !== value));
    setAmenities((prev) => prev.filter((a) => a !== value));
  };

  const toggleSharedArea = (key: string) => {
    setSharedAreas((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const addRoom = () => {
    const name = roomName.trim();
    const beds = parseInt(roomBeds, 10);
    if (!name || Number.isNaN(beds) || beds < 1) return;
    setRooms((prev) => [...prev, { name, beds, type: roomType.trim() || undefined }]);
    setRoomName('');
    setRoomBeds('1');
    setRoomType('');
  };

  const openPropertyTypePicker = () => {
    Alert.alert(
      t('hostEditProperty.propertyType'),
      undefined,
      [
        ...EDIT_PROPERTY_TYPES.map((type) => ({
          text: t(`hostEditProperty.types.${type}`),
          onPress: () => setPropertyType(type),
        })),
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const approvedImages = property?.images ?? [];
  const pendingImages = pendingMedia.filter((m) => m.type === 'image');
  const imageCount = approvedImages.length + pendingImages.length;
  const maxPhotos = PropertiesService.maxPhotosPerProperty;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
      </View>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={{ color: secondary }}>{t('propertyOnboarding.notFound')}</Text>
          <TouchableOpacity onPress={goBackToProperties} style={styles.backBtnInline}>
            <Text style={{ color: theme.colors.primary.blue }}>{t('hostEditProperty.backToProperties')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const inputStyle = [styles.input, { backgroundColor: inputBg, borderColor, color: textColor }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.pageHeader, { borderBottomColor: borderColor }]}>
        <View style={styles.pageHeaderText}>
          <Text style={[styles.pageTitle, { color: textColor }]}>{t('hostEditProperty.title')}</Text>
          <Text style={[styles.pageSubtitle, { color: secondary }]}>{t('hostEditProperty.subtitle')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor }]}
          onPress={goBackToProperties}
          activeOpacity={0.7}
        >
          <Text style={[styles.backBtnText, { color: textColor }]}>{t('hostEditProperty.backToProperties')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionCard
          title={t('hostEditProperty.basicInfo')}
          subtitle={t('hostEditProperty.basicInfoDesc')}
          cardBg={cardBg}
          borderColor={borderColor}
          textColor={textColor}
          secondary={secondary}
        >
          <FormLabel label={t('hostEditProperty.propertyName')} required color={textColor} secondary={secondary} />
          <TextInput
            style={inputStyle}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={secondary}
          />

          <FormLabel label={t('properties.description')} color={textColor} secondary={secondary} />
          <TextInput
            style={[styles.textArea, { backgroundColor: inputBg, borderColor, color: textColor }]}
            value={description}
            onChangeText={(v) => setDescription(v.slice(0, DESCRIPTION_MAX_LENGTH))}
            multiline
            textAlignVertical="top"
            placeholderTextColor={secondary}
          />
          <Text style={[styles.charCount, { color: secondary }]}>
            {description.length}/{DESCRIPTION_MAX_LENGTH}
          </Text>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <FormLabel label={t('hostEditProperty.propertyType')} required color={textColor} secondary={secondary} />
              <TouchableOpacity style={inputStyle} onPress={openPropertyTypePicker} activeOpacity={0.7}>
                <Text style={{ color: textColor }}>{t(`hostEditProperty.types.${propertyType}`)}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.halfField}>
              <FormLabel label={t('hostEditProperty.pricePerNight')} required color={textColor} secondary={secondary} />
              <TextInput
                style={inputStyle}
                value={basePrice}
                onChangeText={setBasePrice}
                keyboardType="decimal-pad"
                placeholderTextColor={secondary}
              />
            </View>
          </View>

          <FormLabel label={t('hostEditProperty.addressSearch')} color={textColor} secondary={secondary} />
          <TextInput
            style={inputStyle}
            value={addressSearch}
            onChangeText={setAddressSearch}
            placeholder={t('hostEditProperty.addressSearchPlaceholder')}
            placeholderTextColor={secondary}
          />

          <FormLabel label={t('hostEditProperty.street')} required color={textColor} secondary={secondary} />
          <TextInput style={inputStyle} value={street} onChangeText={setStreet} placeholderTextColor={secondary} />

          <FormLabel label={t('hostEditProperty.streetNumber')} color={textColor} secondary={secondary} />
          <TextInput
            style={inputStyle}
            value={streetNumber}
            onChangeText={setStreetNumber}
            placeholder={t('hostEditProperty.streetNumberPlaceholder')}
            placeholderTextColor={secondary}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <FormLabel label={t('propertyOnboarding.step2City')} required color={textColor} secondary={secondary} />
              <TextInput style={inputStyle} value={city} onChangeText={setCity} placeholderTextColor={secondary} />
            </View>
            <View style={styles.halfField}>
              <FormLabel label={t('propertyOnboarding.step2Country')} required color={textColor} secondary={secondary} />
              <TextInput
                style={inputStyle}
                value={country}
                onChangeText={(v) => setCountry(v.toUpperCase())}
                placeholderTextColor={secondary}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <FormLabel label={t('hostEditProperty.nearestAirport')} color={textColor} secondary={secondary} />
          <TextInput
            style={inputStyle}
            value={nearestAirport}
            onChangeText={(v) => setNearestAirport(v.toUpperCase())}
            placeholder={t('hostEditProperty.nearestAirportPlaceholder')}
            placeholderTextColor={secondary}
            maxLength={3}
            autoCapitalize="characters"
          />
          <Text style={[styles.fieldHint, { color: secondary }]}>{t('hostEditProperty.nearestAirportHint')}</Text>

          <View style={styles.mapRow}>
            <View style={styles.mapRowText}>
              <FormLabel label={t('hostEditProperty.positionOnMap')} required color={textColor} secondary={secondary} />
              <Text style={[styles.coordsText, { color: secondary }]}>
                {t('hostEditProperty.currentCoords', { lat: latitude, lng: longitude })}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.mapBtn, { borderColor }]}
              onPress={() => setMapModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={14} color={textColor} />
              <Text style={[styles.mapBtnText, { color: textColor }]}>{t('hostEditProperty.repositionOnMap')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={styles.thirdField}>
              <FormLabel label={t('hostEditProperty.maxGuests')} required color={textColor} secondary={secondary} />
              <TextInput
                style={inputStyle}
                value={maxGuests}
                onChangeText={setMaxGuests}
                keyboardType="number-pad"
                placeholderTextColor={secondary}
              />
            </View>
            <View style={styles.thirdField}>
              <FormLabel label={t('propertyOnboarding.bedrooms')} color={textColor} secondary={secondary} />
              <TextInput
                style={inputStyle}
                value={bedrooms}
                onChangeText={setBedrooms}
                keyboardType="number-pad"
                placeholderTextColor={secondary}
              />
            </View>
            <View style={styles.thirdField}>
              <FormLabel label={t('hostEditProperty.bathrooms')} color={textColor} secondary={secondary} />
              <TextInput
                style={inputStyle}
                value={bathrooms}
                onChangeText={setBathrooms}
                keyboardType="number-pad"
                placeholderTextColor={secondary}
              />
            </View>
          </View>

          <Text style={[styles.subsectionTitle, { color: textColor }]}>{t('hostEditProperty.propertyImages')}</Text>
          <View style={styles.imageActionsRow}>
            <TouchableOpacity
              style={[styles.outlineBtn, { borderColor }]}
              onPress={handlePickImages}
              disabled={uploadingPhoto}
              activeOpacity={0.7}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={theme.colors.primary.blue} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={16} color={textColor} />
                  <Text style={[styles.outlineBtnText, { color: textColor }]}>{t('hostEditProperty.addImages')}</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={[styles.imageCount, { color: secondary }]}>
              {imageCount}/{maxPhotos} {t('hostEditProperty.imagesLabel')}
            </Text>
          </View>
          <Text style={[styles.fieldHint, { color: secondary }]}>{t('hostEditProperty.imagesApprovalHint')}</Text>

          <View style={styles.imageGrid}>
            {approvedImages.map((uri) => (
              <View key={uri} style={styles.imageThumbWrap}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => handleRemoveApprovedImage(uri)}>
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {pendingImages.map((m) => (
              <View key={m.id} style={styles.imageThumbWrap}>
                <Image source={{ uri: m.url }} style={[styles.imageThumb, styles.imagePending]} />
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{t('hostEditProperty.pending')}</Text>
                </View>
                <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => handleRemovePendingImage(m)}>
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={[styles.videoDisabledBox, { borderColor }]}>
            <Text style={[styles.fieldHint, { color: secondary }]}>{t('hostEditProperty.videoDisabled')}</Text>
          </View>

          <Text style={[styles.subsectionTitle, { color: textColor }]}>{t('hostEditProperty.legalDocs')}</Text>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor, alignSelf: 'flex-start' }]}
            onPress={() => Alert.alert(t('hostEditProperty.legalDocs'), t('hostEditProperty.legalDocsSoon'))}
            activeOpacity={0.7}
          >
            <Ionicons name="cloud-upload-outline" size={16} color={textColor} />
            <Text style={[styles.outlineBtnText, { color: textColor }]}>{t('hostEditProperty.uploadPdf')}</Text>
          </TouchableOpacity>
          <Text style={[styles.fieldHint, { color: secondary }]}>{t('hostEditProperty.pdfOnly')}</Text>
        </SectionCard>

        <SectionCard
          title={t('properties.amenities')}
          subtitle={t('hostEditProperty.amenitiesDesc')}
          cardBg={cardBg}
          borderColor={borderColor}
          textColor={textColor}
          secondary={secondary}
        >
          <View style={styles.chipGrid}>
            {EDIT_PROPERTY_AMENITY_KEYS.map((key) => {
              const selected = amenities.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.chip,
                    {
                      borderColor: selected ? theme.colors.primary.blue : borderColor,
                      backgroundColor: selected ? theme.colors.primary.blue : cardBg,
                    },
                  ]}
                  onPress={() => toggleAmenity(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: selected ? '#fff' : textColor }]}>
                    {t(`amenity.${key}`).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {customAmenities.map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.chip, styles.chipSelected, { backgroundColor: theme.colors.primary.blue }]}
                onPress={() => removeCustomAmenity(value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: '#fff' }]}>{value.toUpperCase()}</Text>
                <Ionicons name="close" size={12} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.fieldLabel, { color: textColor, marginTop: 12 }]}>
            {t('hostEditProperty.addCustomAmenity')}
          </Text>
          <View style={styles.customAmenityRow}>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              value={customAmenityInput}
              onChangeText={setCustomAmenityInput}
              placeholder={t('hostEditProperty.customAmenityPlaceholder')}
              placeholderTextColor={secondary}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addCustomAmenity} activeOpacity={0.7}>
              <Text style={styles.addBtnText}>{t('hostEditProperty.add')}</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        <SectionCard
          title={t('hostEditProperty.pets')}
          cardBg={cardBg}
          borderColor={borderColor}
          textColor={textColor}
          secondary={secondary}
        >
          <View style={styles.switchRow}>
            <Switch value={petsAllowed} onValueChange={setPetsAllowed} />
            <Text style={[styles.switchLabel, { color: textColor }]}>{t('hostEditProperty.petsAllowed')}</Text>
          </View>
        </SectionCard>

        <SectionCard
          title={t('hostEditProperty.cleaning')}
          cardBg={cardBg}
          borderColor={borderColor}
          textColor={textColor}
          secondary={secondary}
        >
          <View style={styles.row}>
            <View style={styles.halfField}>
              <FormLabel label={t('hostEditProperty.cleaningFee')} color={textColor} secondary={secondary} />
              <TextInput
                style={inputStyle}
                value={cleaningFee}
                onChangeText={setCleaningFee}
                keyboardType="decimal-pad"
                placeholder={t('hostEditProperty.cleaningFeePlaceholder')}
                placeholderTextColor={secondary}
              />
            </View>
            <View style={styles.halfField}>
              <FormLabel label={t('hostEditProperty.cleaningEveryDays')} color={textColor} secondary={secondary} />
              <TextInput
                style={inputStyle}
                value={cleaningEveryDays}
                onChangeText={setCleaningEveryDays}
                keyboardType="number-pad"
                placeholder={t('hostEditProperty.cleaningEveryDaysPlaceholder')}
                placeholderTextColor={secondary}
              />
            </View>
          </View>
        </SectionCard>

        <SectionCard
          title={t('hostEditProperty.roomsTitle')}
          subtitle={t('hostEditProperty.roomsDesc')}
          cardBg={cardBg}
          borderColor={borderColor}
          textColor={textColor}
          secondary={secondary}
        >
          {rooms.map((room, index) => (
            <View key={`${room.name}-${index}`} style={[styles.roomRow, { borderColor }]}>
              <Text style={[styles.roomRowText, { color: textColor }]}>
                {room.name} · {room.beds} {t('propertyOnboarding.beds')}
                {room.type ? ` · ${room.type}` : ''}
              </Text>
              <TouchableOpacity onPress={() => setRooms((prev) => prev.filter((_, i) => i !== index))}>
                <Ionicons name="close-circle" size={20} color={secondary} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.roomInputRow}>
            <TextInput
              style={[inputStyle, styles.roomNameInput]}
              value={roomName}
              onChangeText={setRoomName}
              placeholder={t('hostEditProperty.roomNamePlaceholder')}
              placeholderTextColor={secondary}
            />
            <TextInput
              style={[inputStyle, styles.roomBedsInput]}
              value={roomBeds}
              onChangeText={setRoomBeds}
              keyboardType="number-pad"
              placeholderTextColor={secondary}
            />
            <TextInput
              style={[inputStyle, styles.roomTypeInput]}
              value={roomType}
              onChangeText={setRoomType}
              placeholder={t('hostEditProperty.roomTypePlaceholder')}
              placeholderTextColor={secondary}
            />
            <TouchableOpacity style={styles.addRoomBtn} onPress={addRoom} activeOpacity={0.7}>
              <Text style={styles.addRoomBtnText}>{t('hostEditProperty.addRoom')}</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        <SectionCard
          title={t('hostEditProperty.sharedAreas')}
          subtitle={t('hostEditProperty.sharedAreasDesc')}
          cardBg={cardBg}
          borderColor={borderColor}
          textColor={textColor}
          secondary={secondary}
        >
          <View style={styles.chipGrid}>
            {EDIT_PROPERTY_SHARED_AREAS.map((key) => {
              const selected = sharedAreas.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.chip,
                    {
                      borderColor: selected ? theme.colors.primary.blue : borderColor,
                      backgroundColor: selected ? theme.colors.primary.blue : cardBg,
                    },
                  ]}
                  onPress={() => toggleSharedArea(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: selected ? '#fff' : textColor }]}>
                    {t(`hostEditProperty.sharedAreasList.${key}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>

        <View style={[styles.switchRow, styles.activeRow, { borderColor, backgroundColor: cardBg }]}>
          <Switch value={isActive} onValueChange={setIsActive} />
          <Text style={[styles.switchLabel, { color: textColor }]}>{t('hostEditProperty.propertyActive')}</Text>
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveProperty}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{t('hostEditProperty.saveChanges')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor }]}
            onPress={goBackToProperties}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelBtnText, { color: textColor }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>

        <SectionCard
          title={t('hostEditProperty.cleaningTurnoverTitle')}
          subtitle={t('hostEditProperty.cleaningTurnoverDesc')}
          cardBg={cardBg}
          borderColor={borderColor}
          textColor={textColor}
          secondary={secondary}
        >
          <View style={styles.row}>
            <View style={styles.halfField}>
              <FormLabel label={t('hostEditProperty.checkInDefault')} color={textColor} secondary={secondary} />
              <TextInput style={inputStyle} value={checkInTime} onChangeText={setCheckInTime} placeholderTextColor={secondary} />
            </View>
            <View style={styles.halfField}>
              <FormLabel label={t('hostEditProperty.checkOutDefault')} color={textColor} secondary={secondary} />
              <TextInput style={inputStyle} value={checkOutTime} onChangeText={setCheckOutTime} placeholderTextColor={secondary} />
            </View>
          </View>
          <FormLabel label={t('hostEditProperty.timezone')} color={textColor} secondary={secondary} />
          <TextInput style={inputStyle} value={cleaningTimezone} onChangeText={setCleaningTimezone} placeholderTextColor={secondary} />
          <View style={styles.row}>
            <View style={styles.halfField}>
              <FormLabel label={t('hostEditProperty.cleaningFee')} color={textColor} secondary={secondary} />
              <TextInput
                style={inputStyle}
                value={cleaningFee}
                onChangeText={setCleaningFee}
                keyboardType="decimal-pad"
                placeholderTextColor={secondary}
              />
            </View>
            <View style={styles.halfField}>
              <FormLabel label={t('hostEditProperty.hoursAfterCheckout')} color={textColor} secondary={secondary} />
              <TextInput
                style={inputStyle}
                value={cleaningHoursAfterCheckout}
                onChangeText={setCleaningHoursAfterCheckout}
                keyboardType="number-pad"
                placeholderTextColor={secondary}
              />
            </View>
          </View>
          <FormLabel label={t('hostEditProperty.floorAccess')} color={textColor} secondary={secondary} />
          <TextInput
            style={[styles.textArea, { backgroundColor: inputBg, borderColor, color: textColor }]}
            value={floorAccess}
            onChangeText={setFloorAccess}
            multiline
            textAlignVertical="top"
            placeholder={t('hostEditProperty.floorAccessPlaceholder')}
            placeholderTextColor={secondary}
          />
          <FormLabel label={t('hostEditProperty.keyboxCodes')} color={textColor} secondary={secondary} />
          <TextInput
            style={[styles.textArea, { backgroundColor: inputBg, borderColor, color: textColor }]}
            value={keyboxCodes}
            onChangeText={setKeyboxCodes}
            multiline
            textAlignVertical="top"
            placeholder={t('hostEditProperty.keyboxCodesPlaceholder')}
            placeholderTextColor={secondary}
          />
          <TouchableOpacity
            style={[styles.saveBtn, { marginTop: 12 }]}
            onPress={handleSaveCleaning}
            disabled={savingCleaning}
            activeOpacity={0.8}
          >
            {savingCleaning ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{t('hostEditProperty.saveCleaningSettings')}</Text>
            )}
          </TouchableOpacity>
        </SectionCard>
      </ScrollView>

      <Modal visible={mapModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>{t('hostEditProperty.repositionOnMap')}</Text>
            <FormLabel label={t('hostEditProperty.latitude')} color={textColor} secondary={secondary} />
            <TextInput style={inputStyle} value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" />
            <FormLabel label={t('hostEditProperty.longitude')} color={textColor} secondary={secondary} />
            <TextInput style={inputStyle} value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor, flex: 1 }]} onPress={() => setMapModalVisible(false)}>
                <Text style={[styles.cancelBtnText, { color: textColor }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={() => setMapModalVisible(false)}>
                <Text style={styles.saveBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageHeader: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  pageHeaderText: { flex: 1 },
  pageTitle: {
    ...theme.typography.title2,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pageSubtitle: {
    ...theme.typography.caption2,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  backBtn: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 130,
  },
  backBtnText: {
    ...theme.typography.caption2,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  backBtnInline: { marginTop: 16 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: theme.spacing.screenPadding,
    paddingBottom: 120,
    gap: theme.spacing.md,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: 10,
  },
  sectionCardTitle: {
    ...theme.typography.headline,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionCardSubtitle: {
    ...theme.typography.caption2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subsectionTitle: {
    ...theme.typography.subheadline,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 8,
    letterSpacing: 0.4,
  },
  fieldLabel: {
    ...theme.typography.caption1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 4,
  },
  fieldHint: {
    ...theme.typography.caption2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...theme.typography.body,
  },
  textArea: { minHeight: 90 },
  charCount: { alignSelf: 'flex-end', ...theme.typography.caption2 },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  thirdField: { flex: 1 },
  mapRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  mapRowText: { flex: 1 },
  coordsText: { ...theme.typography.caption2, textTransform: 'uppercase' },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  mapBtnText: { ...theme.typography.caption2, fontWeight: '600', textTransform: 'uppercase' },
  imageActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  outlineBtnText: { ...theme.typography.caption1, fontWeight: '600', textTransform: 'uppercase' },
  imageCount: { ...theme.typography.caption2, textTransform: 'uppercase' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageThumbWrap: { width: 88, height: 88, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  imageThumb: { width: '100%', height: '100%' },
  imagePending: { opacity: 0.75 },
  imageRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: theme.colors.primary.blue,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  pendingBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  videoDisabledBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginTop: 4,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: { borderColor: theme.colors.primary.blue },
  chipText: { ...theme.typography.caption2, fontWeight: '600' },
  customAmenityRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addBtn: {
    backgroundColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addBtnText: { color: '#fff', fontWeight: '700', textTransform: 'uppercase' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchLabel: { ...theme.typography.subheadline, fontWeight: '600', textTransform: 'uppercase', flex: 1 },
  activeRow: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  roomRowText: { ...theme.typography.subheadline, flex: 1 },
  roomInputRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  roomNameInput: { flex: 1, minWidth: 100 },
  roomBedsInput: { width: 56 },
  roomTypeInput: { flex: 1, minWidth: 80 },
  addRoomBtn: {
    borderWidth: 1,
    borderColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  addRoomBtnText: { color: theme.colors.primary.blue, fontWeight: '700', textTransform: 'uppercase' },
  footerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  saveBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', textTransform: 'uppercase' },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontWeight: '600', textTransform: 'uppercase' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: theme.spacing.screenPadding,
  },
  modalBox: { borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, gap: 8 },
  modalTitle: { ...theme.typography.headline, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
