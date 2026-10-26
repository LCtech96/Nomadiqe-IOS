/**
 * Profile invite banner — shown above profile info on the Profile tab.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import type { InviteRole } from '../../services/invitations.service';

interface ProfileInviteBannerProps {
  userRole: InviteRole;
  onOpenInvites: () => void;
  onDismiss: () => void;
}

export function ProfileInviteBanner({
  userRole,
  onOpenInvites,
  onDismiss,
}: ProfileInviteBannerProps) {
  const { isDark } = useTheme();
  const { t } = useI18n();

  const serifFamily = Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  });

  const roleLabel = t(`roles.${userRole}`);
  const title = t('profile.inviteBannerTitle', { role: roleLabel }).toUpperCase();
  const description = t('profile.inviteBannerDescription', { role: roleLabel }).toUpperCase();

  const bannerBg = isDark ? 'rgba(255, 248, 230, 0.08)' : '#FDF9F0';
  const bannerBorder = isDark ? 'rgba(232, 217, 160, 0.35)' : '#E8D9A0';
  const textColor = isDark ? theme.colors.dark.label : '#3A3A3A';

  return (
    <View style={[styles.banner, { backgroundColor: bannerBg, borderColor: bannerBorder }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={16} color={textColor} style={styles.sparkle} />
          <Text style={[styles.title, { color: textColor, fontFamily: serifFamily }]}>{title}</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={12} accessibilityLabel={t('common.cancel')}>
          <Ionicons name="close" size={18} color={textColor} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.description, { color: textColor, fontFamily: serifFamily }]}>
        {description}
      </Text>

      <TouchableOpacity
        style={styles.ctaButton}
        onPress={onOpenInvites}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>{t('profile.openInvites').toUpperCase()}</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  sparkle: {
    marginRight: theme.spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    flex: 1,
  },
  description: {
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.2,
    marginBottom: theme.spacing.md,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
