/**
 * Host Property Calendar Sync Screen
 * Export Nomadiqe iCal + import Airbnb/Booking calendars for a single property.
 */

import React, { useCallback, useEffect, useState } from 'react';
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
import * as Clipboard from 'expo-clipboard';
import { format, parseISO } from 'date-fns';
import { it, enUS } from 'date-fns/locale';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import type { Property } from '../../types/property';
import type { HostDashboardScreenProps } from '../../types/navigation';
import { buildPropertyCalendarExportUrl } from '../../utils/propertyLinks';
import { getPropertyDisplayTitle } from '../../utils/propertyDisplay';

export default function HostPropertyCalendarSyncScreen({
  navigation,
  route,
}: HostDashboardScreenProps<'HostPropertyCalendarSync'>) {
  const { propertyId } = route.params;
  const { isDark } = useTheme();
  const { t, locale } = useI18n();
  const dateFnsLocale = locale === 'it' ? it : enUS;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [airbnbIcalUrl, setAirbnbIcalUrl] = useState('');
  const [bookingIcalUrl, setBookingIcalUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? theme.colors.dark.secondaryBackground : '#fff';
  const borderColor = isDark ? theme.colors.dark.separator : 'rgba(0,0,0,0.12)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#fafafa';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await PropertiesService.getProperty(propertyId);
      setProperty(p);
      setAirbnbIcalUrl(p?.airbnb_ical_import_url ?? '');
      setBookingIcalUrl(p?.booking_ical_import_url ?? '');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  const exportUrl = buildPropertyCalendarExportUrl(propertyId);
  const propertyLabel = property ? getPropertyDisplayTitle(property, t) : '';

  const saveUrls = async () => {
    if (!property?.id) return;
    setSaving(true);
    try {
      await PropertiesService.updatePropertyCalendarSync(property.id, {
        airbnb_ical_import_url: airbnbIcalUrl.trim() || null,
        booking_ical_import_url: bookingIcalUrl.trim() || null,
      });
      setProperty((p) =>
        p
          ? {
              ...p,
              airbnb_ical_import_url: airbnbIcalUrl.trim() || null,
              booking_ical_import_url: bookingIcalUrl.trim() || null,
            }
          : null
      );
      Alert.alert(t('propertyOnboarding.calendarLinksSavedTitle'), t('propertyOnboarding.calendarLinksSavedMessage'));
    } catch {
      Alert.alert(t('common.error'), t('propertyOnboarding.calendarLinksSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const syncNow = async () => {
    if (!property?.id) return;
    setSyncing(true);
    try {
      const result = await PropertiesService.triggerCalendarSync(property.id);
      if (result.ok) {
        const updated = await PropertiesService.getProperty(property.id);
        if (updated) setProperty(updated);
        Alert.alert(t('propertyOnboarding.calendarSyncDoneTitle'), t('propertyOnboarding.calendarSyncDoneMessage'));
      } else {
        Alert.alert(t('propertyOnboarding.calendarSyncTitle'), result.error ?? t('propertyOnboarding.tryAgainLater'));
      }
    } catch {
      Alert.alert(t('common.error'), t('propertyOnboarding.calendarSyncUnavailable'));
    } finally {
      setSyncing(false);
    }
  };

  const saveAndSync = async () => {
    if (!property?.id) return;
    setSaving(true);
    try {
      await PropertiesService.updatePropertyCalendarSync(property.id, {
        airbnb_ical_import_url: airbnbIcalUrl.trim() || null,
        booking_ical_import_url: bookingIcalUrl.trim() || null,
      });
      setProperty((p) =>
        p
          ? {
              ...p,
              airbnb_ical_import_url: airbnbIcalUrl.trim() || null,
              booking_ical_import_url: bookingIcalUrl.trim() || null,
            }
          : null
      );
    } catch {
      Alert.alert(t('common.error'), t('propertyOnboarding.calendarLinksSaveError'));
      setSaving(false);
      return;
    }
    setSaving(false);
    await syncNow();
  };

  const copyExportUrl = async () => {
    await Clipboard.setStringAsync(exportUrl);
    Alert.alert(t('propertyOnboarding.exportLinkCopiedTitle'), t('hostCalendarSync.exportCopyHint'));
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
      </View>
    );
  }

  const inputStyle = [styles.input, { backgroundColor: inputBg, borderColor, color: textColor }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('hostCalendarSync.title')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={26} color={textColor} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, { color: secondary }]}>{t('hostCalendarSync.intro')}</Text>
        <Text style={[styles.intro, { color: secondary }]}>{t('hostCalendarSync.introExport')}</Text>

        <TouchableOpacity onPress={() => navigation.navigate('HostDashboard', { section: 'your_properties' })}>
          <Text style={styles.dashboardLink}>{t('hostCalendarSync.dashboardLink')}</Text>
        </TouchableOpacity>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>{t('hostCalendarSync.exportSectionTitle')}</Text>
          <Text style={[styles.cardSubtitle, { color: secondary }]}>
            {t('hostCalendarSync.exportPropertyLabel', { name: propertyLabel })}
          </Text>
          <View style={[styles.urlRow, { borderColor }]}>
            <Text style={[styles.urlText, { color: textColor }]} selectable numberOfLines={2}>
              {exportUrl}
            </Text>
            <TouchableOpacity style={styles.copyBtn} onPress={copyExportUrl} activeOpacity={0.8}>
              <Text style={styles.copyBtnText}>{t('hostCalendarSync.copy')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.note, { color: secondary }]}>{t('hostCalendarSync.exportNote')}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>{t('hostCalendarSync.importSectionTitle')}</Text>
          <Text style={[styles.cardSubtitle, { color: secondary }]}>{t('hostCalendarSync.importSubtitle')}</Text>

          <Text style={[styles.fieldLabel, { color: textColor }]}>{t('hostCalendarSync.airbnbLabel')}</Text>
          <TextInput
            style={inputStyle}
            value={airbnbIcalUrl}
            onChangeText={setAirbnbIcalUrl}
            placeholder={t('hostCalendarSync.airbnbPlaceholder')}
            placeholderTextColor={secondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.fieldHint, { color: secondary }]}>{t('hostCalendarSync.airbnbHint')}</Text>

          <Text style={[styles.optionalLabel, { color: secondary }]}>{t('hostCalendarSync.optionalSecondPlatform')}</Text>
          <Text style={[styles.fieldLabel, { color: textColor }]}>{t('hostCalendarSync.bookingLabel')}</Text>
          <TextInput
            style={inputStyle}
            value={bookingIcalUrl}
            onChangeText={setBookingIcalUrl}
            placeholder={t('hostCalendarSync.bookingPlaceholder')}
            placeholderTextColor={secondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.fieldHint, { color: secondary }]}>{t('hostCalendarSync.bookingHint')}</Text>

          {property?.calendar_sync_last_at ? (
            <Text style={[styles.lastSync, { color: secondary }]}>
              {t('propertyOnboarding.lastSync', {
                date: format(parseISO(property.calendar_sync_last_at), 'd MMM yyyy, HH:mm', { locale: dateFnsLocale }),
              })}
            </Text>
          ) : null}

          <Button onPress={saveAndSync} disabled={saving || syncing} style={styles.primaryBtn}>
            {saving || syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              t('hostCalendarSync.saveAndSync')
            )}
          </Button>
          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor }]}
              onPress={saveUrls}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryBtnText, { color: textColor }]}>{t('hostCalendarSync.saveUrls')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor }]}
              onPress={syncNow}
              disabled={syncing || (!airbnbIcalUrl.trim() && !bookingIcalUrl.trim())}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryBtnText, { color: textColor }]}>{t('propertyOnboarding.syncNow')}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  },
  headerTitle: {
    ...theme.typography.title3,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    paddingRight: 12,
  },
  scrollContent: { padding: theme.spacing.screenPadding, paddingBottom: 80, gap: theme.spacing.md },
  intro: {
    ...theme.typography.caption2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  dashboardLink: {
    ...theme.typography.caption1,
    color: theme.colors.primary.blue,
    textDecorationLine: 'underline',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: 10,
  },
  cardTitle: {
    ...theme.typography.headline,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardSubtitle: {
    ...theme.typography.caption2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  urlText: {
    flex: 1,
    ...theme.typography.caption1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    textTransform: 'uppercase',
  },
  copyBtn: {
    backgroundColor: theme.colors.primary.blue,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  copyBtnText: { color: '#fff', fontWeight: '700', textTransform: 'uppercase' },
  note: {
    ...theme.typography.caption2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  fieldLabel: {
    ...theme.typography.caption1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  optionalLabel: {
    ...theme.typography.caption2,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  fieldHint: {
    ...theme.typography.caption2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...theme.typography.body,
  },
  lastSync: { ...theme.typography.caption1, marginTop: 4 },
  primaryBtn: { marginTop: 8 },
  secondaryRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { ...theme.typography.subheadline, fontWeight: '600', textTransform: 'uppercase' },
});
