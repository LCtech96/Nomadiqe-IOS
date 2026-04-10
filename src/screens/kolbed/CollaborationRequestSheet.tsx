/**
 * Modale: invio richiesta collaborazione con note opzionali (biglietti, jolly dell'host, testo).
 * Creator → host: calendario struttura + date richieste.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  startOfDay,
} from 'date-fns';
import { it as localeIt, enUS as localeEn } from 'date-fns/locale';

import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { CollaborationService, type CollaborationRequestExtras } from '../../services/collaboration.service';
import {
  PropertiesService,
  type AvailabilityStatus,
} from '../../services/properties.service';
import type { UserProfile } from '../../types';
import type { Property } from '../../types/property';

export interface CollaborationRequestSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Profilo verso cui si richiede la collaborazione */
  target: UserProfile | null;
  /** Chi invia: host (verso creator/jolly) o creator (verso host) */
  initiatedBy: 'host' | 'creator';
  currentUserId: string;
  onSuccess: () => void;
}

const VALID_STATUSES: AvailabilityStatus[] = ['available', 'occupied', 'closed', 'collab_available'];
function normalizeStatus(s: string | undefined): AvailabilityStatus {
  return (s && VALID_STATUSES.includes(s as AvailabilityStatus) ? s : 'available') as AvailabilityStatus;
}

