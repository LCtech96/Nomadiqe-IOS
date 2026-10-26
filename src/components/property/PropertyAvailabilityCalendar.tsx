/**
 * Property availability calendar — month grid with price/status editing.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
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
} from 'date-fns';
import { it, enUS } from 'date-fns/locale';

import { Button } from '../ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService, type AvailabilityStatus } from '../../services/properties.service';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const VALID_STATUSES: AvailabilityStatus[] = ['available', 'occupied', 'closed', 'collab_available'];

function normalizeStatus(s: string | undefined): AvailabilityStatus {
  return (s && VALID_STATUSES.includes(s as AvailabilityStatus) ? s : 'available') as AvailabilityStatus;
}

interface PropertyAvailabilityCalendarProps {
  propertyId: string;
}

export function PropertyAvailabilityCalendar({ propertyId }: PropertyAvailabilityCalendarProps) {
  const { isDark } = useTheme();
  const { t, locale } = useI18n();
  const dateFnsLocale = locale === 'it' ? it : enUS;

  const [month, setMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [availability, setAvailability] = useState<
    Record<string, { status: AvailabilityStatus; price_override: number | null }>
  >({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStatus, setModalStatus] = useState<AvailabilityStatus>('available');
  const [modalPrice, setModalPrice] = useState('');
  const [savingAvailability, setSavingAvailability] = useState(false);
  const lastTapRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;

  useEffect(() => {
    const start = format(startOfMonth(month), 'yyyy-MM-dd');
    const end = format(endOfMonth(month), 'yyyy-MM-dd');
    PropertiesService.getAvailability(propertyId, start, end)
      .then((rows) => {
        const map: Record<string, { status: AvailabilityStatus; price_override: number | null }> = {};
        rows.forEach((r) => {
          map[r.date] = { status: normalizeStatus(r.status), price_override: r.price_override ?? null };
        });
        setAvailability((prev) => ({ ...prev, ...map }));
      })
      .catch(() => {});
  }, [propertyId, month]);

  const monthStart = startOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(month) });
  const startPad = (monthStart.getDay() + 6) % 7;
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const handleDayPress = async (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    const now = Date.now();
    const isDoubleTap = lastTapRef.current.key === key && now - lastTapRef.current.time < 400;
    lastTapRef.current = { key, time: now };

    if (isDoubleTap) {
      try {
        await PropertiesService.setAvailability(
          propertyId,
          [key],
          'collab_available',
          availability[key]?.price_override ?? null
        );
        setAvailability((prev) => ({
          ...prev,
          [key]: { status: 'collab_available', price_override: prev[key]?.price_override ?? null },
        }));
      } catch {
        /* ignore */
      }
      return;
    }
    setSelectedDates((prev) => (prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]));
  };

  const openModal = () => {
    const first = selectedDates[0];
    const current = first ? availability[first] : null;
    setModalStatus(normalizeStatus(current?.status));
    setModalPrice(current?.price_override != null ? String(current.price_override) : '');
    setModalVisible(true);
  };

  const saveAvailability = async () => {
    if (selectedDates.length === 0) return;
    setSavingAvailability(true);
    try {
      const price = modalPrice.trim() ? parseFloat(modalPrice.replace(',', '.')) : null;
      await PropertiesService.setAvailability(propertyId, selectedDates, modalStatus, price);
      selectedDates.forEach((d) => {
        setAvailability((prev) => ({ ...prev, [d]: { status: modalStatus, price_override: price } }));
      });
      setSelectedDates([]);
      setModalVisible(false);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string'
          ? (e as { message: string }).message.trim()
          : '';
      Alert.alert(
        t('common.error'),
        msg ? `${msg}\n\n${t('propertyOnboarding.availabilitySaveErrorDetail')}` : t('propertyOnboarding.availabilitySaveError')
      );
    } finally {
      setSavingAvailability(false);
    }
  };

  const statusLabels: Record<AvailabilityStatus, string> = {
    available: t('propertyOnboarding.legendFree'),
    occupied: t('propertyOnboarding.legendBooked'),
    closed: t('propertyOnboarding.legendClosed'),
    collab_available: t('propertyOnboarding.legendCollab'),
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>{t('propertyOnboarding.availabilityTitle')}</Text>
      <View style={styles.calendarNav}>
        <TouchableOpacity onPress={() => setMonth((m) => subMonths(m, 1))}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: textColor }]}>
          {format(month, 'MMMM yyyy', { locale: dateFnsLocale })}
        </Text>
        <TouchableOpacity onPress={() => setMonth((m) => addMonths(m, 1))}>
          <Ionicons name="chevron-forward" size={24} color={textColor} />
        </TouchableOpacity>
      </View>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={[styles.weekday, { color: secondary }]}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.daysGrid}>
        {paddedDays.map((date, i) => {
          if (!date) return <View key={`pad-${i}`} style={styles.dayCell} />;
          const key = format(date, 'yyyy-MM-dd');
          const isSelected = selectedDates.includes(key);
          const info = availability[key];
          const status = normalizeStatus(info?.status);
          const isCurrentMonth = isSameMonth(date, month);
          const dayBg =
            status === 'occupied'
              ? styles.dayOccupied
              : status === 'closed'
                ? styles.dayClosed
                : status === 'collab_available'
                  ? styles.dayCollab
                  : null;
          const dayTextColor =
            status === 'closed' || status === 'collab_available'
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
              style={[styles.dayCell, !isCurrentMonth && styles.dayOtherMonth, dayBg, isSelected && styles.daySelected]}
              onPress={() => handleDayPress(date)}
            >
              <Text style={[styles.dayText, { color: isSelected ? '#fff' : dayTextColor }]}>{format(date, 'd')}</Text>
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
        {(['available', 'occupied', 'closed', 'collab_available'] as AvailabilityStatus[]).map((status) => (
          <View key={status} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                status === 'available'
                  ? { backgroundColor: '#fff', borderWidth: 1, borderColor: secondary }
                  : {
                      backgroundColor:
                        status === 'occupied' ? '#c0392b' : status === 'closed' ? '#1a1a1a' : '#27ae60',
                    },
              ]}
            />
            <Text style={[styles.legendText, { color: secondary }]}>{statusLabels[status]}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.doubleTapHint, { color: secondary }]}>{t('propertyOnboarding.doubleTapHint')}</Text>
      {selectedDates.length > 0 && (
        <>
          <Text style={[styles.selectedHint, { color: secondary }]}>
            {t('propertyOnboarding.selectedDatesCount', { count: selectedDates.length })}
          </Text>
          <Button onPress={openModal} style={styles.setPriceBtn}>
            {t('propertyOnboarding.setPriceAndAvailability')}
          </Button>
        </>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: bg }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: textColor }]}>{t('propertyOnboarding.availabilityModalTitle')}</Text>
            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: secondary }]}>{t('propertyOnboarding.statusLabel')}</Text>
              <View style={[styles.statusRow, styles.statusWrap]}>
                {VALID_STATUSES.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusBtn,
                      modalStatus === status &&
                        (status === 'closed'
                          ? styles.statusBtnClosed
                          : status === 'collab_available'
                            ? styles.statusBtnCollab
                            : styles.statusBtnActive),
                    ]}
                    onPress={() => setModalStatus(status)}
                  >
                    <Text style={[styles.statusBtnText, { color: modalStatus === status ? '#fff' : textColor }]}>
                      {statusLabels[status]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.modalRow}>
              <Text style={[styles.modalLabel, { color: secondary }]}>{t('propertyOnboarding.priceForSelectedDates')}</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7', color: textColor }]}
                placeholder={t('propertyOnboarding.pricePlaceholder')}
                placeholderTextColor={secondary}
                value={modalPrice}
                onChangeText={setModalPrice}
                keyboardType="decimal-pad"
              />
            </View>
            <Button onPress={saveAvailability} disabled={savingAvailability} style={styles.modalSave}>
              {savingAvailability ? <ActivityIndicator size="small" color="#fff" /> : t('propertyOnboarding.save')}
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: { ...theme.typography.headline, fontWeight: '600', marginBottom: theme.spacing.md },
  calendarNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthTitle: { ...theme.typography.headline, fontWeight: '600' },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center', ...theme.typography.caption1 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', padding: 2 },
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
  doubleTapHint: { ...theme.typography.caption1, marginTop: 6 },
  selectedHint: { ...theme.typography.caption1, marginTop: 12 },
  setPriceBtn: { marginTop: 8 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: theme.spacing.screenPadding, paddingBottom: 40 },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.5)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { ...theme.typography.title2, fontWeight: '700', marginBottom: 20 },
  modalRow: { marginBottom: 16 },
  modalLabel: { ...theme.typography.caption1, marginBottom: 6 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusWrap: { flexWrap: 'wrap' },
  statusBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: 'rgba(128,128,128,0.2)' },
  statusBtnActive: { backgroundColor: theme.colors.primary.blue },
  statusBtnClosed: { backgroundColor: '#1a1a1a' },
  statusBtnCollab: { backgroundColor: '#27ae60' },
  statusBtnText: { ...theme.typography.body, fontWeight: '600', fontSize: 13 },
  modalInput: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, ...theme.typography.body },
  modalSave: { marginTop: 8 },
});
