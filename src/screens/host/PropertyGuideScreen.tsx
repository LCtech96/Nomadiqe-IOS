/**
 * Property Guide Screen
 * Grid view of guest guide sections. Host can edit + share link. Creator read-only.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';

import { PropertyGuideGrid } from '../../components/property/PropertyGuideGrid';
import { AiSupportWidget } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import { PropertyGuideService } from '../../services/propertyGuide.service';
import { SECTION_TO_FIELD } from '../../types/propertyGuide';
import type { PropertyGuide, PropertyGuideSectionId } from '../../types/propertyGuide';
import type { Property } from '../../types/property';
import type { ProfileScreenProps } from '../../types/navigation';

export default function PropertyGuideScreen({
  navigation,
  route,
}: ProfileScreenProps<'PropertyGuide'>) {
  const { propertyId, token, readOnly: readOnlyParam } = route.params;
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();

  const [property, setProperty] = useState<Property | null>(null);
  const [guide, setGuide] = useState<PropertyGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const readOnly = readOnlyParam === true || !isHost;

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const prop = await PropertiesService.getProperty(propertyId);
      setProperty(prop);

      const host = await PropertyGuideService.isPropertyHost(user.id, propertyId);
      setIsHost(host);

      if (host) {
        const g = await PropertyGuideService.getOrCreateGuide(propertyId, user.id);
        setGuide(g);
        const existing = await PropertyGuideService.getExistingShareLink(propertyId, user.id);
        if (existing) setShareUrl(existing.shareUrl);
      } else {
        const allowed = await PropertyGuideService.canCreatorViewGuide(user.id, propertyId, token);
        if (!allowed) {
          setAccessDenied(true);
          return;
        }
        const g = await PropertyGuideService.getGuide(propertyId);
        setGuide(g);
      }
    } catch {
      Alert.alert(t('common.error'), t('propertyGuide.loadError'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, propertyId, token, t]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id || loading) return;
      (async () => {
        try {
          if (isHost) {
            const g = await PropertyGuideService.getOrCreateGuide(propertyId, user.id);
            setGuide(g);
          } else {
            const g = await PropertyGuideService.getGuide(propertyId);
            setGuide(g);
          }
        } catch {
          /* ignore refresh errors */
        }
      })();
    }, [user?.id, propertyId, isHost, loading])
  );

  const handleSectionPress = (sectionId: PropertyGuideSectionId) => {
    navigation.navigate('PropertyGuideSection', {
      propertyId,
      sectionId,
      readOnly,
      token,
    });
  };

  const hasContent = (sectionId: PropertyGuideSectionId): boolean => {
    if (!guide) return false;
    const field = SECTION_TO_FIELD[sectionId];
    return Boolean(guide[field]?.trim());
  };

  const handleCopyShareLink = async () => {
    if (!user?.id) return;
    try {
      let url = shareUrl;
      if (!url) {
        const created = await PropertyGuideService.createShareLink(propertyId, user.id);
        url = created.shareUrl;
        setShareUrl(url);
      }
      await Clipboard.setStringAsync(url);
      Alert.alert(t('propertyGuide.linkCopiedTitle'), t('propertyGuide.linkCopiedMessage'));
    } catch {
      Alert.alert(t('common.error'), t('propertyGuide.shareLinkError'));
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
      </View>
    );
  }

  if (accessDenied) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('propertyGuide.title')}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={48} color={secondary} />
          <Text style={[styles.deniedTitle, { color: textColor }]}>{t('propertyGuide.accessDeniedTitle')}</Text>
          <Text style={[styles.deniedMessage, { color: secondary }]}>{t('propertyGuide.accessDeniedMessage')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const propertyTitle = property?.title || t('propertyOnboarding.structureFallbackTitle');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          {t('propertyGuide.title')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isHost && (
          <View style={[styles.shareCard, { backgroundColor: cardBg }]}>
            <View style={styles.shareCardHeader}>
              <Ionicons name="link-outline" size={20} color={theme.colors.primary.blue} />
              <Text style={[styles.shareCardTitle, { color: textColor }]}>{t('propertyGuide.shareLinkTitle')}</Text>
            </View>
            <Text style={[styles.shareCardHint, { color: secondary }]}>{t('propertyGuide.shareLinkHint')}</Text>
            <TouchableOpacity style={styles.shareBtn} onPress={handleCopyShareLink}>
              <Ionicons name="copy-outline" size={18} color={theme.colors.primary.blue} />
              <Text style={[styles.shareBtnText, { color: theme.colors.primary.blue }]}>
                {t('propertyGuide.copyShareLink')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isHost && (
          <View style={[styles.shareCard, { backgroundColor: cardBg }]}>
            <View style={styles.shareCardHeader}>
              <Ionicons name="sparkles-outline" size={20} color={theme.colors.primary.blue} />
              <Text style={[styles.shareCardTitle, { color: textColor }]}>
                {t('propertyGuide.aiPreviewTitle')}
              </Text>
            </View>
            <Text style={[styles.shareCardHint, { color: secondary }]}>
              {t('propertyGuide.aiPreviewHint')}
            </Text>
            <TouchableOpacity style={styles.shareBtn} onPress={() => setAiPreviewOpen(true)}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.colors.primary.blue} />
              <Text style={[styles.shareBtnText, { color: theme.colors.primary.blue }]}>
                {t('propertyGuide.aiPreviewCta')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {readOnly && (
          <View style={[styles.readOnlyBanner, { backgroundColor: isDark ? 'rgba(79,70,229,0.15)' : 'rgba(79,70,229,0.08)' }]}>
            <Ionicons name="eye-outline" size={16} color={theme.colors.primary.blue} />
            <Text style={[styles.readOnlyBannerText, { color: theme.colors.primary.blue }]}>
              {t('propertyGuide.readOnlyBanner')}
            </Text>
          </View>
        )}

        <PropertyGuideGrid
          propertyTitle={propertyTitle}
          onSectionPress={handleSectionPress}
          hasContent={hasContent}
        />
      </ScrollView>

      {isHost && (
        <AiSupportWidget
          propertyId={propertyId}
          showFab={false}
          isOpen={aiPreviewOpen}
          onOpenChange={setAiPreviewOpen}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.screenPadding },
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
  scrollContent: { paddingHorizontal: theme.spacing.screenPadding, paddingBottom: 40 },
  shareCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  shareCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  shareCardTitle: { ...theme.typography.subheadline, fontWeight: '600' },
  shareCardHint: { ...theme.typography.caption1, marginBottom: 12, lineHeight: 18 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shareBtnText: { ...theme.typography.subheadline, fontWeight: '600' },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  readOnlyBannerText: { ...theme.typography.caption1, fontWeight: '500', flex: 1 },
  deniedTitle: { ...theme.typography.headline, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  deniedMessage: { ...theme.typography.body, marginTop: 8, textAlign: 'center', lineHeight: 22 },
});
