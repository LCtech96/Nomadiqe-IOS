/**
 * Profile Screen
 * Profilo utente corrente
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Avatar, Badge, Separator } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { formatNumberAbbreviated } from '../../utils/formatters';
import type { ProfileScreenProps } from '../../types/navigation';

export default function ProfileScreen({ navigation }: ProfileScreenProps<'Profile'>) {
  const { profile, signOut } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();

  const backgroundColor = isDark
    ? theme.colors.dark.background
    : theme.colors.light.background;

  const textColor = isDark
    ? theme.colors.dark.label
    : theme.colors.light.label;

  const secondaryColor = isDark
    ? theme.colors.dark.secondaryLabel
    : theme.colors.light.secondaryLabel;

  if (!profile) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Settings */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {t('nav.profile')}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={textColor}
            />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Avatar
            uri={profile.avatar_url}
            size={100}
            verified={Boolean(profile.is_verified)}
          />
          
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: textColor }]}>
              {profile.full_name || 'No name'}
            </Text>
            {profile.username && (
              <Text style={[styles.username, { color: secondaryColor }]}>
                @{profile.username}
              </Text>
            )}
          </View>

          {profile.role && (
            <Badge variant="primary">{profile.role}</Badge>
          )}

          {profile.bio && (
            <Text style={[styles.bio, { color: textColor }]}>
              {profile.bio}
            </Text>
          )}

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: textColor }]}>
                {formatNumberAbbreviated(profile.followers_count || 0)}
              </Text>
              <Text style={[styles.statLabel, { color: secondaryColor }]}>
                {t('profile.followers')}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: textColor }]}>
                {formatNumberAbbreviated(profile.following_count || 0)}
              </Text>
              <Text style={[styles.statLabel, { color: secondaryColor }]}>
                {t('profile.following')}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: textColor }]}>
                {profile.points || 0}
              </Text>
              <Text style={[styles.statLabel, { color: secondaryColor }]}>
                Points
              </Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <Button
            variant="outline"
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.editButton}
          >
            {t('profile.editProfile')}
          </Button>
        </View>

        <Separator style={styles.separator} />

        {/* Dashboard Link (for hosts/creators/jolly) */}
        {profile.role && (
          <>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="bar-chart-outline"
                  size={24}
                  color={theme.colors.primary.blue}
                />
                <Text style={[styles.menuItemText, { color: textColor }]}>
                  {t('nav.dashboard')}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={secondaryColor}
              />
            </TouchableOpacity>
            <Separator style={styles.separator} />
          </>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={signOut}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons
              name="log-out-outline"
              size={24}
              color={theme.colors.error}
            />
            <Text style={[styles.menuItemText, { color: theme.colors.error }]}>
              {t('auth.signOut')}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
  },
  profileSection: {
    alignItems: 'center',
    padding: theme.spacing.screenPadding,
  },
  nameContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  name: {
    ...theme.typography.title1,
    fontWeight: '700',
  },
  username: {
    ...theme.typography.subheadline,
    marginTop: theme.spacing.xs,
  },
  bio: {
    ...theme.typography.body,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  stats: {
    flexDirection: 'row',
    gap: theme.spacing['3xl'],
    marginTop: theme.spacing['2xl'],
    marginBottom: theme.spacing.xl,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.title2,
    fontWeight: '700',
  },
  statLabel: {
    ...theme.typography.caption1,
    marginTop: theme.spacing.xs,
  },
  editButton: {
    width: '100%',
  },
  separator: {
    marginHorizontal: theme.spacing.screenPadding,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.lg,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  menuItemText: {
    ...theme.typography.body,
    fontWeight: '500',
  },
});
