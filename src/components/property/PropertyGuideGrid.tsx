/**
 * Property Guide Grid — tile grid matching the guest guide layout
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PROPERTY_GUIDE_SECTIONS } from '../../constants/propertyGuide';
import type { PropertyGuideSectionId } from '../../types/propertyGuide';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = theme.spacing.screenPadding;
const TILE_GAP = 12;
const COLUMNS = 3;
const TILE_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - TILE_GAP * (COLUMNS - 1)) / COLUMNS;

interface PropertyGuideGridProps {
  propertyTitle: string;
  onSectionPress: (sectionId: PropertyGuideSectionId) => void;
  hasContent?: (sectionId: PropertyGuideSectionId) => boolean;
}

export function PropertyGuideGrid({ propertyTitle, onSectionPress, hasContent }: PropertyGuideGridProps) {
  const { isDark } = useTheme();
  const { t } = useI18n();

  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const tileBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const tileBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={styles.container}>
      <Text style={[styles.mainTitle, { color: textColor }]}>{t('propertyGuide.title')}</Text>
      <Text style={[styles.subtitle, { color: secondary }]}>
        {t('propertyGuide.subtitle', { property: propertyTitle })}
      </Text>

      <View style={styles.grid}>
        {PROPERTY_GUIDE_SECTIONS.map((section) => {
          const filled = hasContent?.(section.id) ?? false;
          return (
            <TouchableOpacity
              key={section.id}
              style={styles.tileWrapper}
              onPress={() => onSectionPress(section.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.tile,
                  {
                    backgroundColor: tileBg,
                    borderColor: filled ? theme.colors.primary.blue : tileBorder,
                    borderWidth: filled ? 1.5 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={section.icon}
                  size={28}
                  color={filled ? theme.colors.primary.blue : textColor}
                />
              </View>
              <Text style={[styles.tileLabel, { color: textColor }]} numberOfLines={2}>
                {t(section.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.caption1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
    justifyContent: 'flex-start',
    width: SCREEN_WIDTH - GRID_PADDING * 2,
  },
  tileWrapper: {
    width: TILE_SIZE,
    alignItems: 'center',
    marginBottom: 4,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    ...theme.typography.caption2,
    textAlign: 'center',
    marginTop: 6,
    textTransform: 'lowercase',
  },
});
