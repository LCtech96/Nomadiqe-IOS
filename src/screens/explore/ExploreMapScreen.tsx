/**
 * Explore Map Screen
 * Placeholder in Expo Go (react-native-maps richiede development build).
 * Per abilitare la mappa: installa react-native-maps e crea una dev build.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { theme } from '../../theme';
import type { ExploreScreenProps } from '../../types/navigation';

export default function ExploreMapScreen({ navigation }: ExploreScreenProps<'ExploreMap'>) {
  const { isDark } = useTheme();

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
        <Text style={[styles.headerTitle, { color: textColor }]}>Explore</Text>
      </View>

      <View style={styles.placeholder}>
        <Ionicons name="map-outline" size={64} color={secondaryColor} />
        <Text style={[styles.placeholderTitle, { color: textColor }]}>
          Mappa proprietà
        </Text>
        <Text style={[styles.placeholderText, { color: secondaryColor }]}>
          La mappa interattiva è disponibile in una development build.{'\n'}
          Qui puoi navigare le altre sezioni dell'app.
        </Text>
      </View>
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
