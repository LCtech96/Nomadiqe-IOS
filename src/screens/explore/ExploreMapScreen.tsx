/**
 * Explore Map Screen
 * Grid view of active properties for Creators. Host/Jolly see a map placeholder.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import {
  formatPropertyLocation,
  getPropertyDisplayTitle,
} from '../../utils/propertyDisplay';
import type { Property } from '../../types/property';
import type { ExploreScreenProps } from '../../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = theme.spacing.screenPadding;
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

export default function ExploreMapScreen({ navigation }: ExploreScreenProps<'ExploreMap'>) {
  const { profile } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [structures, setStructures] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isCreator = profile?.role === 'creator';

  const load = async () => {
    if (!isCreator) return;
    setLoading(true);
    try {
      const data = await PropertiesService.getPropertiesForExplore();
      setStructures(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [isCreator]);

  const onRefresh = () => {
    if (!isCreator) return;
    setRefreshing(true);
    load();
  };

  const filteredStructures = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return structures;
    return structures.filter((prop) => {
      const haystack = [
        prop.title,
        prop.city,
        prop.country,
        prop.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [structures, searchQuery]);

  const backgroundColor = isDark
    ? theme.colors.dark.background
    : theme.colors.light.background;

  const textColor = isDark
    ? theme.colors.dark.label
    : theme.colors.light.label;

  const secondaryColor = isDark
    ? theme.colors.dark.secondaryLabel
    : theme.colors.light.secondaryLabel;

  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5';
  const cardBg = isDark ? theme.colors.dark.secondaryBackground : '#fff';

  const handleMapPress = () => {
    Alert.alert(t('explore.mapPlaceholderTitle'), t('explore.mapComingSoon'));
  };

  const renderPropertyCard = ({ item: prop }: { item: Property }) => {
    const displayTitle = getPropertyDisplayTitle(prop, t);
    const location = formatPropertyLocation(prop);
    const guestCount = prop.max_guests || prop.beds || 0;

    return (
      <View style={[styles.gridCard, { backgroundColor: cardBg }]}>
        <View style={styles.imageWrap}>
          {prop.images?.[0] ? (
            <Image source={{ uri: prop.images[0] }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImagePlaceholder, { backgroundColor: inputBg }]}>
              <Ionicons name="image-outline" size={32} color={secondaryColor} />
            </View>
          )}
          {prop.base_price_per_night > 0 && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>
                €{prop.base_price_per_night}
                <Text style={styles.priceBadgeUnit}>/{t('explore.nightAbbrev')}</Text>
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={2}>
            {displayTitle}
          </Text>
          {location ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={12} color={secondaryColor} />
              <Text style={[styles.metaText, { color: secondaryColor }]} numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}
          {guestCount > 0 && (
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={12} color={secondaryColor} />
              <Text style={[styles.metaText, { color: secondaryColor }]}>
                {guestCount} {t('explore.guestsLabel')}
              </Text>
            </View>
          )}
          <Button
            size="sm"
            style={styles.detailsBtn}
            onPress={() => navigation.navigate('PropertyDetail', { propertyId: prop.id })}
          >
            {t('explore.seeDetails')}
          </Button>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('nav.explore')}</Text>
      </View>

      {isCreator ? (
        <>
          <View style={styles.toolbar}>
            <View style={[styles.searchBar, { backgroundColor: inputBg }]}>
              <Ionicons name="search" size={18} color={secondaryColor} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder={t('explore.searchPlaceholder')}
                placeholderTextColor={secondaryColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.toolbarActions}>
              <TouchableOpacity style={[styles.toolbarBtn, { backgroundColor: inputBg }]}>
                <Ionicons name="filter-outline" size={16} color={textColor} />
                <Text style={[styles.toolbarBtnText, { color: textColor }]}>{t('explore.filters')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolbarBtn, { backgroundColor: inputBg }]}
                onPress={handleMapPress}
              >
                <Ionicons name="map-outline" size={16} color={textColor} />
                <Text style={[styles.toolbarBtnText, { color: textColor }]}>{t('explore.map')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.resultsCount, { color: secondaryColor }]}>
            {filteredStructures.length > 0
              ? t('explore.propertiesFound', { count: filteredStructures.length })
              : ''}
          </Text>

          {loading && structures.length === 0 ? (
            <ActivityIndicator size="large" color={theme.colors.primary.blue} style={styles.loader} />
          ) : filteredStructures.length === 0 ? (
            <Text style={[styles.emptyText, { color: secondaryColor }]}>
              {t('kolbed.structuresEmpty')}
            </Text>
          ) : (
            <FlatList
              data={filteredStructures}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
              refreshControl={
                <RefreshControl
                  refreshing={loading || refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.colors.primary.blue}
                />
              }
              showsVerticalScrollIndicator={false}
              renderItem={renderPropertyCard}
            />
          )}
        </>
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="map-outline" size={64} color={secondaryColor} />
          <Text style={[styles.placeholderTitle, { color: textColor }]}>
            {t('explore.mapPlaceholderTitle')}
          </Text>
          <Text style={[styles.placeholderText, { color: secondaryColor }]}>
            {t('explore.mapPlaceholderBody')}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
  },
  toolbar: {
    paddingHorizontal: theme.spacing.screenPadding,
    gap: 10,
    marginBottom: theme.spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    padding: 0,
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toolbarBtnText: { ...theme.typography.caption1, fontWeight: '600' },
  resultsCount: {
    ...theme.typography.caption2,
    fontWeight: '600',
    letterSpacing: 1,
    paddingHorizontal: theme.spacing.screenPadding,
    marginBottom: theme.spacing.sm,
  },
  loader: { marginVertical: theme.spacing['2xl'] },
  gridContent: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 100,
    gap: GRID_GAP,
  },
  gridRow: { gap: GRID_GAP },
  gridCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imageWrap: { position: 'relative' },
  cardImage: { width: '100%', height: 120 },
  cardImagePlaceholder: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceBadgeText: { ...theme.typography.caption1, fontWeight: '700', color: '#000' },
  priceBadgeUnit: { fontWeight: '400', fontSize: 10 },
  cardBody: { padding: 10, gap: 4 },
  cardTitle: {
    ...theme.typography.caption1,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...theme.typography.caption2, flex: 1, letterSpacing: 0.3 },
  detailsBtn: { marginTop: 6 },
  emptyText: {
    ...theme.typography.body,
    textAlign: 'center',
    marginTop: theme.spacing['2xl'],
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.screenPadding,
  },
  placeholderTitle: {
    ...theme.typography.title2,
    fontWeight: '600',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  placeholderText: {
    ...theme.typography.body,
    textAlign: 'center',
  },
});