export function CollaborationRequestSheet({
  visible,
  onClose,
  target,
  initiatedBy,
  currentUserId,
  onSuccess,
}: CollaborationRequestSheetProps) {
  const { isDark } = useTheme();
  const { t, locale } = useI18n();
  const [notes, setNotes] = useState('');
  const [coverFlights, setCoverFlights] = useState(false);
  const [jollyOptions, setJollyOptions] = useState<UserProfile[]>([]);
  const [selectedJollyIds, setSelectedJollyIds] = useState<string[]>([]);
  const [loadingJollies, setLoadingJollies] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [hostProperties, setHostProperties] = useState<Property[]>([]);
  const [loadingHostProperties, setLoadingHostProperties] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [availability, setAvailability] = useState<
    Record<string, { status: AvailabilityStatus; price_override: number | null }>
  >({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedCalendarDates, setSelectedCalendarDates] = useState<string[]>([]);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? theme.colors.dark.card : theme.colors.light.card;

  const hostIdForJollyList = initiatedBy === 'creator' && target?.role === 'host' ? target.id : null;
  const showCreatorHostCalendar = initiatedBy === 'creator' && target?.role === 'host';
  const dateLocale = locale === 'it' ? localeIt : localeEn;
  const weekDays =
    locale === 'it'
      ? ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    if (!visible || !hostIdForJollyList) {
      setJollyOptions([]);
      setSelectedJollyIds([]);
      return;
    }
    setLoadingJollies(true);
    CollaborationService.getAcceptedJollyProfilesForHost(hostIdForJollyList)
      .then(setJollyOptions)
      .catch(() => setJollyOptions([]))
      .finally(() => setLoadingJollies(false));
  }, [visible, hostIdForJollyList]);

  useEffect(() => {
    if (!visible || !showCreatorHostCalendar || !target?.id) {
      setHostProperties([]);
      setSelectedPropertyId(null);
      return;
    }
    setLoadingHostProperties(true);
    PropertiesService.getActivePropertiesForHost(target.id)
      .then((list) => {
        setHostProperties(list);
        setSelectedPropertyId(list[0]?.id ?? null);
      })
      .catch(() => {
        setHostProperties([]);
        setSelectedPropertyId(null);
      })
      .finally(() => setLoadingHostProperties(false));
  }, [visible, showCreatorHostCalendar, target?.id]);

  useEffect(() => {
    setSelectedCalendarDates([]);
    setAvailability({});
  }, [selectedPropertyId]);

  useEffect(() => {
    if (!visible || !selectedPropertyId || !showCreatorHostCalendar) return;
    let cancelled = false;
    setLoadingAvailability(true);
    const month = calendarMonth;
    const rangeStart = startOfMonth(month);
    const rangeEnd = endOfMonth(month);
    const start = format(rangeStart, 'yyyy-MM-dd');
    const end = format(rangeEnd, 'yyyy-MM-dd');
    PropertiesService.getAvailability(selectedPropertyId, start, end)
      .then((rows) => {
        if (cancelled) return;
        const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
        const rowMap = new Map(rows.map((r) => [r.date, r]));
        setAvailability((prev) => {
          const next = { ...prev };
          days.forEach((d) => {
            delete next[format(d, 'yyyy-MM-dd')];
          });
          days.forEach((d) => {
            const k = format(d, 'yyyy-MM-dd');
            const r = rowMap.get(k);
            next[k] = r
              ? { status: normalizeStatus(r.status), price_override: r.price_override ?? null }
              : { status: 'available', price_override: null };
          });
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) setAvailability({});
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, selectedPropertyId, calendarMonth, showCreatorHostCalendar]);

  useEffect(() => {
    if (!visible) {
      setNotes('');
      setCoverFlights(false);
      setSelectedJollyIds([]);
      setHostProperties([]);
      setSelectedPropertyId(null);
      setCalendarMonth(new Date());
      setAvailability({});
      setSelectedCalendarDates([]);
    }
  }, [visible]);

  const toggleJolly = (id: string) => {
    setSelectedJollyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = (monthStart.getDay() + 6) % 7;
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const handleCalendarDayPress = useCallback(
    (date: Date) => {
      const key = format(date, 'yyyy-MM-dd');
      const today = startOfDay(new Date());
      if (startOfDay(date) < today) {
        Alert.alert(t('common.error'), t('kolbed.collabPastDate'));
        return;
      }
      const info = availability[key];
      const status = normalizeStatus(info?.status);
      if (status === 'occupied' || status === 'closed') {
        Alert.alert(t('common.error'), t('kolbed.collabDateNotSelectable'));
        return;
      }
      setSelectedCalendarDates((prev) =>
        prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key].sort()
      );
    },
    [availability, t]
  );

  const handleSubmit = async () => {
    if (!target) return;
    if (showCreatorHostCalendar && hostProperties.length > 0) {
      if (!selectedPropertyId || selectedCalendarDates.length === 0) {
        Alert.alert(t('common.error'), t('kolbed.collabErrorSelectDates'));
        return;
      }
    }
    const extras: CollaborationRequestExtras = {
      notes: notes.trim() || undefined,
      cover_flights: initiatedBy === 'creator' ? coverFlights : undefined,
      selected_jolly_ids:
        initiatedBy === 'creator' && selectedJollyIds.length > 0 ? selectedJollyIds : undefined,
      property_id:
        showCreatorHostCalendar && hostProperties.length > 0 && selectedPropertyId
          ? selectedPropertyId
          : undefined,
      requested_dates:
        showCreatorHostCalendar && hostProperties.length > 0 && selectedCalendarDates.length > 0
          ? [...selectedCalendarDates].sort()
          : undefined,
    };
    setSubmitting(true);
    try {
      if (initiatedBy === 'host') {
        await CollaborationService.requestCollaborationWithExtras(currentUserId, target.id, extras);
      } else {
        await CollaborationService.creatorRequestCollaborationWithExtras(currentUserId, target.id, extras);
      }
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      const isDuplicate =
        err?.code === '23505' ||
        (typeof err?.message === 'string' && err.message.includes('duplicate key'));
      if (isDuplicate) {
        onSuccess();
        onClose();
        return;
      }
      console.error(e);
      Alert.alert(t('common.error'), (err?.message as string) || t('kolbed.collabRequestError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!target) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: bg }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: textColor }]}>{t('kolbed.collabSheetTitle')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.targetHint, { color: secondary }]}>
            {target.full_name || target.username || '—'}
          </Text>

          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
            {initiatedBy === 'creator' && target.role === 'host' && (
              <>
                <View style={styles.switchRow}>
                  <Text style={[styles.label, { color: textColor }]}>{t('kolbed.collabCoverFlights')}</Text>
                  <Switch value={coverFlights} onValueChange={setCoverFlights} />
                </View>
                <Text style={[styles.sectionLabel, { color: secondary }]}>{t('kolbed.collabJollyExperiences')}</Text>
                {loadingJollies ? (
                  <ActivityIndicator color={theme.colors.primary.blue} style={{ marginVertical: 12 }} />
                ) : jollyOptions.length === 0 ? (
                  <Text style={[styles.hint, { color: secondary }]}>{t('kolbed.collabNoJollies')}</Text>
                ) : (
                  <View style={styles.chips}>
                    {jollyOptions.map((j) => (
                      <TouchableOpacity
                        key={j.id}
                        style={[
                          styles.chip,
                          { backgroundColor: cardBg, borderColor: selectedJollyIds.includes(j.id) ? theme.colors.primary.blue : secondary },
                          selectedJollyIds.includes(j.id) && { backgroundColor: 'rgba(79,70,229,0.2)' },
                        ]}
                        onPress={() => toggleJolly(j.id)}
                      >
                        <Text style={[styles.chipText, { color: textColor }]} numberOfLines={1}>
                          {j.full_name || j.username || 'Jolly'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text style={[styles.sectionLabel, { color: secondary, marginTop: theme.spacing.md }]}>
                  {t('kolbed.collabCalendarTitle')}
                </Text>
                {loadingHostProperties ? (
                  <Text style={[styles.hint, { color: secondary }]}>{t('kolbed.collabLoadingStructures')}</Text>
                ) : hostProperties.length === 0 ? (
                  <Text style={[styles.hint, { color: secondary }]}>{t('kolbed.collabNoStructuresForHost')}</Text>
                ) : (
                  <>
                    <Text style={[styles.hint, { color: secondary, marginBottom: 8 }]}>
                      {t('kolbed.collabSelectStructure')}
                    </Text>
                    <View style={styles.chips}>
                      {hostProperties.map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: cardBg,
                              borderColor: selectedPropertyId === p.id ? theme.colors.primary.blue : secondary,
                            },
                            selectedPropertyId === p.id && { backgroundColor: 'rgba(79,70,229,0.2)' },
                          ]}
                          onPress={() => setSelectedPropertyId(p.id)}
                        >
                          <Text style={[styles.chipText, { color: textColor }]} numberOfLines={2}>
                            {p.title || '—'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {loadingAvailability ? (
                      <ActivityIndicator color={theme.colors.primary.blue} style={{ marginVertical: 16 }} />
                    ) : (
                      <>
                        <View style={styles.calendarNav}>
                          <TouchableOpacity onPress={() => setCalendarMonth((m) => subMonths(m, 1))}>
                            <Ionicons name="chevron-back" size={24} color={textColor} />
                          </TouchableOpacity>
                          <Text style={[styles.monthTitle, { color: textColor }]}>
                            {format(calendarMonth, 'MMMM yyyy', { locale: dateLocale })}
                          </Text>
                          <TouchableOpacity onPress={() => setCalendarMonth((m) => addMonths(m, 1))}>
                            <Ionicons name="chevron-forward" size={24} color={textColor} />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.weekdayRow}>
                          {weekDays.map((w) => (
                            <Text key={w} style={[styles.weekday, { color: secondary }]}>
                              {w}
                            </Text>
                          ))}
                        </View>
                        <View style={styles.daysGrid}>
                          {paddedDays.map((date, i) => {
                            if (!date) return <View key={`pad-${i}`} style={styles.dayCell} />;
                            const key = format(date, 'yyyy-MM-dd');
                            const isSelected = selectedCalendarDates.includes(key);
                            const info = availability[key];
                            const status = normalizeStatus(info?.status);
                            const isCurrentMonth = isSameMonth(date, calendarMonth);
                            const dayBg =
                              status === 'occupied'
                                ? styles.dayOccupied
                                : status === 'closed'
                                  ? styles.dayClosed
                                  : status === 'collab_available'
                                    ? styles.dayCollab
                                    : null;
                            const dayTextColor =
                              status === 'closed'
                                ? '#fff'
                                : status === 'collab_available'
                                  ? '#fff'
                                  : status === 'occupied'
                                    ? isDark
                                      ? '#ffb3ae'
                                      : '#8b0000'
                                    : isCurrentMonth
                                      ? textColor
                                      : secondary;
                            return (
                              <TouchableOpacity
                                key={key}
                                style={[
                                  styles.dayCell,
                                  !isCurrentMonth && styles.dayOtherMonth,
                                  dayBg,
                                  isSelected && styles.daySelected,
                                ]}
                                onPress={() => handleCalendarDayPress(date)}
                              >
                                <Text
                                  style={[styles.dayText, { color: isSelected ? '#fff' : dayTextColor }]}
                                >
                                  {format(date, 'd')}
                                </Text>
                                {info?.price_override != null && (
                                  <Text
                                    style={[
                                      styles.dayPrice,
                                      {
                                        color: isSelected
                                          ? '#fff'
                                          : status === 'closed' || status === 'collab_available'
                                            ? 'rgba(255,255,255,0.9)'
                                            : secondary,
                                      },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    €{info.price_override}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        <View style={styles.legendRow}>
                          <View style={styles.legendItem}>
                            <View
                              style={[styles.legendDot, { borderWidth: 1, borderColor: secondary, backgroundColor: '#fff' }]}
                            />
                            <Text style={[styles.legendText, { color: secondary }]}>
                              {t('kolbed.collabLegendFree')}
                            </Text>
                          </View>
                          <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#c0392b' }]} />
                            <Text style={[styles.legendText, { color: secondary }]}>
                              {t('kolbed.collabLegendBooked')}
                            </Text>
                          </View>
                          <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#1a1a1a' }]} />
                            <Text style={[styles.legendText, { color: secondary }]}>
                              {t('kolbed.collabLegendClosed')}
                            </Text>
                          </View>
                          <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#27ae60' }]} />
                            <Text style={[styles.legendText, { color: secondary }]}>
                              {t('kolbed.collabLegendCollab')}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.hint, { color: secondary, marginTop: 8 }]}>
                          {t('kolbed.collabSelectDatesHint')}
                        </Text>
                        {selectedCalendarDates.length > 0 && (
                          <Text style={[styles.selectedHint, { color: textColor }]}>
                            {t('kolbed.collabSelectedDatesCount', { count: selectedCalendarDates.length })}
                          </Text>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            <Text style={[styles.sectionLabel, { color: secondary }]}>{t('kolbed.collabNotes')}</Text>
            <TextInput
              style={[styles.input, { color: textColor, borderColor: secondary, backgroundColor: cardBg }]}
              placeholder={t('kolbed.collabNotesPlaceholder')}
              placeholderTextColor={secondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={500}
            />
          </ScrollView>

          <TouchableOpacity
            style={[styles.primaryBtn, { opacity: submitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{t('kolbed.collabSendRequest')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.xl,
    maxHeight: '88%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  sheetTitle: { ...theme.typography.title3, fontWeight: '700' },
  targetHint: { ...theme.typography.subheadline, marginBottom: theme.spacing.sm },
  scroll: { maxHeight: 520 },
  sectionLabel: { ...theme.typography.subheadline, fontWeight: '600', marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  label: { ...theme.typography.body, flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  hint: { ...theme.typography.caption1, marginBottom: theme.spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    maxWidth: '100%',
  },
  chipText: { ...theme.typography.caption1, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    minHeight: 100,
    padding: 12,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.lg,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary.blue,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  primaryBtnText: { color: '#fff', ...theme.typography.headline, fontWeight: '600' },
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  monthTitle: { ...theme.typography.headline, fontWeight: '600' },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center', ...theme.typography.caption1 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  dayOtherMonth: { opacity: 0.4 },
  daySelected: { backgroundColor: theme.colors.primary.blue, borderRadius: 8 },
  dayOccupied: { backgroundColor: '#c0392b', borderRadius: 8 },
  dayClosed: { backgroundColor: '#1a1a1a', borderRadius: 8 },
  dayCollab: { backgroundColor: '#27ae60', borderRadius: 8 },
  dayText: { ...theme.typography.footnote, fontWeight: '600' },
  dayPrice: { fontSize: 9, marginTop: 0 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 4 },
  legendText: { ...theme.typography.caption1 },
  selectedHint: { ...theme.typography.caption1, marginTop: 10, fontWeight: '600' },
});
