/**
 * Create Post Screen
 * Pubblica un post con foto e descrizione (stato iniziale: in attesa di approvazione admin)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PostsService } from '../../services/posts.service';
import { supabase } from '../../services/supabase';
import { getInvitedByMe } from '../../services/invitations.service';
import { isHostAdvanced, HOST_ADVANCED_MIN_POINTS } from '../../constants/hostAdvanced';
import type { RootStackScreenProps } from '../../types/navigation';

const BUCKET = 'posts';

export default function CreatePostScreen({
  navigation,
}: RootStackScreenProps<'CreatePost'>) {
  const { user, profile } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hostInvitedCount, setHostInvitedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id || profile?.role !== 'host') {
      setHostInvitedCount(null);
      return;
    }
    getInvitedByMe(user.id, 'host')
      .then((list) => setHostInvitedCount(list.length))
      .catch(() => setHostInvitedCount(0));
  }, [user?.id, profile?.role]);

  useEffect(() => {
    if (profile?.role !== 'host' || hostInvitedCount === null) return;
    if (!isHostAdvanced(hostInvitedCount, profile.points ?? 0)) {
      Alert.alert(
        t('createPost.hostAdvancedBlocked'),
        t('createPost.hostAdvancedRequired', { points: HOST_ADVANCED_MIN_POINTS }),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [profile?.role, profile?.points, hostInvitedCount, navigation, t]);

  const backgroundColor = isDark
    ? theme.colors.dark.background
    : theme.colors.light.background;
  const textColor = isDark
    ? theme.colors.dark.label
    : theme.colors.light.label;
  const placeholderColor = isDark
    ? theme.colors.dark.tertiaryLabel
    : theme.colors.light.tertiaryLabel;
  const insets = useSafeAreaInsets();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso necessario', 'Abilita l\'accesso alla galleria per aggiungere una foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  };

  const removeImage = () => {
    setImageUri(null);
    setImageBase64(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!user) return null;
    const ext = imageUri?.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;
    try {
      let body: Blob | ArrayBuffer;
      if (imageBase64) {
        const binary = atob(imageBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        body = bytes.buffer;
      } else if (imageUri) {
        const response = await fetch(imageUri);
        body = await response.blob();
      } else {
        return null;
      }
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(path, body, { contentType: 'image/jpeg', upsert: false });
      if (error) {
        console.error('Upload error:', error);
        return null;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
      return urlData?.publicUrl ?? null;
    } catch (e) {
      console.error('Upload error:', e);
      return null;
    }
  };

  const handlePublish = async () => {
    const trimmed = description.trim();
    if (!trimmed) {
      Alert.alert('Descrizione richiesta', 'Scrivi qualcosa per il post.');
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      let media: { type: 'image'; url: string }[] = [];
      if (imageUri) {
        const url = await uploadImage();
        if (url) media.push({ type: 'image', url });
      }
      const role = profile?.role;
      const hostOk =
        role === 'host' &&
        hostInvitedCount !== null &&
        isHostAdvanced(hostInvitedCount, profile?.points ?? 0);
      const visibility =
        role === 'creator' || role === 'jolly' || hostOk ? 'public' : 'private';
      await PostsService.createPost({
        author_id: user.id,
        content: trimmed,
        media,
        type: 'standard',
        visibility,
      });
      if (visibility === 'public') {
        Alert.alert(
          t('createPost.pendingTitle'),
          role === 'host' ? t('createPost.pendingMessage') : t('createPost.creatorJollyPublicHint'),
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          t('createPost.hostSuccessTitle'),
          t('createPost.hostSuccessMessage'),
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Errore durante la pubblicazione';
      Alert.alert('Errore', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + theme.spacing.md }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: theme.colors.primary.blue }]}>
              Annulla
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Nuovo post</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Banner visibilità post */}
        {profile?.role === 'creator' || profile?.role === 'jolly' ? (
          <View style={[styles.visibilityBanner, { backgroundColor: 'rgba(52,199,89,0.12)', borderColor: 'rgba(52,199,89,0.4)' }]}>
            <Ionicons name="globe-outline" size={16} color="#34C759" />
            <Text style={[styles.visibilityBannerText, { color: '#34C759' }]}>
              {t('createPost.creatorJollyPublicHint')}
            </Text>
          </View>
        ) : profile?.role === 'host' &&
          hostInvitedCount !== null &&
          isHostAdvanced(hostInvitedCount, profile.points ?? 0) ? (
          <View style={[styles.visibilityBanner, { backgroundColor: 'rgba(52,199,89,0.12)', borderColor: 'rgba(52,199,89,0.4)' }]}>
            <Ionicons name="globe-outline" size={16} color="#34C759" />
            <Text style={[styles.visibilityBannerText, { color: '#34C759' }]}>
              {t('createPost.pendingMessage')}
            </Text>
          </View>
        ) : (
          <View style={[styles.visibilityBanner, { backgroundColor: 'rgba(255,165,0,0.12)', borderColor: 'rgba(255,165,0,0.4)' }]}>
            <Ionicons name="lock-closed-outline" size={16} color="#F5A623" />
            <Text style={[styles.visibilityBannerText, { color: '#F5A623' }]}>
              {t('createPost.hostSuccessMessage')}
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Scrivi una descrizione..."
            placeholderTextColor={placeholderColor}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            blurOnSubmit={false}
          />
          {imageUri ? (
            <View style={styles.imageWrap}>
              <Image source={{ uri: imageUri }} style={styles.preview} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={removeImage}
              >
                <Ionicons name="close-circle" size={28} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addPhoto, { borderColor: placeholderColor }]}
              onPress={pickImage}
            >
              <Ionicons name="image-outline" size={40} color={placeholderColor} />
              <Text style={[styles.addPhotoText, { color: placeholderColor }]}>
                Aggiungi foto
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            onPress={handlePublish}
            loading={loading}
            disabled={loading}
            size="lg"
            style={styles.publishBtn}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : profile?.role === 'creator' || profile?.role === 'jolly' ? (
              t('createPost.publishButton')
            ) : (
              t('createPost.publishButtonHost')
            )}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.md,
  },
  cancelButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  cancelText: { ...theme.typography.body, fontWeight: '600' },
  headerTitle: { ...theme.typography.headline, fontWeight: '700' },
  headerRight: { width: 60 },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.xl,
  },
  input: {
    ...theme.typography.body,
    minHeight: Platform.OS === 'ios' ? 120 : 100,
    maxHeight: 200,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  imageWrap: { position: 'relative', marginBottom: theme.spacing.lg },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: theme.borderRadius.lg,
  },
  removeImage: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  addPhoto: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: { ...theme.typography.subheadline, marginTop: theme.spacing.sm },
  footer: {
    padding: theme.spacing.screenPadding,
  },
  publishBtn: { width: '100%' },
  visibilityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: theme.spacing.screenPadding,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  visibilityBannerText: {
    ...theme.typography.caption1,
    flex: 1,
    lineHeight: 16,
  },
});
