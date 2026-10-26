/**
 * Settings Screen
 * Menu impostazioni: tema, assistenza
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { SupportService } from '../../services/support.service';
import { AiSupportWidget } from '../../components/ui/AiSupport';
import type { ProfileScreenProps } from '../../types/navigation';

export default function SettingsScreen({ navigation }: ProfileScreenProps<'Settings'>) {
  const { profile } = useAuth();
  const { isDark, setTheme } = useTheme();
  const { t } = useI18n();
  const [supportUnread, setSupportUnread] = useState(0);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) return;
      SupportService.getUnreadSupportCount(profile.id).then(setSupportUnread);
    }, [profile?.id])
  );

  const backgroundColor = isDark
    ? theme.colors.dark.background
    : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondaryColor = isDark
    ? theme.colors.dark.secondaryLabel
    : theme.colors.light.secondaryLabel;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('settings.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('SupportConversation', {})}
        >
          <View style={styles.rowLeft}>
            <Ionicons
              name="help-circle-outline"
              size={24}
              color={theme.colors.primary.blue}
            />
            <Text style={[styles.rowText, { color: textColor }]}>
              {t('settings.requestSupport')}
            </Text>
            {supportUnread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{supportUnread > 99 ? '99+' : supportUnread}</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={secondaryColor} />
        </TouchableOpacity>

        {/* AI Assistant Row */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => setIsAiModalOpen(true)}
        >
          <View style={styles.rowLeft}>
            <Ionicons
              name="sparkles"
              size={24}
              color={theme.colors.primary.blue}
            />
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowText, { color: textColor }]}>
                {t('aiSupport.settingsTitle') || 'Chat with Madi'}
              </Text>
              <Text style={[styles.rowSubtext, { color: secondaryColor }]}>
                {t('aiSupport.settingsSubtitle') || 'Our virtual AI assistant'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={secondaryColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setTheme(isDark ? 'light' : 'dark')}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={24}
            color={theme.colors.primary.blue}
          />
          <Text style={[styles.rowText, { color: textColor }]}>
            {isDark ? t('common.themeLight') : t('common.themeDark')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={secondaryColor} />
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Action Button & Minimizable Modal */}
      <AiSupportWidget
        isOpen={isAiModalOpen}
        onOpenChange={setIsAiModalOpen}
      />
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
  headerRight: { width: 24 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.screenPadding },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: theme.spacing.md },
  rowTextWrap: { flex: 1 },
  rowText: { ...theme.typography.body, flex: 1, fontWeight: '500' },
  rowSubtext: { ...theme.typography.caption1, marginTop: 2 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
