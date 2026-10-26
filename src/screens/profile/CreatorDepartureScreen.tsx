/**
 * Creator: default departure city/airport + temporary travel windows (KOL&BED).
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format, isValid, parse } from 'date-fns';

import { Button, Input } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import {
  CreatorDepartureService,
  type CreatorDepartureWindow,
} from '../../services/creatorDeparture.service';
import type { ProfileScreenProps } from '../../types/navigation';

function parseDateInput(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy'];
  for (const fmt of formats) {
    const parsed = parse(trimmed, fmt, new Date());
    if (isValid(parsed)) return parsed;
  }
  return null;
}

function formatDateDisplay(iso: string): string {
  const d = parse(iso, 'yyyy-MM-dd', new Date());
  return isValid(d) ? format(d, 'MM/dd/yyyy') : iso;
}

export default function CreatorDepartureScreen({
  navigation,
}: ProfileScreenProps<'CreatorDeparture'>) {
  const { isDark } = useTheme();
  const { profile, refreshProfile } = useAuth();
  const { t } = useI18n();

  const [city, setCity] = useState('');
  const [iata, setIata] = useState('');
  const [windows, setWindows] = useState<CreatorDepartureWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingDefault, setSavingDefault] = useState(false);
  const [addingWindow, setAddingWindow] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [windowCity, setWindowCity] = useState('');
  const [windowIata, setWindowIata] = useState('');
  const [notes, setNotes] = useState('');

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : '#fff';
  const borderSoft = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const [defaults, windowList] = await Promise.all([
        CreatorDepartureService.loadDefault(profile.id, profile),
        CreatorDepartureService.loadWindows(profile.id),
      ]);
      setCity(defaults.city);
      setIata(defaults.iata);
      setWindows(windowList);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, profile?.location]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSaveDefault = async () => {
    if (!profile?.id) return;
    if (!city.trim()) {
      Alert.alert(t('common.error'), t('creatorDeparture.cityRequired'));
      return;
    }
    if (!/^[A-Z]{3}$/i.test(iata.trim())) {
      Alert.alert(t('common.error'), t('creator.airportInvalid'));
      return;
    }
    try {
      setSavingDefault(true);
      await CreatorDepartureService.saveDefault(profile.id, {
        city: city.trim(),
        iata: iata.trim().toUpperCase(),
      });
      await refreshProfile?.();
      Alert.alert(t('common.success'), t('creatorDeparture.saveDefaultSuccess'));
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : t('common.saveProfileError');
      Alert.alert(t('common.error'), message);
    } finally {
      setSavingDefault(false);
    }
  };

  const resetWindowForm = () => {
    setStartDate('');
    setEndDate('');
    setWindowCity('');
    setWindowIata('');
    setNotes('');
  };

  const handleAddWindow = async () => {
    if (!profile?.id) return;
    const start = parseDateInput(startDate);
    const end = parseDateInput(endDate);
    if (!start || !end) {
      Alert.alert(t('common.error'), t('creatorDeparture.invalidDates'));
      return;
    }
    if (start > end) {
      Alert.alert(t('common.error'), t('creatorDeparture.invalidDateRange'));
      return;
    }
    if (!/^[A-Z]{3}$/i.test(windowIata.trim())) {
      Alert.alert(t('common.error'), t('creator.airportInvalid'));
      return;
    }
    try {
      setAddingWindow(true);
      const updated = await CreatorDepartureService.addWindow(profile.id, {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        city: windowCity.trim(),
        iata: windowIata.trim().toUpperCase(),
        notes: notes.trim() || null,
      });
      setWindows(updated);
      resetWindowForm();
      Alert.alert(t('common.success'), t('creatorDeparture.addWindowSuccess'));
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : t('common.error');
      Alert.alert(t('common.error'), message);
    } finally {
      setAddingWindow(false);
    }
  };

  const handleRemoveWindow = (windowId: string) => {
    if (!profile?.id) return;
    Alert.alert(t('common.delete'), t('creatorDeparture.removeConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const updated = await CreatorDepartureService.removeWindow(profile.id, windowId);
          setWindows(updated);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={16} color={theme.colors.primary.blue} />
            <Text style={styles.backLinkText}>{t('creatorDeparture.backToDashboard')}</Text>
          </TouchableOpacity>

          <View style={styles.pageHeader}>
            <View style={styles.titleRow}>
              <Ionicons name="airplane-outline" size={22} color={textColor} />
              <Text style={[styles.pageTitle, { color: textColor }]}>{t('creatorDeparture.title')}</Text>
            </View>
            <Text style={[styles.pageHint, { color: secondary }]}>{t('creatorDeparture.pageHint')}</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary.blue} style={styles.loader} />
          ) : (
            <>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderSoft }]}>
                <Text style={[styles.cardTitle, { color: textColor }]}>
                  {t('creatorDeparture.defaultTitle')}
                </Text>
                <Text style={[styles.cardHint, { color: secondary }]}>
                  {t('creatorDeparture.defaultHint')}
                </Text>

                <Input
                  label={`${t('creator.cityOfResidence')} *`}
                  value={city}
                  onChangeText={setCity}
                  placeholder={t('creatorDeparture.cityPlaceholder')}
                />
                <Input
                  label={`${t('creator.nearestAirport')} *`}
                  value={iata}
                  onChangeText={(v) => setIata(v.toUpperCase().slice(0, 3))}
                  autoCapitalize="characters"
                  maxLength={3}
                  placeholder={t('creatorDeparture.iataPlaceholder')}
                  helperText={t('creator.nearestAirportHint')}
                />

                <Button
                  onPress={handleSaveDefault}
                  loading={savingDefault}
                  disabled={savingDefault}
                  style={styles.primaryAction}
                >
                  {t('creatorDeparture.saveDefault')}
                </Button>
              </View>

              <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderSoft }]}>
                <Text style={[styles.cardTitle, { color: textColor }]}>
                  {t('creatorDeparture.temporaryTitle')}
                </Text>
                <Text style={[styles.cardHint, { color: secondary }]}>
                  {t('creatorDeparture.temporaryHint')}
                </Text>

                <View style={styles.row}>
                  <View style={styles.half}>
                    <Input
                      label={`${t('creatorDeparture.startLabel')} *`}
                      value={startDate}
                      onChangeText={setStartDate}
                      placeholder={t('creatorDeparture.datePlaceholder')}
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.half}>
                    <Input
                      label={`${t('creatorDeparture.endLabel')} *`}
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder={t('creatorDeparture.datePlaceholder')}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.half}>
                    <Input
                      label={t('creatorDeparture.windowCityLabel')}
                      value={windowCity}
                      onChangeText={setWindowCity}
                      placeholder={t('creatorDeparture.windowCityPlaceholder')}
                    />
                  </View>
                  <View style={styles.half}>
                    <Input
                      label={`${t('creatorDeparture.windowIataLabel')} *`}
                      value={windowIata}
                      onChangeText={(v) => setWindowIata(v.toUpperCase().slice(0, 3))}
                      autoCapitalize="characters"
                      maxLength={3}
                      placeholder={t('creatorDeparture.iataPlaceholder')}
                    />
                  </View>
                </View>

                <Input
                  label={t('creatorDeparture.notesLabel')}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t('creatorDeparture.notesPlaceholder')}
                  multiline
                  numberOfLines={3}
                  style={styles.notesInput}
                />

                <Button
                  onPress={handleAddWindow}
                  loading={addingWindow}
                  disabled={addingWindow}
                  style={styles.primaryAction}
                >
                  {t('creatorDeparture.addWindow')}
                </Button>
              </View>

              {windows.length === 0 ? (
                <Text style={[styles.footerHint, { color: secondary }]}>
                  {t('creatorDeparture.noWindows')}
                </Text>
              ) : (
                <View style={styles.windowList}>
                  {windows.map((w) => (
                    <View
                      key={w.id}
                      style={[styles.windowCard, { backgroundColor: cardBg, borderColor: borderSoft }]}
                    >
                      <View style={styles.windowCardHeader}>
                        <Text style={[styles.windowDates, { color: textColor }]}>
                          {formatDateDisplay(w.startDate)} – {formatDateDisplay(w.endDate)}
                        </Text>
                        <TouchableOpacity onPress={() => handleRemoveWindow(w.id)} hitSlop={8}>
                          <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.windowMeta, { color: secondary }]}>
                        {[w.city, w.iata].filter(Boolean).join(' · ').toUpperCase()}
                      </Text>
                      {w.notes ? (
                        <Text style={[styles.windowNotes, { color: secondary }]}>{w.notes}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing['3xl'],
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.lg,
  },
  backLinkText: {
    ...theme.typography.caption1,
    fontWeight: '800',
    color: theme.colors.primary.blue,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pageHeader: { marginBottom: theme.spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  pageTitle: {
    ...theme.typography.title2,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  pageHint: {
    ...theme.typography.caption1,
    textTransform: 'uppercase',
    lineHeight: 18,
  },
  loader: { marginVertical: theme.spacing.xl },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardTitle: {
    ...theme.typography.headline,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardHint: {
    ...theme.typography.caption1,
    marginTop: 6,
    marginBottom: 12,
    textTransform: 'uppercase',
    lineHeight: 18,
  },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  primaryAction: { marginTop: 4, alignSelf: 'flex-start' },
  footerHint: {
    ...theme.typography.caption1,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 4,
    lineHeight: 18,
  },
  windowList: { gap: 10, marginTop: 4 },
  windowCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  windowCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  windowDates: { ...theme.typography.subheadline, fontWeight: '700', flex: 1 },
  windowMeta: { ...theme.typography.caption1, fontWeight: '700', marginTop: 4 },
  windowNotes: { ...theme.typography.caption1, marginTop: 6 },
});
