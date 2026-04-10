/**
 * Edit Profile Screen
 * Modifica nome, username e bio (e foto profilo)
 */

import React, { useEffect } from 'react';
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
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '../../services/notifications.service';
import { usernameSchema, bioSchema } from '../../utils/validators';
import { containsLink } from '../../utils/bio';
import type { ProfileScreenProps } from '../../types/navigation';

type EditProfileFormData = {
  fullName: string;
  username: string;
  bio: string;
};

export default function EditProfileScreen({
  navigation,
}: ProfileScreenProps<'EditProfile'>) {
  const { user, profile, refreshProfile } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const formSchema = React.useMemo(
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
    reset,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: profile?.full_name ?? '',
      username: profile?.username ?? '',
      bio: profile?.bio ?? '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.full_name ?? '',
        username: profile.username ?? '',
        bio: profile.bio ?? '',
      });
    }
  }, [profile?.id, profile?.full_name, profile?.username, profile?.bio, reset]);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;

  const pickImage = async () => {
    if (!user?.id) return;
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
    setUploadingAvatar(true);
    try {
      await AuthService.uploadAvatar(
        user.id,
        result.assets[0].uri,
        result.assets[0].base64 ?? null
      );
      await refreshProfile();
    } catch (e) {
      Alert.alert(t('common.error'), t('common.photoError'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSubmit = async (data: EditProfileFormData) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const bio = data.bio?.trim() || null;
      const updates: Parameters<typeof AuthService.updateProfile>[1] = {
        full_name: data.fullName.trim(),
        username: data.username.trim().toLowerCase(),
        bio,
      };
      if (bio && containsLink(bio)) {
        updates.bio_links_approved = false;
      }
      await AuthService.updateProfile(user.id, updates);
      if (bio && containsLink(bio)) {
        try {
          await NotificationsService.notifyAdminsBioLinkApproval(user.id, user.email ?? '');
        } catch (_) {}
      }
      await refreshProfile();
      Alert.alert(t('common.success'), t('common.save'));
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('username') || msg.includes('unique')) {
        Alert.alert(t('common.error'), t('profile.usernameTaken') || 'Questo nome utente è già in uso.');
      } else {
        Alert.alert(t('common.error'), msg || t('common.saveProfileError'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('profile.editProfile')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} disabled={uploadingAvatar}>
          <Avatar
            source={profile.avatar_url ? { uri: profile.avatar_url } : undefined}
            size={100}
          />
          {uploadingAvatar && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

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
              containerStyle={styles.input}
            />
          )}
        />
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('auth.username')}
              placeholder={t('onboarding.usernamePlaceholder')}
              value={value}
              onChangeText={(v) => onChange(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              onBlur={onBlur}
              error={errors.username?.message}
              containerStyle={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('profile.bio')}
              placeholder={t('onboarding.bioPlaceholder')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.bio?.message}
              containerStyle={styles.input}
              multiline
              maxLength={30}
            />
          )}
        />

        <Button
          onPress={handleSubmit(onSubmit)}
          loading={saving}
          disabled={saving}
          size="lg"
          style={styles.saveBtn}
        >
          {t('common.save')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.screenPadding, paddingBottom: 40 },
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: { marginBottom: theme.spacing.lg },
  saveBtn: { marginTop: theme.spacing.lg },
});
