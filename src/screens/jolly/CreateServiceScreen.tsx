/**
 * Create Service Screen (Jolly)
 * Form that matches the web "Nuovo servizio" layout.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Button, Input } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import type { ProfileScreenProps } from '../../types/navigation';
import { JollyLocalServicesService, type LocalJollyAvailability, type LocalJollyServiceType } from '../../services/jollyLocalServices.service';
import { useAuth } from '../../contexts/AuthContext';

type ServiceType = LocalJollyServiceType;
type Availability = LocalJollyAvailability;
type PickedUpload = { uri: string };

const ENABLED_SCREENSHOT_TYPES: ServiceType[] = [
  'restaurant',
  'photography',
  'video',
  'social_media',
  'maintenance',
  'concierge',
  'translation',
  'cleaning',
  'shuttle_service',
  'property_management',
  'supplier',
  'pharmacist',
  'excursions',
];

function toKey(val: string) {
  return val.trim().toLowerCase();
}

export default function CreateServiceScreen({ navigation }: ProfileScreenProps<'CreateService'>) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.07)' : '#fff';
  const softBg = isDark ? 'rgba(255,255,255,0.06)' : '#F6F7FB';
  const borderSoft = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const serviceTypeOptions = useMemo(
    () =>
      ([
        'restaurant',
        'photography',
        'video',
        'social_media',
        'maintenance',
        'concierge',
        'translation',
        'cleaning',
        'property_management',
        'shuttle_service',
        'supplier',
        'pharmacist',
        'excursions',
        'home_products',
      ] as ServiceType[]).map((value) => ({
        value,
        label: t(`createService.serviceType.${value}`),
      })),
    [t]
  );

  const availabilityOptions = useMemo(
    () =>
      (['flexible', 'seasonal', 'full_time'] as Availability[]).map((value) => ({
        value,
        label: t(`createService.availability.${value}`),
      })),
    [t]
  );

  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [availability, setAvailability] = useState<Availability>('flexible');
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [pricePerService, setPricePerService] = useState('');
  const [restaurantMenuImage, setRestaurantMenuImage] = useState<PickedUpload | null>(null);

  const [cityDraft, setCityDraft] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [countryDraft, setCountryDraft] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const [selectOpen, setSelectOpen] = useState<null | 'serviceType' | 'availability' | 'vehicleType' | 'time'>(null);
  const [activeTimeKey, setActiveTimeKey] = useState<string | null>(null);

  // Cleaning extras
  const [yearsExperience, setYearsExperience] = useState('');

  // Shuttle extras
  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<PickedUpload | null>(null);
  const [priceLt50, setPriceLt50] = useState('');
  const [price50to100, setPrice50to100] = useState('');
  const [price100to200, setPrice100to200] = useState('');
  const [priceGt200, setPriceGt200] = useState('');

  // Property management extras
  const PM_SKILLS = useMemo(
    () => [
      'booking_management',
      'cleaning_maintenance',
      'checkin_checkout',
      'guest_communication',
      'marketing_promotion',
      'accounting_invoicing',
      'emergency_management',
      'supplier_relations',
      'preventive_maintenance',
      'reviews_management',
    ] as const,
    []
  );
  const [commissionPercent, setCommissionPercent] = useState('');
  const [pmSkills, setPmSkills] = useState<string[]>([]);

  // Supplier & Pharmacist extras (place info)
  const [fullAddress, setFullAddress] = useState('');
  const [placeCity, setPlaceCity] = useState('');
  const [placeCountry, setPlaceCountry] = useState('');

  // Pharmacist extras (opening hours)
  type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const EXCURSION_DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const [hours, setHours] = useState<Record<DayKey, { open: boolean; start: string; end: string }>>({
    mon: { open: true, start: '09:00 AM', end: '07:00 PM' },
    tue: { open: true, start: '09:00 AM', end: '07:00 PM' },
    wed: { open: true, start: '09:00 AM', end: '07:00 PM' },
    thu: { open: true, start: '09:00 AM', end: '07:00 PM' },
    fri: { open: true, start: '09:00 AM', end: '07:00 PM' },
    sat: { open: true, start: '09:00 AM', end: '07:00 PM' },
    sun: { open: true, start: '09:00 AM', end: '07:00 PM' },
  });

  const vehicleOptions = useMemo(
    () =>
      (['car', 'van', 'minivan', 'suv', 'motorcycle', 'bicycle'] as const).map((v) => ({
        value: v,
        label: t(`createService.vehicleType.${v}`),
      })),
    [t]
  );

  const timeOptions = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour12 = ((h + 11) % 12) + 1;
        const ampm = h < 12 ? 'AM' : 'PM';
        const mm = m === 0 ? '00' : String(m);
        const label = `${String(hour12).padStart(2, '0')}:${mm} ${ampm}`;
        out.push({ value: label, label });
      }
    }
    return out;
  }, []);

  // Excursions (boat tour vs quad tour — boat_excursions merged into excursions)
  const [excursionExperience, setExcursionExperience] = useState<'boat_tour' | 'quad_tour'>('boat_tour');
  const [excursionPhoto, setExcursionPhoto] = useState<PickedUpload | null>(null);
  const [pricePerDay, setPricePerDay] = useState('');
  const [excursionAvailability, setExcursionAvailability] = useState<Record<DayKey, { selected: boolean; hours: string }>>({
    sun: { selected: false, hours: '' },
    mon: { selected: false, hours: '' },
    tue: { selected: false, hours: '' },
    wed: { selected: false, hours: '' },
    thu: { selected: false, hours: '' },
    fri: { selected: false, hours: '' },
    sat: { selected: false, hours: '' },
  });

  const isScreenshotType = serviceType ? ENABLED_SCREENSHOT_TYPES.includes(serviceType) : false;

  const addUnique = (list: string[], raw: string) => {
    const v = raw.trim();
    if (!v) return list;
    const key = toKey(v);
    if (list.some((x) => toKey(x) === key)) return list;
    return [...list, v];
  };

  const removeAt = (list: string[], idx: number) => list.filter((_, i) => i !== idx);

  const toggleExcursionDay = (day: DayKey) => {
    setExcursionAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], selected: !prev[day].selected },
    }));
  };

  const pickUploadImage = async (onPicked: (asset: PickedUpload) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.photoPermissionTitle'), t('common.photoPermissionMessage'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onPicked({ uri: result.assets[0].uri });
    }
  };

  const handleCreate = async () => {
    if (!user?.id) return;
    if (isCreating) return;
    if (!serviceType) {
      Alert.alert(t('common.error'), t('createService.errors.serviceTypeRequired'));
      return;
    }
    if (!isScreenshotType) {
      Alert.alert(t('createService.title'), t('createService.comingSoonType'));
      return;
    }
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('createService.errors.titleRequired'));
      return;
    }
    try {
      setIsCreating(true);
      const computedSkills =
        serviceType === 'excursions'
          ? []
          : serviceType === 'property_management'
          ? pmSkills.map((k) => t(`createService.pmSkills.${k}`))
          : skills;

      const extras: Record<string, unknown> = {};
      if (serviceType === 'cleaning') {
        extras.years_experience = JollyLocalServicesService.parseNumber(yearsExperience);
      }
      if (serviceType === 'shuttle_service') {
        extras.vehicle_type = vehicleType;
        extras.distance_prices = {
          lt_50_km: JollyLocalServicesService.parseNumber(priceLt50),
          km_50_100: JollyLocalServicesService.parseNumber(price50to100),
          km_100_200: JollyLocalServicesService.parseNumber(price100to200),
          gt_200_km: JollyLocalServicesService.parseNumber(priceGt200),
        };
      }
      if (serviceType === 'property_management') {
        extras.commission_percent = JollyLocalServicesService.parseNumber(commissionPercent);
        extras.skills_keys = pmSkills;
      }
      if (serviceType === 'supplier' || serviceType === 'pharmacist') {
        extras.place = { address: fullAddress.trim(), city: placeCity.trim(), country: placeCountry.trim() };
      }
      if (serviceType === 'pharmacist') {
        extras.opening_hours = hours;
      }
      if (serviceType === 'excursions') {
        extras.experience_type = excursionExperience;
        extras.price_per_day = JollyLocalServicesService.parseNumber(pricePerDay);
        extras.availability_by_day = excursionAvailability;
      }

      const createdService = await JollyLocalServicesService.create(user.id, {
        is_active: true,
        service_type: serviceType,
        availability,
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        price_per_hour:
          serviceType === 'excursions' || serviceType === 'cleaning'
            ? null
            : JollyLocalServicesService.parseNumber(pricePerHour),
        price_per_service:
          serviceType === 'excursions' || serviceType === 'cleaning'
            ? null
            : JollyLocalServicesService.parseNumber(pricePerService),
        cities,
        countries,
        skills: computedSkills,
        extras,
      });

      const uploads: Promise<unknown>[] = [];
      if (serviceType === 'restaurant' && restaurantMenuImage?.uri) {
        uploads.push(JollyLocalServicesService.uploadRestaurantMenuImage(user.id, createdService.id, restaurantMenuImage.uri));
      }
      if (serviceType === 'shuttle_service' && vehiclePhoto?.uri) {
        uploads.push(JollyLocalServicesService.uploadServiceImage(user.id, createdService.id, 'vehicle_photo', vehiclePhoto.uri));
      }
      if (serviceType === 'excursions' && excursionPhoto?.uri) {
        uploads.push(
          JollyLocalServicesService.uploadServiceImage(
            user.id,
            createdService.id,
            excursionExperience === 'boat_tour' ? 'boat_photo' : 'quad_photo',
            excursionPhoto.uri
          )
        );
      }
      if (uploads.length > 0) {
        await Promise.all(uploads);
      }

      Alert.alert(
        t('common.success'),
        uploads.length > 0 ? t('createService.createdWithPendingMedia') : t('createService.created')
      );
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error)?.message ?? t('common.error'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('createService.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: secondary }]} numberOfLines={1}>
            {t('createService.subtitle')}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderSoft }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>{t('createService.sectionTitle')}</Text>
            <Text style={[styles.cardSubtitle, { color: secondary }]}>{t('createService.sectionSubtitle')}</Text>

            <View style={styles.row2}>
              <SelectField
                label={t('createService.fields.serviceType')}
                valueLabel={
                  serviceType
                    ? t(`createService.serviceType.${serviceType}`)
                    : t('createService.placeholders.selectServiceType')
                }
                onPress={() => setSelectOpen('serviceType')}
              />
              <SelectField
                label={t('createService.fields.availability')}
                valueLabel={t(`createService.availability.${availability}`)}
                onPress={() => setSelectOpen('availability')}
              />
            </View>

            {serviceType && !isScreenshotType ? (
              <View style={[styles.infoBox, { backgroundColor: softBg, borderColor: borderSoft }]}>
                <Ionicons name="information-circle-outline" size={18} color={secondary} />
                <Text style={[styles.infoText, { color: secondary }]}>
                  {t('createService.comingSoonForType', { type: t(`createService.serviceType.${serviceType}`) })}
                </Text>
              </View>
            ) : null}

            {isScreenshotType ? (
              <>
                <Input
                  label={t('createService.fields.serviceTitle')}
                  placeholder={t('createService.placeholders.serviceTitle')}
                  value={title}
                  onChangeText={setTitle}
                />
                <Input
                  label={t('createService.fields.description')}
                  placeholder={t('createService.placeholders.description')}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  style={styles.textarea}
                />

                {serviceType === 'restaurant' ? (
                  <View style={[styles.excursionUploadCard, { backgroundColor: softBg, borderColor: theme.colors.primary.blue }]}>
                    <Text style={[styles.excursionUploadTitle, { color: textColor }]}>
                      {t('createService.restaurant.menuUploadTitle')}
                    </Text>
                    <Text style={[styles.excursionUploadBody, { color: secondary }]}>
                      {t('createService.restaurant.menuUploadBody')}
                    </Text>
                    <View style={styles.excursionUploadRow}>
                      <View style={[styles.excursionUploadPreview, { borderColor: borderSoft }]}>
                        {restaurantMenuImage ? (
                          <Image source={{ uri: restaurantMenuImage.uri }} style={styles.uploadPreviewImage} />
                        ) : (
                          <Ionicons name="document-text-outline" size={28} color={secondary} />
                        )}
                      </View>
                      <TouchableOpacity
                        style={[styles.excursionUploadButton, { backgroundColor: cardBg, borderColor: borderSoft }]}
                        onPress={() => pickUploadImage(setRestaurantMenuImage)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="document-attach-outline" size={16} color={secondary} />
                        <Text style={[styles.excursionUploadButtonText, { color: textColor }]}>
                          {restaurantMenuImage ? t('createService.uploads.changeImage') : t('createService.restaurant.uploadMenu')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {restaurantMenuImage ? (
                      <Text style={[styles.uploadSelectedText, { color: secondary }]}>{t('createService.uploads.pendingAfterCreate')}</Text>
                    ) : null}
                  </View>
                ) : null}

                {serviceType === 'excursions' ? (
                  <>
                    <Text style={[styles.fieldLabel, { color: secondary }]}>{t('createService.excursions.experienceType')}</Text>
                    <View style={styles.segmentRow}>
                      <TouchableOpacity
                        style={[
                          styles.segmentBtn,
                          { borderColor: borderSoft, backgroundColor: excursionExperience === 'boat_tour' ? theme.colors.primary.blue : softBg },
                        ]}
                        onPress={() => {
                          if (excursionExperience === 'boat_tour') return;
                          setExcursionExperience('boat_tour');
                          setExcursionPhoto(null);
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.segmentText, { color: excursionExperience === 'boat_tour' ? '#fff' : textColor }]}>
                          {t('createService.excursions.boatTour')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.segmentBtn,
                          { borderColor: borderSoft, backgroundColor: excursionExperience === 'quad_tour' ? theme.colors.primary.blue : softBg },
                        ]}
                        onPress={() => {
                          if (excursionExperience === 'quad_tour') return;
                          setExcursionExperience('quad_tour');
                          setExcursionPhoto(null);
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.segmentText, { color: excursionExperience === 'quad_tour' ? '#fff' : textColor }]}>
                          {t('createService.excursions.quadTour')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.excursionUploadCard, { backgroundColor: softBg, borderColor: theme.colors.primary.blue }]}>
                      <Text style={[styles.excursionUploadTitle, { color: textColor }]}>
                        {excursionExperience === 'boat_tour'
                          ? t('createService.excursions.boatPhotoTitle')
                          : t('createService.excursions.quadPhotoTitle')}
                      </Text>
                      <Text style={[styles.excursionUploadBody, { color: secondary }]}>
                        {excursionExperience === 'boat_tour'
                          ? t('createService.excursions.boatPhotoBody')
                          : t('createService.excursions.quadPhotoBody')}
                      </Text>
                      <View style={styles.excursionUploadRow}>
                        <View style={[styles.excursionUploadPreview, { borderColor: borderSoft }]}>
                          {excursionPhoto ? (
                            <Image source={{ uri: excursionPhoto.uri }} style={styles.uploadPreviewImage} />
                          ) : (
                            <Ionicons name="image-outline" size={26} color={secondary} />
                          )}
                        </View>
                        <TouchableOpacity
                          style={[styles.excursionUploadButton, { backgroundColor: cardBg, borderColor: borderSoft }]}
                          onPress={() => pickUploadImage(setExcursionPhoto)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="image-outline" size={16} color={secondary} />
                          <Text style={[styles.excursionUploadButtonText, { color: textColor }]}>
                            {excursionPhoto ? t('createService.uploads.changeImage') : t('createService.excursions.uploadImage')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {excursionPhoto ? (
                        <Text style={[styles.uploadSelectedText, { color: secondary }]}>{t('createService.uploads.pendingAfterCreate')}</Text>
                      ) : null}
                    </View>
                    <Input
                      label={t('createService.excursions.pricePerDay')}
                      placeholder={t('createService.excursions.pricePerDayPlaceholder')}
                      value={pricePerDay}
                      onChangeText={setPricePerDay}
                      keyboardType="decimal-pad"
                    />
                    <Text style={[styles.fieldLabel, { color: secondary }]}>{t('createService.excursions.availabilityTitle')}</Text>
                    <Text style={[styles.excursionAvailabilityHint, { color: secondary }]}>
                      {t('createService.excursions.availabilitySubtitle')}
                    </Text>
                    <View style={styles.excursionAvailabilityList}>
                      {EXCURSION_DAY_KEYS.map((day) => {
                        const item = excursionAvailability[day];
                        return (
                          <View key={day} style={[styles.excursionDayCard, { borderColor: borderSoft, backgroundColor: softBg }]}>
                            <TouchableOpacity
                              style={styles.excursionDayToggle}
                              activeOpacity={0.8}
                              onPress={() => toggleExcursionDay(day)}
                            >
                              <View
                                style={[
                                  styles.pmCheckbox,
                                  {
                                    borderColor: borderSoft,
                                    backgroundColor: item.selected ? theme.colors.primary.blue : 'transparent',
                                  },
                                ]}
                              >
                                {item.selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                              </View>
                              <Text style={[styles.excursionDayLabel, { color: textColor }]}>
                                {t(`createService.days.${day}`)}
                              </Text>
                            </TouchableOpacity>
                            {item.selected ? (
                              <Input
                                label={t('createService.excursions.dayHours', { day: t(`createService.days.${day}`) })}
                                placeholder={t('createService.excursions.dayHoursPlaceholder')}
                                value={item.hours}
                                onChangeText={(value) =>
                                  setExcursionAvailability((prev) => ({
                                    ...prev,
                                    [day]: { ...prev[day], hours: value },
                                  }))
                                }
                                containerStyle={styles.excursionDayInput}
                              />
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  </>
                ) : serviceType !== 'cleaning' ? (
                  <View style={styles.row2}>
                    <Input
                      label={t('createService.fields.pricePerHour')}
                      placeholder="0.00"
                      value={pricePerHour}
                      onChangeText={setPricePerHour}
                      keyboardType="decimal-pad"
                    />
                    <Input
                      label={t('createService.fields.pricePerService')}
                      placeholder="0.00"
                      value={pricePerService}
                      onChangeText={setPricePerService}
                      keyboardType="decimal-pad"
                    />
                  </View>
                ) : null}

                {serviceType === 'cleaning' ? (
                  <>
                    <View style={[styles.cleaningPriceBox, { backgroundColor: softBg, borderColor: borderSoft }]}>
                      <Text style={[styles.cleaningPriceTitle, { color: textColor }]}>
                        {t('createService.cleaning.platformPriceTitle')}
                      </Text>
                      <Text style={[styles.cleaningPriceBody, { color: secondary }]}>
                        {t('createService.cleaning.platformPriceBody')}
                      </Text>
                    </View>
                    <Input
                      label={t('createService.cleaning.yearsExperience')}
                      placeholder={t('createService.cleaning.yearsExperiencePlaceholder')}
                      value={yearsExperience}
                      onChangeText={setYearsExperience}
                      keyboardType="decimal-pad"
                    />
                  </>
                ) : null}

                {serviceType === 'shuttle_service' ? (
                  <>
                    <SelectField
                      label={t('createService.shuttle.vehicleType')}
                      valueLabel={
                        vehicleType
                          ? t(`createService.vehicleType.${vehicleType}`)
                          : t('createService.shuttle.vehicleTypePlaceholder')
                      }
                      onPress={() => setSelectOpen('vehicleType')}
                    />
                    <View style={[styles.excursionUploadCard, { backgroundColor: softBg, borderColor: theme.colors.primary.blue }]}>
                      <Text style={[styles.excursionUploadTitle, { color: textColor }]}>
                        {t('createService.shuttle.vehiclePhotoTitle')}
                      </Text>
                      <Text style={[styles.excursionUploadBody, { color: secondary }]}>
                        {t('createService.shuttle.vehiclePhotoBody')}
                      </Text>
                      <View style={styles.excursionUploadRow}>
                        <View style={[styles.excursionUploadPreview, { borderColor: borderSoft }]}>
                          {vehiclePhoto ? (
                            <Image source={{ uri: vehiclePhoto.uri }} style={styles.uploadPreviewImage} />
                          ) : (
                            <Ionicons name="image-outline" size={26} color={secondary} />
                          )}
                        </View>
                        <TouchableOpacity
                          style={[styles.excursionUploadButton, { backgroundColor: cardBg, borderColor: borderSoft }]}
                          onPress={() => pickUploadImage(setVehiclePhoto)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="image-outline" size={16} color={secondary} />
                          <Text style={[styles.excursionUploadButtonText, { color: textColor }]}>
                            {vehiclePhoto ? t('createService.uploads.changeImage') : t('createService.shuttle.uploadImage')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {vehiclePhoto ? (
                        <Text style={[styles.uploadSelectedText, { color: secondary }]}>{t('createService.uploads.pendingAfterCreate')}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.fieldLabel, { color: secondary }]}>{t('createService.shuttle.pricePerRoute')}</Text>
                    <Text style={[styles.shuttleHint, { color: secondary }]}>{t('createService.shuttle.pricePerRouteHint')}</Text>
                    <View style={styles.shuttleRow}>
                      <Text style={[styles.shuttleLabel, { color: secondary }]}>{t('createService.shuttle.lt50')}</Text>
                      <View style={styles.shuttleInput}>
                        <Input
                          placeholder="0.00"
                          value={priceLt50}
                          onChangeText={setPriceLt50}
                          keyboardType="decimal-pad"
                          containerStyle={styles.compactInput}
                        />
                      </View>
                    </View>
                    <View style={styles.shuttleRow}>
                      <Text style={[styles.shuttleLabel, { color: secondary }]}>{t('createService.shuttle.km50to100')}</Text>
                      <View style={styles.shuttleInput}>
                        <Input
                          placeholder="0.00"
                          value={price50to100}
                          onChangeText={setPrice50to100}
                          keyboardType="decimal-pad"
                          containerStyle={styles.compactInput}
                        />
                      </View>
                    </View>
                    <View style={styles.shuttleRow}>
                      <Text style={[styles.shuttleLabel, { color: secondary }]}>{t('createService.shuttle.km100to200')}</Text>
                      <View style={styles.shuttleInput}>
                        <Input
                          placeholder="0.00"
                          value={price100to200}
                          onChangeText={setPrice100to200}
                          keyboardType="decimal-pad"
                          containerStyle={styles.compactInput}
                        />
                      </View>
                    </View>
                    <View style={styles.shuttleRow}>
                      <Text style={[styles.shuttleLabel, { color: secondary }]}>{t('createService.shuttle.gt200')}</Text>
                      <View style={styles.shuttleInput}>
                        <Input
                          placeholder="0.00"
                          value={priceGt200}
                          onChangeText={setPriceGt200}
                          keyboardType="decimal-pad"
                          containerStyle={styles.compactInput}
                        />
                      </View>
                    </View>
                  </>
                ) : null}

                {serviceType === 'property_management' ? (
                  <>
                    <Input
                      label={t('createService.pm.commissionPercent')}
                      placeholder="15.00"
                      value={commissionPercent}
                      onChangeText={setCommissionPercent}
                      keyboardType="decimal-pad"
                    />
                    <Text style={[styles.pmHint, { color: secondary }]}>{t('createService.pm.commissionHint')}</Text>

                    <Text style={[styles.fieldLabel, { color: secondary }]}>{t('createService.pm.skillsTitle')}</Text>
                    <Text style={[styles.pmHint, { color: secondary }]}>{t('createService.pm.skillsSubtitle')}</Text>
                    <View style={styles.pmList}>
                      {PM_SKILLS.map((k) => {
                        const checked = pmSkills.includes(k);
                        return (
                          <TouchableOpacity
                            key={k}
                            style={[styles.pmRow, { borderColor: borderSoft, backgroundColor: softBg }]}
                            activeOpacity={0.8}
                            onPress={() => setPmSkills((prev) => (checked ? prev.filter((x) => x !== k) : [...prev, k]))}
                          >
                            <View
                              style={[
                                styles.pmCheckbox,
                                {
                                  borderColor: borderSoft,
                                  backgroundColor: checked ? theme.colors.primary.blue : 'transparent',
                                },
                              ]}
                            >
                              {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                            </View>
                            <Text style={[styles.pmLabel, { color: textColor }]}>{t(`createService.pmSkills.${k}`)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                ) : null}

                {serviceType === 'supplier' || serviceType === 'pharmacist' ? (
                  <>
                    <View style={[styles.catalogBox, { backgroundColor: softBg, borderColor: borderSoft }]}>
                      <Text style={[styles.catalogText, { color: secondary }]}>{t('createService.catalogHint')}</Text>
                    </View>
                    <Text style={[styles.sectionHeading, { color: textColor }]}>{t('createService.place.sectionTitle')}</Text>
                    <Input
                      label={t('createService.place.fullAddress')}
                      placeholder={t('createService.place.fullAddressPlaceholder')}
                      value={fullAddress}
                      onChangeText={setFullAddress}
                    />
                    <View style={styles.row2}>
                      <Input
                        label={t('createService.place.city')}
                        placeholder={t('createService.place.cityPlaceholder')}
                        value={placeCity}
                        onChangeText={setPlaceCity}
                      />
                      <Input
                        label={t('createService.place.country')}
                        placeholder={t('createService.place.countryPlaceholder')}
                        value={placeCountry}
                        onChangeText={setPlaceCountry}
                      />
                    </View>
                  </>
                ) : null}

                {serviceType === 'pharmacist' ? (
                  <>
                    <Text style={[styles.sectionHeading, { color: textColor }]}>{t('createService.pharmacist.openingHours')}</Text>
                    <View style={styles.hoursList}>
                      {DAY_KEYS.map((day) => {
                        const row = hours[day];
                        return (
                          <View key={day} style={styles.hoursRow}>
                            <Text style={[styles.dayText, { color: secondary }]}>{t(`createService.days.${day}`)}</Text>
                            <TouchableOpacity
                              style={styles.openWrap}
                              onPress={() => setHours((prev) => ({ ...prev, [day]: { ...prev[day], open: !prev[day].open } }))}
                              activeOpacity={0.85}
                            >
                              <View
                                style={[
                                  styles.pmCheckbox,
                                  {
                                    borderColor: borderSoft,
                                    backgroundColor: row.open ? theme.colors.primary.blue : 'transparent',
                                  },
                                ]}
                              >
                                {row.open ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                              </View>
                              <Text style={[styles.openText, { color: secondary }]}>{t('createService.pharmacist.open')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.timePill, { borderColor: borderSoft, backgroundColor: softBg }]}
                              onPress={() => {
                                setActiveTimeKey(`${day}.start`);
                                setSelectOpen('time');
                              }}
                              activeOpacity={0.85}
                            >
                              <Text style={[styles.timeText, { color: textColor }]}>{row.start}</Text>
                              <Ionicons name="time-outline" size={14} color={secondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.timePill, { borderColor: borderSoft, backgroundColor: softBg }]}
                              onPress={() => {
                                setActiveTimeKey(`${day}.end`);
                                setSelectOpen('time');
                              }}
                              activeOpacity={0.85}
                            >
                              <Text style={[styles.timeText, { color: textColor }]}>{row.end}</Text>
                              <Ionicons name="time-outline" size={14} color={secondary} />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  </>
                ) : null}

                <AddListField
                  label={t('createService.fields.cities')}
                  placeholder={t('createService.placeholders.addCity')}
                  draft={cityDraft}
                  onDraftChange={setCityDraft}
                  items={cities}
                  addLabel={t('createService.actions.add')}
                  onAdd={() => {
                    setCities((prev) => addUnique(prev, cityDraft));
                    setCityDraft('');
                  }}
                  onRemove={(idx) => setCities((prev) => removeAt(prev, idx))}
                />

                <AddListField
                  label={t('createService.fields.countries')}
                  placeholder={t('createService.placeholders.addCountry')}
                  draft={countryDraft}
                  onDraftChange={setCountryDraft}
                  items={countries}
                  addLabel={t('createService.actions.add')}
                  onAdd={() => {
                    setCountries((prev) => addUnique(prev, countryDraft));
                    setCountryDraft('');
                  }}
                  onRemove={(idx) => setCountries((prev) => removeAt(prev, idx))}
                />

                {serviceType !== 'property_management' && serviceType !== 'excursions' ? (
                  <AddListField
                    label={t('createService.fields.skills')}
                    placeholder={t('createService.placeholders.addSkill')}
                    draft={skillDraft}
                    onDraftChange={setSkillDraft}
                    items={skills}
                    addLabel={t('createService.actions.add')}
                    onAdd={() => {
                      setSkills((prev) => addUnique(prev, skillDraft));
                      setSkillDraft('');
                    }}
                    onRemove={(idx) => setSkills((prev) => removeAt(prev, idx))}
                  />
                ) : null}
              </>
            ) : null}

            <View style={styles.footerRow}>
              <Button
                size="lg"
                style={styles.createBtn}
                onPress={handleCreate}
                disabled={!serviceType || !isScreenshotType || isCreating}
                loading={isCreating}
              >
                {isCreating ? t('createService.actions.creating') : t('createService.actions.create')}
              </Button>
              <Button variant="outline" size="lg" style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                {t('createService.actions.cancel')}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SelectModal
        visible={selectOpen === 'serviceType'}
        title={t('createService.fields.serviceType')}
        onClose={() => setSelectOpen(null)}
        options={serviceTypeOptions}
        selectedValue={serviceType}
        onSelect={(v) => {
          setServiceType(v as ServiceType);
          setSelectOpen(null);
        }}
      />

      <SelectModal
        visible={selectOpen === 'availability'}
        title={t('createService.fields.availability')}
        onClose={() => setSelectOpen(null)}
        options={availabilityOptions}
        selectedValue={availability}
        onSelect={(v) => {
          setAvailability(v as Availability);
          setSelectOpen(null);
        }}
      />

      <SelectModal
        visible={selectOpen === 'vehicleType'}
        title={t('createService.shuttle.vehicleType')}
        onClose={() => setSelectOpen(null)}
        options={vehicleOptions as any}
        selectedValue={vehicleType as any}
        onSelect={(v) => {
          setVehicleType(v as any);
          setSelectOpen(null);
        }}
      />

      <SelectModal
        visible={selectOpen === 'time'}
        title={t('createService.pharmacist.selectTime')}
        onClose={() => {
          setSelectOpen(null);
          setActiveTimeKey(null);
        }}
        options={timeOptions as any}
        selectedValue={
          activeTimeKey
            ? activeTimeKey.endsWith('.start')
              ? (hours[activeTimeKey.split('.')[0] as DayKey]?.start as any)
              : (hours[activeTimeKey.split('.')[0] as DayKey]?.end as any)
            : null
        }
        onSelect={(v) => {
          if (!activeTimeKey) return;
          const [day, which] = activeTimeKey.split('.') as [DayKey, 'start' | 'end'];
          setHours((prev) => ({ ...prev, [day]: { ...prev[day], [which]: v } }));
          setSelectOpen(null);
          setActiveTimeKey(null);
        }}
      />
    </SafeAreaView>
  );
}

function SelectField({ label, valueLabel, onPress }: { label: string; valueLabel: string; onPress: () => void }) {
  const { isDark } = useTheme();
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const bg = isDark ? theme.colors.dark.tertiaryBackground : theme.colors.light.secondaryBackground;
  return (
    <View style={styles.selectWrap}>
      <Text style={[styles.fieldLabel, { color: secondary }]}>{label}</Text>
      <TouchableOpacity style={[styles.selectBtn, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.75}>
        <Text style={[styles.selectValue, { color: textColor }]} numberOfLines={1}>
          {valueLabel}
        </Text>
        <Ionicons name="chevron-down" size={18} color={secondary} />
      </TouchableOpacity>
    </View>
  );
}

function SelectModal<T extends string>({
  visible,
  title,
  onClose,
  options,
  selectedValue,
  onSelect,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  options: { value: T; label: string }[];
  selectedValue: T | null;
  onSelect: (v: T) => void;
}) {
  const { isDark } = useTheme();
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const bg = isDark ? theme.colors.dark.background : '#fff';
  const border = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: bg, borderColor: border }]} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textColor }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={22} color={secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {options.map((opt) => {
              const selected = selectedValue === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.modalRow, selected && styles.modalRowSelected]}
                  onPress={() => onSelect(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalRowText, { color: textColor }]}>{opt.label}</Text>
                  {selected ? <Ionicons name="checkmark" size={20} color={theme.colors.primary.blue} /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AddListField({
  label,
  placeholder,
  draft,
  onDraftChange,
  items,
  onAdd,
  onRemove,
  addLabel,
}: {
  label: string;
  placeholder: string;
  draft: string;
  onDraftChange: (v: string) => void;
  items: string[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  addLabel: string;
}) {
  const { isDark } = useTheme();
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const chipBg = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={styles.addFieldWrap}>
      <Text style={[styles.fieldLabel, { color: secondary }]}>{label}</Text>
      <View style={styles.addRow}>
        <View style={styles.addInputFlex}>
          <Input placeholder={placeholder} value={draft} onChangeText={onDraftChange} containerStyle={styles.addInput} />
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.primary.blue }]} onPress={onAdd} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>{addLabel}</Text>
        </TouchableOpacity>
      </View>
      {items.length > 0 ? (
        <View style={styles.chipsWrap}>
          {items.map((v, idx) => (
            <View key={`${v}-${idx}`} style={[styles.chip, { backgroundColor: chipBg }]}>
              <Text style={[styles.chipText, { color: textColor }]} numberOfLines={1}>
                {v}
              </Text>
              <TouchableOpacity onPress={() => onRemove(idx)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={14} color={secondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </View>
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
  headerCenter: { flex: 1, paddingHorizontal: theme.spacing.md },
  headerTitle: { ...theme.typography.headline, fontWeight: '800' },
  headerSubtitle: { ...theme.typography.caption1, marginTop: 2 },
  content: { padding: theme.spacing.screenPadding, paddingBottom: theme.spacing['3xl'] },

  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardTitle: { ...theme.typography.headline, fontWeight: '800' },
  cardSubtitle: { ...theme.typography.caption1, marginTop: 4, marginBottom: 12 },

  row2: { flexDirection: 'row', gap: 12 },
  selectWrap: { flex: 1, marginBottom: theme.spacing.md },
  fieldLabel: { ...theme.typography.subheadline, fontWeight: '600', marginBottom: theme.spacing.xs },
  selectBtn: {
    height: 44,
    borderRadius: theme.borderRadius.button,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: { ...theme.typography.body, fontWeight: '500', flex: 1, marginRight: 10 },

  textarea: { height: 110, paddingTop: 12, textAlignVertical: 'top' },
  textareaSm: { height: 72, paddingTop: 12, textAlignVertical: 'top' },

  segmentRow: { flexDirection: 'row', gap: 10, marginBottom: theme.spacing.md },
  segmentBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  segmentText: { ...theme.typography.subheadline, fontWeight: '800' },
  excursionUploadCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    marginBottom: theme.spacing.md,
  },
  excursionUploadTitle: { ...theme.typography.subheadline, fontWeight: '800', textTransform: 'uppercase' },
  excursionUploadBody: { ...theme.typography.caption1, marginTop: 8, lineHeight: 18 },
  excursionUploadRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  excursionUploadPreview: {
    width: 82,
    height: 82,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadPreviewImage: { width: '100%', height: '100%' },
  excursionUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  excursionUploadButtonText: { ...theme.typography.caption1, fontWeight: '800', textTransform: 'uppercase' },
  uploadSelectedText: { ...theme.typography.caption2, marginTop: 10, fontWeight: '600' },
  excursionAvailabilityHint: { ...theme.typography.caption2, marginTop: -8, marginBottom: theme.spacing.sm },
  excursionAvailabilityList: { gap: 10, marginBottom: theme.spacing.md },
  excursionDayCard: { borderWidth: 1, borderRadius: 12, padding: 12 },
  excursionDayToggle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  excursionDayLabel: { ...theme.typography.body, fontWeight: '700', flex: 1 },
  excursionDayInput: { marginTop: theme.spacing.sm, marginBottom: 0 },

  infoBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoText: { ...theme.typography.caption1, flex: 1 },

  cleaningPriceBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: theme.spacing.md,
  },
  cleaningPriceTitle: { ...theme.typography.caption1, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  cleaningPriceBody: { ...theme.typography.caption1, marginTop: 6, lineHeight: 18 },

  shuttleHint: { ...theme.typography.caption2, marginTop: -8, marginBottom: theme.spacing.sm },
  shuttleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  shuttleLabel: { width: 90, ...theme.typography.caption1, fontWeight: '800' },
  shuttleInput: { flex: 1 },
  compactInput: { marginBottom: 0 },

  pmHint: { ...theme.typography.caption2, marginTop: -8, marginBottom: theme.spacing.md },
  pmList: { gap: 8, marginBottom: theme.spacing.md },
  pmRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  pmCheckbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  pmLabel: { ...theme.typography.body, fontWeight: '600', flex: 1 },

  catalogBox: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: theme.spacing.md },
  catalogText: { ...theme.typography.caption1 },
  sectionHeading: { ...theme.typography.headline, fontWeight: '800', marginTop: 10, marginBottom: 10 },

  hoursList: { gap: 10, marginBottom: theme.spacing.md },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayText: { width: 74, ...theme.typography.caption1, fontWeight: '800' },
  openWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 92 },
  openText: { ...theme.typography.caption2, fontWeight: '800' },
  timePill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: { ...theme.typography.caption1, fontWeight: '800' },

  addFieldWrap: { marginBottom: theme.spacing.md },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addInputFlex: { flex: 1 },
  addInput: { marginBottom: 0 },
  addBtn: { height: 44, minWidth: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 22, fontWeight: '900' },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, maxWidth: '100%' },
  chipText: { ...theme.typography.caption1, fontWeight: '600', maxWidth: 240 },

  footerRow: { marginTop: 10, gap: 10 },
  createBtn: { width: '100%' },
  cancelBtn: { width: '100%' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: theme.spacing.screenPadding,
    justifyContent: 'center',
  },
  modalCard: { borderRadius: 16, borderWidth: 1, maxHeight: '70%', overflow: 'hidden' },
  modalHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  modalTitle: { ...theme.typography.headline, fontWeight: '800' },
  modalList: { paddingVertical: 6 },
  modalRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalRowSelected: { backgroundColor: 'rgba(0,122,255,0.08)' },
  modalRowText: { ...theme.typography.body, fontWeight: '600' },
});

