/**
 * Blocks main-app tabs for creators pending admin approval.
 * Profile tab is left unwrapped so creators can still edit their info.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { theme } from '../theme';
import { isCreatorAwaitingApproval } from '../utils/creatorReview';
import { isHostAwaitingApproval } from '../utils/hostReview';

interface CreatorReviewGateProps {
  children: React.ReactNode;
}

function isAwaitingApproval(profile: Parameters<typeof isCreatorAwaitingApproval>[0]) {
  return isCreatorAwaitingApproval(profile) || isHostAwaitingApproval(profile);
}

export function CreatorReviewGate({ children }: CreatorReviewGateProps) {
  const { profile } = useAuth();

  if (!isAwaitingApproval(profile)) {
    return <>{children}</>;
  }

  return <ProfileUnderReviewView profile={profile} />;
}

function ProfileUnderReviewView({ profile }: { profile: import('../types').UserProfile | null }) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const isHost = profile?.role === 'host';

  const backgroundColor = isDark
    ? theme.colors.dark.background
    : '#F2F2F7';
  const cardColor = isDark
    ? theme.colors.dark.secondaryBackground
    : '#FFFFFF';
  const textColor = isDark
    ? theme.colors.dark.label
    : '#000000';

  const serifFamily = Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.title, { color: textColor, fontFamily: serifFamily }]}>
            {(isHost ? t('host.profileUnderReviewTitle') : t('creator.profileUnderReviewTitle')).toUpperCase()}
          </Text>
          <Text style={[styles.message, { color: textColor, fontFamily: serifFamily }]}>
            {(isHost ? t('host.profileUnderReviewMessage') : t('creator.profileUnderReviewMessage')).toUpperCase()}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing['3xl'],
    paddingHorizontal: theme.spacing['2xl'],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: theme.spacing['2xl'],
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
