/**
 * Noma Hub upgrade banner — shown to free users whose directory is capped.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';

interface NomaHubUpgradeBannerProps {
  /** Items currently visible to the user */
  shown: number;
  /** Items that would be visible on a paid plan */
  total: number;
  onUpgrade: () => void;
  style?: StyleProp<ViewStyle>;
}

export function NomaHubUpgradeBanner({ shown, total, onUpgrade, style }: NomaHubUpgradeBannerProps) {
  const { isDark } = useTheme();
  const { t } = useI18n();

  const bannerBg = isDark ? 'rgba(255, 248, 230, 0.08)' : '#FDF9F0';
  const bannerBorder = isDark ? 'rgba(232, 217, 160, 0.35)' : '#E8D9A0';
  const textColor = isDark ? theme.colors.dark.label : '#3A3A3A';

  return (
    <View style={[styles.banner, { backgroundColor: bannerBg, borderColor: bannerBorder }, style]}>
      <View style={styles.titleRow}>
        <Ionicons name="lock-closed" size={15} color={textColor} />
        <Text style={[styles.title, { color: textColor }]}>{t('kolbed.upgradeTitle')}</Text>
      </View>
      <Text style={[styles.description, { color: textColor }]}>
        {t('kolbed.upgradeBody', { shown, total })}
      </Text>
      <TouchableOpacity style={styles.ctaButton} onPress={onUpgrade} activeOpacity={0.85}>
        <Text style={styles.ctaText}>{t('kolbed.upgradeCta')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: theme.spacing.screenPadding,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  title: { ...theme.typography.subheadline, fontWeight: '700', flex: 1 },
  description: { ...theme.typography.caption1, lineHeight: 17, marginBottom: theme.spacing.md },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 9,
    paddingHorizontal: theme.spacing.lg,
  },
  ctaText: { ...theme.typography.caption1, color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.3 },
});
