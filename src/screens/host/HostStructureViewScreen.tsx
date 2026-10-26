/**
 * Host Structure View Screen
 * Property preview with share link, availability calendar, manage structure + guest guide.
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
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { Button } from '../../components/ui';
import { PropertyAvailabilityCalendar } from '../../components/property/PropertyAvailabilityCalendar';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import type { Property } from '../../types/property';
import { buildPropertyShareLink } from '../../utils/propertyLinks';
import { getPropertyDisplayTitle, formatPropertyLocation } from '../../utils/propertyDisplay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 280;

type HostStructureViewNav = {
  goBack: () => void;
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

interface HostStructureViewScreenProps {
  navigation: HostStructureViewNav;
  route: { params: { propertyId: string } };
}

export default function HostStructureViewScreen({ navigation, route }: HostStructureViewScreenProps) {
  const { propertyId } = route.params;
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const borderColor = isDark ? theme.colors.dark.separator : 'rgba(0,0,0,0.12)';

  useEffect(() => {
    PropertiesService.getProperty(propertyId).then(setProperty).finally(() => setLoading(false));
  }, [propertyId]);

  const handleCopyLink = async () => {
    const url = buildPropertyShareLink(propertyId);
    await Clipboard.setStringAsync(url);
    Alert.alert(t('propertyOnboarding.linkCopiedTitle'), t('propertyOnboarding.linkCopiedMessage'));
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
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('propertyOnboarding.structureFallbackTitle')}</Text>
          <View style={styles.headerRight} />
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          {displayTitle}
        </Text>
        <TouchableOpacity onPress={handleCopyLink} style={styles.copyLinkHeader}>
          <Ionicons name="link" size={22} color={theme.colors.primary.blue} />
          <Text style={[styles.copyLinkHeaderText, { color: theme.colors.primary.blue }]}>{t('propertyOnboarding.copyLink')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {hasImages ? (
          <FlatList
            data={images}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH}
            snapToAlignment="start"
            decelerationRate="fast"
            style={styles.gallery}
            renderItem={({ item: uri }) => (
              <Image source={{ uri }} style={styles.galleryImage} resizeMode="cover" />
            )}
          />
        ) : (
          <View style={[styles.galleryPlaceholder, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7' }]}>
            <Ionicons name="images-outline" size={64} color={secondary} />
            <Text style={[styles.placeholderText, { color: secondary }]}>{t('propertyOnboarding.noPhotos')}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={[styles.title, { color: textColor }]}>{displayTitle}</Text>
          {location ? <Text style={[styles.location, { color: secondary }]}>{location}</Text> : null}
          {property.base_price_per_night > 0 && (
            <Text style={[styles.price, { color: theme.colors.primary.blue }]}>
              €{property.base_price_per_night} / {t('explore.nightAbbrev').toLowerCase()}
            </Text>
          )}
          <Text style={[styles.shareHint, { color: secondary }]}>{t('propertyOnboarding.shareHint')}</Text>
        </View>

        <View style={styles.calendarWrap}>
          <PropertyAvailabilityCalendar propertyId={property.id} />
        </View>

        <View style={styles.actionRow}>
          <Button
            onPress={() => navigation.navigate('HostStructure', { propertyId: property.id })}
            style={styles.actionBtn}
          >
            {t('propertyOnboarding.manageStructure')}
          </Button>
          <TouchableOpacity
            style={[styles.guideBtn, { borderColor: theme.colors.primary.blue }]}
            onPress={() => navigation.navigate('PropertyGuide', { propertyId: property.id })}
            activeOpacity={0.7}
          >
            <Ionicons name="book-outline" size={20} color={theme.colors.primary.blue} />
            <Text style={[styles.guideBtnText, { color: theme.colors.primary.blue }]}>{t('propertyGuide.openGuideCta')}</Text>
          </TouchableOpacity>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '700', flex: 1, marginHorizontal: 12, textAlign: 'center' },
  headerRight: { width: 80 },
  copyLinkHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 100 },
  copyLinkHeaderText: { ...theme.typography.caption1, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  gallery: { maxHeight: IMAGE_HEIGHT },
  galleryImage: { width: SCREEN_WIDTH, height: IMAGE_HEIGHT },
  galleryPlaceholder: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { ...theme.typography.subheadline, marginTop: 8 },
  info: { padding: theme.spacing.screenPadding, paddingBottom: theme.spacing.md },
  title: { ...theme.typography.title1, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  location: { ...theme.typography.subheadline, marginBottom: 4, textTransform: 'uppercase' },
  price: { ...theme.typography.headline, fontWeight: '600', marginBottom: 12 },
  shareHint: { ...theme.typography.caption1, lineHeight: 18 },
  calendarWrap: { paddingHorizontal: theme.spacing.screenPadding },
  actionRow: { paddingHorizontal: theme.spacing.screenPadding, gap: 12, marginTop: theme.spacing.sm },
  actionBtn: {},
  guideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
  },
  guideBtnText: { ...theme.typography.subheadline, fontWeight: '600' },
  notFound: { ...theme.typography.body },
});
