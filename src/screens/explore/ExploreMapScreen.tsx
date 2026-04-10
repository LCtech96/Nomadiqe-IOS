/**
 * Explore Map Screen
 * Placeholder mappa in Expo Go. Per i Creator: lista strutture (visibili solo a loro).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import type { Property } from '../../types/property';
import type { ExploreScreenProps } from '../../types/navigation';

export default function ExploreMapScreen({ navigation }: ExploreScreenProps<'ExploreMap'>) {
  const { profile } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [structures, setStructures] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isCreator = profile?.role === 'creator';

  const load = async () => {
    if (!isCreator) return;
    setLoading(true);
    try {
      const data = await PropertiesService.getPropertiesForCreators();
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

  const backgroundColor = isDark
    ? theme.colors.dark.background
    : theme.colors.light.background;

  const textColor = isDark
    ? theme.colors.dark.label
    : theme.colors.light.label;

  const secondaryColor = isDark
    ? theme.colors.dark.secondaryLabel
    : theme.colors.light.secondaryLabel;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Esplora</Text>
      </View>

      {/* Strutture: visibili solo ai Creator */}
      {isCreator ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading || refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary.blue}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('kolbed.structuresForYou')}
          </Text>
          {loading && structures.length === 0 ? (
            <ActivityIndicator size="large" color={theme.colors.primary.blue} style={styles.loader} />
          ) : structures.length === 0 ? (
            <Text style={[styles.emptyText, { color: secondaryColor }]}>
              {t('kolbed.structuresEmpty')}
            </Text>
          ) : (
            structures.map((prop) => (
              <TouchableOpacity
                key={prop.id}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('PropertyDetail', { propertyId: prop.id })}
              >
                <Card style={styles.structureCard}>
                  <Image
                    source={{ uri: prop.images?.[0] ?? '' }}
                    style={styles.structureImage}
                    resizeMode="cover"
                  />
                  <View style={styles.structureInfo}>
                    <Text style={[styles.structureTitle, { color: textColor }]} numberOfLines={1}>
                      {prop.title || t('properties.property')}
                    </Text>
                    {prop.city && (
                      <Text style={[styles.structureLocation, { color: secondaryColor }]} numberOfLines={1}>
                        {prop.city}{prop.country ? `, ${prop.country}` : ''}
                      </Text>
                    )}
                    {prop.base_price_per_night > 0 && (
                      <Text style={[styles.structurePrice, { color: theme.colors.primary.blue }]}>
                        €{prop.base_price_per_night} {t('properties.perNight')}
                      </Text>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="map-outline" size={64} color={secondaryColor} />
          <Text style={[styles.placeholderTitle, { color: textColor }]}>
            Mappa proprietà
          </Text>
          <Text style={[styles.placeholderText, { color: secondaryColor }]}>
            La mappa interattiva è disponibile in una development build.{'\n'}
            Le strutture sono visibili ai Creator in KOL&BED e qui in Esplora.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  listContent: {
    padding: theme.spacing.screenPadding,
    paddingBottom: 100,
  },
  sectionTitle: {
    ...theme.typography.headline,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  loader: { marginVertical: theme.spacing['2xl'] },
  emptyText: {
    ...theme.typography.body,
    marginBottom: theme.spacing.lg,
  },
  structureCard: {
    overflow: 'hidden',
    padding: 0,
    marginBottom: theme.spacing.md,
  },
  structureImage: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  structureInfo: {
    padding: theme.spacing.md,
  },
  structureTitle: {
    ...theme.typography.headline,
    fontWeight: '600',
  },
  structureLocation: {
    ...theme.typography.caption1,
    marginTop: 2,
  },
  structurePrice: {
    ...theme.typography.subheadline,
    fontWeight: '600',
    marginTop: 4,
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
