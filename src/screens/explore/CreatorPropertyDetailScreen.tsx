/**
 * Creator Property Detail Screen
 * Read-only property view for creators browsing Explore.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import {
  formatPropertyLocation,
  getAmenityLabel,
  getPropertyDisplayTitle,
  getStructureTypeLabel,
} from '../../utils/propertyDisplay';
import type { Property } from '../../types/property';
import type { ExploreScreenProps } from '../../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 260;
const DESCRIPTION_MAX_LINES = 5;

export default function CreatorPropertyDetailScreen({
  navigation,
  route,
}: ExploreScreenProps<'PropertyDetail'>) {
  const { propertyId } = route.params;
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? theme.colors.dark.secondaryBackground : '#fff';
  const serifFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

  useEffect(() => {
    PropertiesService.getPropertyForExplore(propertyId)
      .then(setProperty)
      .finally(() => setLoading(false));
  }, [propertyId]);

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
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={textColor} />
            <Text style={[styles.backText, { color: textColor }]}>{t('common.back').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={[styles.notFound, { color: secondary }]}>{t('propertyOnboarding.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const images = property.images ?? [];
  const hasImages = images.length > 0;
  const displayTitle = getPropertyDisplayTitle(property, t);
  const location = formatPropertyLocation(property);
  const amenities = property.amenities ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={textColor} />
          <Text style={[styles.backText, { color: textColor }]}>{t('common.back').toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: textColor, fontFamily: serifFamily }]}>{displayTitle}</Text>
        {location ? (
          <Text style={[styles.pageLocation, { color: secondary }]}>{location}</Text>
        ) : null}

        {hasImages ? (
          <FlatList
            data={images}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            bounces={false}
            style={styles.gallery}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            renderItem={({ item: uri }) => (
              <View style={styles.gallerySlide}>
                <Image source={{ uri }} style={styles.galleryImage} resizeMode="cover" />
              </View>
            )}
          />
        ) : (
          <View style={[styles.photoPlaceholder, { borderColor: '#E6C200' }]}>
            <Text style={styles.photoPlaceholderEmoji}>🔑</Text>
            <Text style={[styles.photoPlaceholderText, { color: secondary }]}>
              {t('explore.noPhotosUploaded')}
            </Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardTitle, { color: textColor, fontFamily: serifFamily }]}>
            {t('explore.descriptionSection')}
          </Text>
          <ExpandableDescription
            key={property.id}
            text={property.description}
            textColor={textColor}
            emptyLabel={t('explore.noDescription')}
          />
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardTitle, { color: textColor, fontFamily: serifFamily }]}>
            {t('explore.detailsSection')}
          </Text>
          <View style={styles.detailsGrid}>
            <DetailCell label={t('explore.typeLabel')} value={getStructureTypeLabel(property, t)} secondary={secondary} />
            <DetailCell
              label={t('explore.maxGuestsLabel')}
              value={String(property.max_guests || '—')}
              secondary={secondary}
            />
            <DetailCell
              label={t('properties.bedrooms')}
              value={String(property.bedrooms ?? '—')}
              secondary={secondary}
            />
            <DetailCell
              label={t('properties.bathrooms')}
              value={String(property.bathrooms ?? '—')}
              secondary={secondary}
            />
          </View>
        </View>

        {amenities.length > 0 && (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: textColor, fontFamily: serifFamily }]}>
              {t('explore.servicesSection')}
            </Text>
            <View style={styles.amenityRow}>
              {amenities.map((key) => (
                <View key={key} style={[styles.amenityPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0' }]}>
                  <Text style={[styles.amenityPillText, { color: textColor }]}>
                    {getAmenityLabel(key, t)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.bookCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardTitle, { color: textColor, fontFamily: serifFamily }]}>
            {t('explore.bookSection')}
          </Text>
          {property.base_price_per_night > 0 && (
            <Text style={[styles.bookPrice, { color: textColor, fontFamily: serifFamily }]}>
              €{property.base_price_per_night}{' '}
              <Text style={styles.bookPriceUnit}>{t('explore.perNightUpper')}</Text>
            </Text>
          )}

          <Text style={[styles.fieldLabel, { color: secondary }]}>{t('explore.checkIn')}</Text>
          <View style={[styles.dateField, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5' }]}>
            <Ionicons name="calendar-outline" size={18} color={secondary} />
            <TextInput
              style={[styles.dateInput, { color: secondary }]}
              placeholder="mm/dd/yyyy"
              placeholderTextColor={secondary}
              editable={false}
            />
          </View>

          <Text style={[styles.fieldLabel, { color: secondary }]}>{t('explore.checkOut')}</Text>
          <View style={[styles.dateField, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5' }]}>
            <Ionicons name="calendar-outline" size={18} color={secondary} />
            <TextInput
              style={[styles.dateInput, { color: secondary }]}
              placeholder="mm/dd/yyyy"
              placeholderTextColor={secondary}
              editable={false}
            />
          </View>

          <Text style={[styles.fieldLabel, { color: secondary }]}>{t('properties.guests')}</Text>
          <View style={[styles.dateField, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5' }]}>
            <TextInput
              style={[styles.dateInput, { color: textColor }]}
              value="1"
              editable={false}
            />
          </View>

          <Button variant="primary" size="lg" style={styles.bookBtn} disabled>
            {t('explore.bookButton')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ExpandableDescription({
  text,
  textColor,
  emptyLabel,
}: {
  text: string | null | undefined;
  textColor: string;
  emptyLabel: string;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const displayText = text?.trim() ? text.trim().toUpperCase() : emptyLabel;

  return (
    <View>
      <Text
        style={[styles.descriptionMeasure, styles.descriptionText, { color: textColor }]}
        onTextLayout={(e) => {
          setIsOverflowing(e.nativeEvent.lines.length > DESCRIPTION_MAX_LINES);
        }}
        accessible={false}
        importantForAccessibility="no"
      >
        {displayText}
      </Text>
      <Text
        style={[styles.descriptionText, { color: textColor }]}
        numberOfLines={expanded || !isOverflowing ? undefined : DESCRIPTION_MAX_LINES}
      >
        {displayText}
      </Text>
      {isOverflowing && (
        <TouchableOpacity
          onPress={() => setExpanded((v) => !v)}
          style={styles.descriptionToggle}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={expanded ? t('explore.hideDescription') : t('explore.readMore')}
        >
          <Text style={[styles.descriptionToggleText, { color: theme.colors.primary.blue }]}>
            {expanded ? t('explore.hideDescription') : t('explore.readMore')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function DetailCell({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary: string;
}) {
  return (
    <View style={styles.detailCell}>
      <Text style={[styles.detailLabel, { color: secondary }]}>{label.toUpperCase()}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const CARD_WIDTH = SCREEN_WIDTH - theme.spacing.screenPadding * 2;

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { ...theme.typography.subheadline, fontWeight: '600', letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: 48,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pageLocation: {
    ...theme.typography.subheadline,
    letterSpacing: 1,
    marginBottom: theme.spacing.lg,
  },
  gallery: {
    marginBottom: theme.spacing.lg,
    marginHorizontal: -theme.spacing.screenPadding,
    width: SCREEN_WIDTH,
  },
  gallerySlide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryImage: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 12,
  },
  photoPlaceholder: {
    height: IMAGE_HEIGHT,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    gap: 8,
  },
  photoPlaceholderEmoji: { fontSize: 32 },
  photoPlaceholderText: { ...theme.typography.subheadline, fontWeight: '600', letterSpacing: 0.5 },
  card: {
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    letterSpacing: 0.5,
  },
  descriptionText: {
    ...theme.typography.body,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  descriptionMeasure: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  descriptionToggle: {
    marginTop: theme.spacing.xs,
  },
  descriptionToggleText: {
    ...theme.typography.subheadline,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  detailCell: { width: '45%' },
  detailLabel: { ...theme.typography.caption2, marginBottom: 4, letterSpacing: 0.5 },
  detailValue: { ...theme.typography.headline, fontWeight: '600' },
  amenityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityPill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  amenityPillText: { ...theme.typography.caption1, fontWeight: '600', letterSpacing: 0.3 },
  bookCard: {
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bookPrice: { fontSize: 22, fontWeight: '700', marginBottom: theme.spacing.lg },
  bookPriceUnit: { ...theme.typography.subheadline, fontWeight: '400' },
  fieldLabel: { ...theme.typography.caption1, marginBottom: 6, marginTop: 8, letterSpacing: 0.5 },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateInput: { flex: 1, ...theme.typography.body, padding: 0 },
  bookBtn: { marginTop: theme.spacing.lg, opacity: 0.7 },
  notFound: { ...theme.typography.body },
});
