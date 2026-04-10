/**
 * Edit Structure Screen
 * Modifica dati struttura: nome, camere, posti letto, servizi, paese, prezzo, sconti.
 * L'host può anche eliminare la struttura.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import {
  AMENITIES_REQUESTED,
  AMENITIES_INTEREST,
  AMENITIES_SECURITY,
  type AmenityKey,
} from '../../constants/propertyOnboarding';
import { STRUCTURE_OPPORTUNITIES, type StructureOpportunity } from '../../constants/creator';
import type { Property } from '../../types/property';
import type { ProfileScreenProps } from '../../types/navigation';

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
      style={[
        styles.amenityChip,
        {
          backgroundColor: selected ? theme.colors.primary.blue : cardBg,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? theme.colors.primary.blue : 'transparent',
        },
      ]}
      onPress={onToggle}
    >
      <Text style={[styles.amenityChipText, { color: selected ? '#fff' : textColor }]} numberOfLines={2}>
        {t(`amenity.${id}`)}
      </Text>
    </TouchableOpacity>
  );
}

const DISCOUNT_5_OPTIONS = [
  { value: 5, label: '5%' },
  { value: 10, label: '10%' },
  { value: -1, label: 'Personalizzato' },
] as const;

export default function EditStructureScreen({
  navigation,
  route,
}: ProfileScreenProps<'EditStructure'>) {
  const { propertyId } = route.params;
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [country, setCountry] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [discount5Option, setDiscount5Option] = useState<5 | 10 | -1>(5);
  const [discount5Custom, setDiscount5Custom] = useState('');
  const [discount14, setDiscount14] = useState('');
  const [offerType, setOfferType] = useState<StructureOpportunity | null>('basic');

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  useEffect(() => {
    PropertiesService.getProperty(propertyId).then((p) => {
      if (p) {
        setProperty(p);
        setTitle(p.title || '');
        setBedrooms(p.bedrooms ?? 1);
        setBeds(p.beds ?? 1);
        setAmenities(p.amenities ?? []);
        setCountry(p.country || 'IT');
        setBasePrice(p.base_price_per_night != null ? String(p.base_price_per_night) : '');
        const d5 = p.discount_5_nights_percent;
        if (d5 == null) setDiscount5Option(-1);
        else if (d5 === 5) setDiscount5Option(5);
        else if (d5 === 10) setDiscount5Option(10);
        else {
          setDiscount5Option(-1);
          setDiscount5Custom(String(d5));
        }
        setDiscount14(p.discount_14_nights_percent != null ? String(p.discount_14_nights_percent) : '');
        setOfferType((p.offer_type as StructureOpportunity) ?? 'basic');
      }
      setLoading(false);
    });
  }, [propertyId]);

  const toggleAmenity = (key: AmenityKey) => {
    setAmenities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const getDiscount5Value = (): number | null => {
    if (discount5Option === 5) return 5;
    if (discount5Option === 10) return 10;
    const v = parseFloat(discount5Custom.replace(',', '.'));
    if (Number.isNaN(v) || v < 0 || v > 100) return null;
    return v;
  };

  const getDiscount14Value = (): number | null => {
    const v = parseFloat(discount14.replace(',', '.'));
    if (discount14.trim() === '' || Number.isNaN(v) || v < 0 || v > 100) return null;
    return v;
  };

  const handleSave = async () => {
    if (!property?.id) return;
    const price = parseFloat(basePrice.replace(',', '.'));
    if (Number.isNaN(price) || price < 0) {
      Alert.alert('Errore', 'Inserisci un prezzo valido.');
      return;
    }
    setSaving(true);
    try {
      await PropertiesService.updateProperty(property.id, {
        title: title.trim() || 'Struttura',
        bedrooms,
        beds,
        amenities,
        country: country.trim() || 'IT',
        base_price_per_night: price,
        discount_5_nights_percent: getDiscount5Value(),
        discount_14_nights_percent: getDiscount14Value(),
        offer_type: offerType,
      });
      Alert.alert('Salvato', 'Modifiche salvate.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Errore', 'Impossibile salvare.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!property?.id) return;
    Alert.alert(
      'Elimina struttura',
      'Sei sicuro? Questa azione non si può annullare. Verranno eliminati anche foto, calendario e dati collegati.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await PropertiesService.deleteProperty(property.id);
              navigation.getParent()?.goBack();
              navigation.navigate('Profile');
            } catch (e) {
              Alert.alert('Errore', 'Impossibile eliminare la struttura.');
            }
          },
        },
      ]
    );
  };

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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Modifica struttura</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centered}>
          <Text style={[styles.notFound, { color: secondary }]}>Struttura non trovata</Text>
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
        <Text style={[styles.headerTitle, { color: textColor }]}>Modifica struttura</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.label, { color: secondary }]}>{t('propertyOnboarding.step2PropertyName')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: cardBg, color: textColor }]}
          placeholder={t('propertyOnboarding.step2PropertyNamePlaceholder')}
          placeholderTextColor={secondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: secondary }]}>{t('propertyOnboarding.bedrooms')}</Text>
        <StepperRow
          label={t('propertyOnboarding.bedrooms')}
          value={bedrooms}
          onChange={setBedrooms}
          min={0}
          max={20}
          textColor={textColor}
          secondary={secondary}
        />

        <Text style={[styles.label, { color: secondary }]}>Posti letto</Text>
        <StepperRow
          label="Posti letto"
          value={beds}
          onChange={setBeds}
          min={1}
          max={30}
          textColor={textColor}
          secondary={secondary}
        />

        <Text style={[styles.sectionTitle, { color: textColor }]}>Servizi</Text>
        <View style={styles.amenityGrid}>
          {[...AMENITIES_REQUESTED, ...AMENITIES_INTEREST, ...AMENITIES_SECURITY].map((key) => (
            <AmenityChip
              key={key}
              id={key}
              selected={amenities.includes(key)}
              onToggle={() => toggleAmenity(key)}
              textColor={textColor}
              cardBg={cardBg}
              t={t}
            />
          ))}
        </View>

        <Text style={[styles.label, { color: secondary }]}>{t('propertyOnboarding.step2Country')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: cardBg, color: textColor }]}
          placeholder={t('propertyOnboarding.step2CountryPlaceholder')}
          placeholderTextColor={secondary}
          value={country}
          onChangeText={setCountry}
          autoCapitalize="characters"
          maxLength={3}
        />

        <Text style={[styles.sectionTitle, { color: textColor }]}>Tipo offerta KOL&BED</Text>
        <Text style={[styles.hint, { color: secondary }]}>
          Determina quali creator (in base alle opportunità approvate) possono vedere questa struttura.
        </Text>
        <View style={styles.amenityGrid}>
          {STRUCTURE_OPPORTUNITIES.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.amenityChip,
                {
                  backgroundColor: offerType === opt.value ? theme.colors.primary.blue : cardBg,
                  borderWidth: offerType === opt.value ? 2 : 1,
                  borderColor: offerType === opt.value ? theme.colors.primary.blue : 'transparent',
                },
              ]}
              onPress={() => setOfferType(opt.value)}
            >
              <Text style={[styles.amenityChipText, { color: offerType === opt.value ? '#fff' : textColor }]} numberOfLines={2}>
                {t(opt.labelKey as keyof typeof t)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: secondary }]}>Prezzo a notte (€)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: cardBg, color: textColor }]}
          placeholder="Es. 120"
          placeholderTextColor={secondary}
          value={basePrice}
          onChangeText={setBasePrice}
          keyboardType="decimal-pad"
        />

        <Text style={[styles.sectionTitle, { color: textColor }]}>Sconto per soggiorni superiori a 5 notti</Text>
        <View style={styles.discountRow}>
          {DISCOUNT_5_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.discountChip,
                { backgroundColor: discount5Option === opt.value ? theme.colors.primary.blue : cardBg, borderColor: discount5Option === opt.value ? theme.colors.primary.blue : 'transparent' },
              ]}
              onPress={() => setDiscount5Option(opt.value)}
            >
              <Text style={[styles.discountChipText, { color: discount5Option === opt.value ? '#fff' : textColor }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {discount5Option === -1 && (
          <TextInput
            style={[styles.input, { backgroundColor: cardBg, color: textColor, marginTop: 8 }]}
            placeholder="% (es. 15)"
            placeholderTextColor={secondary}
            value={discount5Custom}
            onChangeText={setDiscount5Custom}
            keyboardType="decimal-pad"
          />
        )}

        <Text style={[styles.sectionTitle, { color: textColor }]}>Sconto per soggiorni superiori a 2 settimane (%)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: cardBg, color: textColor }]}
          placeholder="Es. 20 (personalizzato)"
          placeholderTextColor={secondary}
          value={discount14}
          onChangeText={setDiscount14}
          keyboardType="decimal-pad"
        />

        <Button onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : t('common.save')}
        </Button>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
          <Text style={[styles.deleteBtnText, { color: theme.colors.error }]}>Elimina struttura</Text>
        </TouchableOpacity>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '700' },
  headerRight: { width: 24 },
  scroll: { flex: 1 },
  scrollContent: { padding: theme.spacing.screenPadding, paddingBottom: 40 },
  label: { ...theme.typography.caption1, marginBottom: 6, marginTop: 12 },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...theme.typography.body,
  },
  sectionTitle: { ...theme.typography.headline, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  hint: { ...theme.typography.caption1, marginBottom: 8 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  stepperLabel: { ...theme.typography.body },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn: { padding: 4 },
  stepperValue: { ...theme.typography.title2, fontWeight: '700', minWidth: 32, textAlign: 'center' },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  amenityChipText: { ...theme.typography.caption1 },
  discountRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  discountChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 2 },
  discountChipText: { ...theme.typography.subheadline, fontWeight: '600' },
  saveBtn: { marginTop: 24 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32, paddingVertical: 16 },
  deleteBtnText: { ...theme.typography.headline, fontWeight: '600' },
  notFound: { ...theme.typography.body },
});
