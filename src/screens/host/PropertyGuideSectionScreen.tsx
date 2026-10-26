/**
 * Property Guide Section Screen
 * Host: editable text area. Creator: read-only view.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PROPERTY_GUIDE_SECTIONS } from '../../constants/propertyGuide';
import { PropertyGuideService } from '../../services/propertyGuide.service';
import { SECTION_TO_FIELD } from '../../types/propertyGuide';
import type { ProfileScreenProps } from '../../types/navigation';

export default function PropertyGuideSectionScreen({
  navigation,
  route,
}: ProfileScreenProps<'PropertyGuideSection'>) {
  const { propertyId, sectionId, readOnly, token } = route.params;
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();

  const section = PROPERTY_GUIDE_SECTIONS.find((s) => s.id === sectionId);
  const fieldKey = SECTION_TO_FIELD[sectionId];

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const editable = isHost && !readOnly;

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const host = await PropertyGuideService.isPropertyHost(user.id, propertyId);
        setIsHost(host);

        if (!host) {
          const allowed = await PropertyGuideService.canCreatorViewGuide(user.id, propertyId, token);
          if (!allowed) {
            Alert.alert(t('propertyGuide.accessDeniedTitle'), t('propertyGuide.accessDeniedMessage'), [
              { text: t('common.ok'), onPress: () => navigation.goBack() },
            ]);
            return;
          }
        }

        const guide = host
          ? await PropertyGuideService.getOrCreateGuide(propertyId, user.id)
          : await PropertyGuideService.getGuide(propertyId);

        if (guide) {
          setContent(guide[fieldKey] ?? '');
        }
      } catch {
        Alert.alert(t('common.error'), t('propertyGuide.loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, propertyId, sectionId, token]);

  const handleSave = async () => {
    if (!user?.id || !editable) return;
    setSaving(true);
    try {
      await PropertyGuideService.updateGuide(propertyId, user.id, { [fieldKey]: content.trim() });
      Alert.alert(t('common.success'), t('propertyGuide.saved'));
      navigation.goBack();
    } catch {
      Alert.alert(t('common.error'), t('propertyGuide.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!section) {
    navigation.goBack();
    return null;
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          {t(section.labelKey)}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {editable ? (
          <>
            <Text style={[styles.hint, { color: secondary }]}>{t(section.placeholderKey)}</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: cardBg, color: textColor }]}
              placeholder={t(section.placeholderKey)}
              placeholderTextColor={secondary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
            <Button onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : t('common.save')}
            </Button>
          </>
        ) : (
          <View style={[styles.readOnlyBox, { backgroundColor: cardBg }]}>
            {content.trim() ? (
              <Text style={[styles.readOnlyText, { color: textColor }]}>{content}</Text>
            ) : (
              <Text style={[styles.emptyText, { color: secondary }]}>{t('propertyGuide.noInfoYet')}</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '700', flex: 1, marginHorizontal: 12, textAlign: 'center' },
  headerRight: { width: 24 },
  scroll: { flex: 1 },
  scrollContent: { padding: theme.spacing.screenPadding, paddingBottom: 40 },
  hint: { ...theme.typography.caption1, marginBottom: 12 },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 200,
    ...theme.typography.body,
    lineHeight: 22,
  },
  saveBtn: { marginTop: 20 },
  readOnlyBox: {
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
  },
  readOnlyText: { ...theme.typography.body, lineHeight: 24 },
  emptyText: { ...theme.typography.body, fontStyle: 'italic' },
});
