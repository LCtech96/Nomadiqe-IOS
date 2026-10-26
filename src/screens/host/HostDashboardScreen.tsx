/**
 * Host Dashboard Screen
 * Bottom-tab dashboard for hosts: fixed header + option grid + section views.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import type { Property } from '../../types/property';
import type { HostDashboardScreenProps } from '../../types/navigation';
import {
  formatPropertyLocation,
  getPropertyDisplayTitle,
} from '../../utils/propertyDisplay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 10;
const GRID_PAD = theme.spacing.screenPadding;
const TILE_W = (SCREEN_WIDTH - GRID_PAD * 2 - GRID_GAP * 2) / 3;

type HostDashboardSection =
  | 'home'
  | 'your_properties'
  | 'setup_payments'
  | 'new_collab_offer'
  | 'booking_type'
  | 'referral_links'
  | 'booking_requests'
  | 'kolbed_preferences';

type DashboardTile = {
  id: Exclude<HostDashboardSection, 'home'>;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
};

const DASHBOARD_TILES: DashboardTile[] = [
  { id: 'your_properties', icon: 'business-outline', labelKey: 'hostDashboard.yourProperties' },
  { id: 'setup_payments', icon: 'card-outline', labelKey: 'hostDashboard.setupPayments' },
  { id: 'new_collab_offer', icon: 'megaphone-outline', labelKey: 'hostDashboard.newCollabOffer' },
  { id: 'booking_type', icon: 'list-outline', labelKey: 'hostDashboard.bookingType' },
  { id: 'referral_links', icon: 'share-social-outline', labelKey: 'hostDashboard.referralLinks' },
  { id: 'booking_requests', icon: 'download-outline', labelKey: 'hostDashboard.bookingRequests' },
  { id: 'kolbed_preferences', icon: 'sparkles-outline', labelKey: 'hostDashboard.kolbedPreferences' },
];

const SECTION_TITLE_KEYS: Record<Exclude<HostDashboardSection, 'home'>, string> = {
  your_properties: 'hostDashboard.yourProperties',
  setup_payments: 'hostDashboard.setupPayments',
  new_collab_offer: 'hostDashboard.newCollabOffer',
  booking_type: 'hostDashboard.bookingType',
  referral_links: 'hostDashboard.referralLinks',
  booking_requests: 'hostDashboard.bookingRequests',
  kolbed_preferences: 'hostDashboard.kolbedPreferences',
};

const SECTION_DESC_KEYS: Partial<Record<Exclude<HostDashboardSection, 'home'>, string>> = {
  your_properties: 'hostDashboard.yourPropertiesDesc',
};

function formatPrice(property: Property, t: (key: string) => string): string {
  const symbol = property.currency === 'USD' ? '$' : '€';
  return `${symbol}${property.base_price_per_night} ${t('explore.perNightUpper')}`;
}

function HostPropertyCard({
  property,
  textColor,
  secondaryColor,
  cardBg,
  borderColor,
  t,
  onEdit,
  onDelete,
  onCalendar,
  onView,
}: {
  property: Property;
  textColor: string;
  secondaryColor: string;
  cardBg: string;
  borderColor: string;
  t: (key: string) => string;
  onEdit: () => void;
  onDelete: () => void;
  onCalendar: () => void;
  onView: () => void;
}) {
  const title = getPropertyDisplayTitle(property, t);
  const location = formatPropertyLocation(property);
  const bookingsCount = property.bookings_count ?? 0;

  return (
    <View style={[styles.propertyCard, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.propertyImageWrap}>
        {property.images?.[0] ? (
          <Image source={{ uri: property.images[0] }} style={styles.propertyImage} resizeMode="cover" />
        ) : (
          <View style={[styles.propertyImagePlaceholder, { backgroundColor: borderColor }]}>
            <Ionicons name="image-outline" size={32} color={secondaryColor} />
          </View>
        )}
        {property.base_price_per_night > 0 && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>{formatPrice(property, t)}</Text>
          </View>
        )}
      </View>

      <View style={styles.propertyBody}>
        <Text style={[styles.propertyTitle, { color: textColor }]} numberOfLines={2}>
          {title}
        </Text>
        {location ? (
          <Text style={[styles.propertyLocation, { color: secondaryColor }]} numberOfLines={1}>
            {location}
          </Text>
        ) : null}
        <View style={styles.bookingsRow}>
          <Ionicons name="person-outline" size={14} color={secondaryColor} />
          <Text style={[styles.bookingsText, { color: secondaryColor }]}>
            {bookingsCount} {t('hostDashboard.bookingsLabel')}
          </Text>
        </View>

        <View style={styles.propertyActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnOutline, { borderColor }]}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: textColor }]}>{t('hostDashboard.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnMuted, { backgroundColor: borderColor }]}
            onPress={onCalendar}
            activeOpacity={0.7}
          >
            <Ionicons name="link-outline" size={14} color={textColor} />
            <Text style={[styles.actionBtnText, { color: textColor }]}>{t('hostDashboard.calendar')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnOutline, { borderColor }]}
            onPress={onView}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: textColor }]}>{t('hostDashboard.view')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function HostDashboardScreen({
  navigation,
  route,
}: HostDashboardScreenProps<'HostDashboard'>) {
  const { isDark } = useTheme();
  const { profile, user } = useAuth();
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState<HostDashboardSection>('home');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  useEffect(() => {
    if (route.params?.section) {
      setActiveSection(route.params.section);
    }
  }, [route.params?.section]);

  const backgroundColor = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondaryColor = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? theme.colors.dark.secondaryBackground : '#fff';
  const borderColor = isDark ? theme.colors.dark.separator : theme.colors.light.separator;
  const borderSoft = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';

  const loadProperties = useCallback(async () => {
    if (!user?.id) return;
    setLoadingProperties(true);
    try {
      const list = await PropertiesService.getPropertiesByHost(user.id);
      setProperties(list);
    } catch {
      setProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  }, [user?.id]);

  const handleDeleteProperty = useCallback(
    (property: Property) => {
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
                await loadProperties();
              } catch {
                Alert.alert(t('common.error'), t('propertyOnboarding.deleteStructureError'));
              }
            },
          },
        ]
      );
    },
    [loadProperties, t]
  );

  const handleEditProperty = useCallback(
    (propertyId: string) => {
      navigation.navigate('HostEditProperty', { propertyId });
    },
    [navigation]
  );

  const handleViewProperty = useCallback(
    (propertyId: string) => {
      navigation.navigate('HostStructureView', { propertyId });
    },
    [navigation]
  );

  const handleCalendarSync = useCallback(
    (propertyId: string) => {
      navigation.navigate('HostPropertyCalendarSync', { propertyId });
    },
    [navigation]
  );

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [loadProperties])
  );

  if (!profile || profile.role !== 'host') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={{ color: secondaryColor }}>{t('hostDashboard.hostOnly')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderGrid = () => (
    <View style={styles.navGrid}>
      {DASHBOARD_TILES.map((tile) => (
        <TouchableOpacity
          key={tile.id}
          style={[styles.navTile, { backgroundColor: cardBg, borderColor: borderSoft, width: TILE_W }]}
          onPress={() => setActiveSection(tile.id)}
          activeOpacity={0.75}
        >
          <Ionicons name={tile.icon} size={26} color={theme.colors.primary.blue} />
          <Text style={[styles.navTileLabel, { color: textColor }]} numberOfLines={3}>
            {t(tile.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSectionContent = () => {
    if (activeSection === 'home') {
      return renderGrid();
    }

    const sectionKey = activeSection;
    const titleKey = SECTION_TITLE_KEYS[sectionKey];
    const descKey = SECTION_DESC_KEYS[sectionKey];

    return (
      <View style={styles.sectionContent}>
        <TouchableOpacity style={styles.backLink} onPress={() => setActiveSection('home')} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={16} color={secondaryColor} />
          <Text style={[styles.backLinkText, { color: secondaryColor }]}>{t('hostDashboard.backToDashboard')}</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: textColor }]}>{t(titleKey)}</Text>
        {descKey ? (
          <Text style={[styles.sectionDesc, { color: secondaryColor }]}>{t(descKey)}</Text>
        ) : null}

        {sectionKey === 'your_properties' ? (
          loadingProperties ? (
            <ActivityIndicator size="small" color={theme.colors.primary.blue} style={styles.loader} />
          ) : properties.length === 0 ? (
            <Text style={[styles.emptyText, { color: secondaryColor }]}>{t('hostDashboard.noProperties')}</Text>
          ) : (
            properties.map((property) => (
              <HostPropertyCard
                key={property.id}
                property={property}
                textColor={textColor}
                secondaryColor={secondaryColor}
                cardBg={cardBg}
                borderColor={borderSoft}
                t={t}
                onEdit={() => handleEditProperty(property.id)}
                onDelete={() => handleDeleteProperty(property)}
                onCalendar={() => handleCalendarSync(property.id)}
                onView={() => handleViewProperty(property.id)}
              />
            ))
          )
        ) : (
          <View style={[styles.placeholderBox, { borderColor: borderSoft, backgroundColor: cardBg }]}>
            <Text style={[styles.placeholderText, { color: secondaryColor }]}>
              {t('hostDashboard.comingSoon')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <View style={[styles.fixedHeader, { borderBottomColor: borderSoft }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextBlock}>
            <Text style={[styles.dashboardTitle, { color: textColor }]}>{t('hostDashboard.title')}</Text>
            <Text style={[styles.dashboardDesc, { color: secondaryColor }]}>{t('hostDashboard.subtitle')}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.headerBtnOutline, { borderColor: borderSoft }]} activeOpacity={0.7}>
              <Text style={[styles.headerBtnOutlineText, { color: textColor }]} numberOfLines={2}>
                {t('hostDashboard.newCollabOfferBtn')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtnPrimary}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('NewPropertyOnboarding')}
            >
              <Text style={styles.headerBtnPrimaryText} numberOfLines={2}>
                {t('hostDashboard.newPropertyBtn')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.pointsCard, { borderColor: borderSoft, backgroundColor: cardBg }]}>
          <Ionicons name="sparkles-outline" size={18} color={theme.colors.primary.blue} />
          <Text style={[styles.pointsValue, { color: textColor }]}>{profile.points ?? 0}</Text>
          <Text style={[styles.pointsLabel, { color: secondaryColor }]}>{t('dashboard.points')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSectionContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fixedHeader: {
    paddingHorizontal: GRID_PAD,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  headerTextBlock: { flex: 1, minWidth: 0 },
  dashboardTitle: {
    ...theme.typography.title2,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dashboardDesc: {
    ...theme.typography.caption2,
    marginTop: 4,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    lineHeight: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
    maxWidth: SCREEN_WIDTH * 0.48,
  },
  headerBtnOutline: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    maxWidth: 90,
  },
  headerBtnOutlineText: {
    ...theme.typography.caption2,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  headerBtnPrimary: {
    backgroundColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    maxWidth: 90,
  },
  headerBtnPrimaryText: {
    ...theme.typography.caption2,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: theme.spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
  },
  pointsValue: {
    ...theme.typography.headline,
    fontWeight: '700',
  },
  pointsLabel: {
    ...theme.typography.caption2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: GRID_PAD,
    paddingTop: theme.spacing.md,
    paddingBottom: 100,
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  navTile: {
    aspectRatio: 1,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 8,
  },
  navTileLabel: {
    ...theme.typography.caption2,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  sectionContent: { gap: theme.spacing.md },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  backLinkText: {
    ...theme.typography.subheadline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    ...theme.typography.title2,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionDesc: {
    ...theme.typography.caption2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    lineHeight: 16,
    marginBottom: theme.spacing.sm,
  },
  loader: { marginTop: theme.spacing.lg },
  emptyText: {
    ...theme.typography.body,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  placeholderBox: {
    minHeight: 200,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  placeholderText: {
    ...theme.typography.subheadline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  propertyCard: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  propertyImageWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  propertyImage: { width: '100%', height: '100%' },
  propertyImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  priceBadgeText: {
    ...theme.typography.caption1,
    fontWeight: '700',
    color: '#000',
    textTransform: 'uppercase',
  },
  propertyBody: { padding: theme.spacing.md, gap: 6 },
  propertyTitle: {
    ...theme.typography.headline,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  propertyLocation: {
    ...theme.typography.caption1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookingsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  bookingsText: {
    ...theme.typography.caption1,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  propertyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  actionBtnOutline: { borderWidth: 1 },
  actionBtnMuted: {},
  actionBtnText: {
    ...theme.typography.caption2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
