/**
 * Property Guest View Screen
 * Vista struttura in sola lettura (per chi apre il link di condivisione).
 * Se l'utente non è loggato e prova a tornare indietro → richiesta di registrazione → Sign Up.
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import type { Property } from '../../types/property';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 280;

export type PropertyGuestViewScreenParams = {
  propertyId: string;
  /** Se true, back press richiede registrazione (flusso da link condivisione senza auth) */
  requireSignUpOnBack?: boolean;
};

type Props = {
  route: { params: PropertyGuestViewScreenParams };
  navigation: { goBack: () => void; navigate: (screen: string) => void };
};

export default function PropertyGuestViewScreen({ route, navigation }: Props) {
  const { propertyId, requireSignUpOnBack } = route.params;
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;

  useEffect(() => {
    PropertiesService.getProperty(propertyId).then(setProperty).finally(() => setLoading(false));
  }, [propertyId]);

  const handleBack = () => {
    const shouldRequireSignUp = requireSignUpOnBack === true || !user;
    if (shouldRequireSignUp) {
      Alert.alert(
        'Registrati per continuare',
        'Per esplorare l\'app e usare tutte le funzionalità registrati o accedi.',
        [
          { text: 'Annulla', style: 'cancel' },
          {
            text: 'Registrati',
            onPress: () => navigation.navigate('SignUp'),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
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
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Struttura</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centered}>
          <Text style={[styles.notFound, { color: secondary }]}>Struttura non trovata</Text>
        </View>
      </SafeAreaView>
    );
  }

  const images = property.images ?? [];
  const hasImages = images.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          {property.title || 'Struttura'}
        </Text>
        <View style={styles.headerRight} />
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
            <Text style={[styles.placeholderText, { color: secondary }]}>Nessuna foto</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={[styles.title, { color: textColor }]}>{property.title || 'Struttura'}</Text>
          {(property.city || property.country) && (
            <Text style={[styles.location, { color: secondary }]}>
              {[property.city, property.country].filter(Boolean).join(', ')}
            </Text>
          )}
          {property.base_price_per_night > 0 && (
            <Text style={[styles.price, { color: theme.colors.primary.blue }]}>
              €{property.base_price_per_night} / notte
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '700', flex: 1, marginHorizontal: 12, textAlign: 'center' },
  headerRight: { width: 48 },
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
  info: { padding: theme.spacing.screenPadding },
  title: { ...theme.typography.title1, fontWeight: '700', marginBottom: 4 },
  location: { ...theme.typography.subheadline, marginBottom: 4 },
  price: { ...theme.typography.headline, fontWeight: '600' },
  notFound: { ...theme.typography.body },
});
