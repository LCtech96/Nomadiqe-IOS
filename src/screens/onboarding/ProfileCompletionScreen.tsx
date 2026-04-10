/**
 * Profile Completion Screen
 * Creazione profilo: avatar, username, descrizione (max 30 caratteri). Fase generica per tutti i ruoli.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button, Input, Avatar } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useInvite } from '../../contexts/InviteContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { AuthService } from '../../services/auth.service';
import { claimInvite } from '../../services/invitations.service';
import { awardPoints } from '../../services/points.service';
import { NotificationsService } from '../../services/notifications.service';
import { usernameSchema, bioSchema } from '../../utils/validators';
import { containsLink } from '../../utils/bio';
import type { OnboardingScreenProps } from '../../types/navigation';

type ProfileFormData = {
  fullName: string;
  username: string;
  bio: string;
};

export default function ProfileCompletionScreen({ navigation, route }: OnboardingScreenProps<'ProfileCompletion'>) {
  const { user, profile, refreshProfile } = useAuth();
  const selectedRole = route.params?.role;
  const { pendingInviteCode, clearPendingInviteCode } = useInvite();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const profileSchema = React.useMemo(
    () =>
      z.object({
        fullName: z.string().min(2, t('onboarding.minChars')),
        username: usernameSchema,
        bio: bioSchema,
      }),
    [t]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', username: '', bio: '' },
  });

  const pickImage = async () => {
    if (!user) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.photoPermissionTitle'), t('common.photoPermissionMessage'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const url = await AuthService.uploadAvatar(
        user.id,
        result.assets[0].uri,
        result.assets[0].base64 ?? null
      );
      setAvatarUri(url);
    } catch (e) {
      Alert.alert(t('common.error'), t('common.photoError'));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      Alert.alert(t('common.error'), t('common.error'));
      return;
    }
    if (!profile) {
      Alert.alert(t('common.error'), t('onboarding.saveError'));
      return;
    }
    try {
      setLoading(true);
      const bio = data.bio || null;
      const role = selectedRole ?? profile.role;
      const isHost = role === 'host';
      const isCreator = role === 'creator';
      const updates: Parameters<typeof AuthService.updateProfile>[1] = {
        full_name: data.fullName.trim(),
        username: data.username.trim().toLowerCase(),
        bio,
        // Host: completa onboarding dopo la scelta tipo struttura (fase successiva)
        // Creator: completa onboarding dopo CreatorOnboarding (categoria, strutture, social)
        ...(isHost || isCreator ? {} : { onboarding_completed: true }),
      };
      if (containsLink(bio ?? '')) {
        updates.bio_links_approved = false;
      }
      await AuthService.updateProfile(user.id, updates);
      if (bio && containsLink(bio)) {
        try {
          await NotificationsService.notifyAdminsBioLinkApproval(user.id, user.email ?? '');
        } catch (_) {}
      }
      if (pendingInviteCode) {
        try {
          const result = await claimInvite(pendingInviteCode, user.id);
          if (result) {
            const actionType = result.role === 'host' ? 'invite_host' : 'invite_creator';
            await awardPoints(result.inviterId, actionType);
          }
        } catch (_) {}
        await clearPendingInviteCode();
      }
      await refreshProfile();
      if (isHost) {
        navigation.navigate('HostPropertyTypeSelection');
      } else if (isCreator) {
        navigation.navigate('CreatorOnboarding');
      }
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || t('common.saveProfileError'));
    } finally {
      setLoading(false);
    }
  };

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>{t('onboarding.completeProfile')}</Text>
          <Text style={[styles.subtitle, { color: secondary }]}>
            {t('onboarding.completeProfileSubtitle')}
          </Text>
        </View>

        <TouchableOpacity
          onPress={pickImage}
          disabled={uploading}
          style={styles.avatarWrap}
        >
          <Avatar uri={avatarUri} size={100} />
          {uploading && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          {!uploading && (
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('onboarding.name')}
                placeholder={t('onboarding.namePlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
                autoCapitalize="words"
              />
            )}
          />
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('onboarding.username')}
                placeholder={t('onboarding.usernamePlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.username?.message}
                autoCapitalize="none"
              />
            )}
          />
          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('onboarding.bioShort')}
                placeholder={t('onboarding.bioPlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.bio?.message}
                maxLength={31}
              />
            )}
          />
          <Button
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading}
            size="lg"
            style={styles.button}
          >
            {t('onboarding.complete')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  content: { padding: theme.spacing.screenPadding, paddingBottom: theme.spacing['3xl'] },
  header: { marginBottom: theme.spacing['2xl'] },
  title: { ...theme.typography.largeTitle, fontWeight: '700', marginBottom: theme.spacing.sm },
  subtitle: { ...theme.typography.body },
  avatarWrap: { alignSelf: 'center', marginBottom: theme.spacing.xl, position: 'relative' },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: { gap: theme.spacing.md },
  button: { marginTop: theme.spacing.md },
});
