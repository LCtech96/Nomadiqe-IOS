/**
 * Request Support Screen
 * Form: dispositivo, tipo richiesta, messaggio, max 5 screenshot
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
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Button } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { SupportService } from '../../services/support.service';
import type { ProfileScreenProps } from '../../types/navigation';

const REQUEST_TYPES = [
  'support.typeTechnical',
  'support.typeAccount',
  'support.typePayment',
  'support.typeOther',
];

const MAX_SCREENSHOTS = 5;

export default function RequestSupportScreen({
  navigation,
}: ProfileScreenProps<'RequestSupport'>) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [device, setDevice] = useState('');
  const [requestType, setRequestType] = useState(REQUEST_TYPES[0]);
  const [message, setMessage] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const addScreenshot = async () => {
    if (screenshots.length >= MAX_SCREENSHOTS) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.photoPermissionTitle'), t('common.photoPermissionMessage'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0] || !user?.id) return;
    setUploading(true);
    try {
      const url = await SupportService.uploadSupportImage(
        user.id,
        result.assets[0].uri,
        result.assets[0].base64 ?? null
      );
      setScreenshots((prev) => [...prev, url].slice(0, MAX_SCREENSHOTS));
    } catch (e) {
      Alert.alert(t('common.error'), t('common.photoError'));
    } finally {
      setUploading(false);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const msg = message.trim();
    if (!msg || !user?.id) {
      Alert.alert(t('common.error'), t('support.messageRequired'));
      return;
    }
    setLoading(true);
    try {
      const created = await SupportService.createTicket(user.id, {
        device: device.trim(),
        requestType: t(requestType),
        message: msg,
        imageUris: screenshots,
      });
      navigation.replace('SupportConversation', { ticketId: created.id });
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('support.requestSupport')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.label, { color: textColor }]}>{t('support.device')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: cardBg, color: textColor }]}
          placeholder={t('support.devicePlaceholder')}
          placeholderTextColor={secondary}
          value={device}
          onChangeText={setDevice}
        />

        <Text style={[styles.label, { color: textColor }]}>{t('support.requestType')}</Text>
        <View style={styles.typeRow}>
          {REQUEST_TYPES.map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.typeChip,
                {
                  backgroundColor: requestType === key ? theme.colors.primary.blue : cardBg,
                  borderColor: requestType === key ? theme.colors.primary.blue : 'transparent',
                },
              ]}
              onPress={() => setRequestType(key)}
            >
              <Text
                style={[
                  styles.typeChipText,
                  { color: requestType === key ? '#fff' : textColor },
                ]}
                numberOfLines={1}
              >
                {t(key)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: textColor }]}>{t('support.message')}</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: cardBg, color: textColor }]}
          placeholder={t('support.messagePlaceholder')}
          placeholderTextColor={secondary}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
        />

        <Text style={[styles.label, { color: textColor }]}>
          {t('support.screenshots')} ({screenshots.length}/{MAX_SCREENSHOTS})
        </Text>
        <View style={styles.thumbRow}>
          {screenshots.map((uri, i) => (
            <View key={i} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
              <TouchableOpacity
                style={styles.thumbRemove}
                onPress={() => removeScreenshot(i)}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {screenshots.length < MAX_SCREENSHOTS && (
            <TouchableOpacity
              style={[styles.thumbAdd, { borderColor: secondary }]}
              onPress={addScreenshot}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={theme.colors.primary.blue} />
              ) : (
                <Ionicons name="camera" size={28} color={secondary} />
              )}
            </TouchableOpacity>
          )}
        </View>

        <Button
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !message.trim()}
          size="lg"
          style={styles.submitBtn}
        >
          {t('support.send')}
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
  label: { ...theme.typography.subheadline, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...theme.typography.body,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
  },
  typeChipText: { ...theme.typography.subheadline },
  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  thumbWrap: { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbAdd: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtn: { marginTop: 28 },
});
