/**
 * Host: genera link per viaggiatori (struttura, date, ospiti, note)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import { createTravelerBookingLink } from '../../services/travelerLink.service';
import type { Property } from '../../types/property';
import type { ProfileScreenProps } from '../../types/navigation';

export default function HostTravelerLinkScreen({ navigation }: ProfileScreenProps<'HostTravelerLink'>) {
  const { isDark } = useTheme();
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const [structures, setStructures] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [maxGuests, setMaxGuests] = useState('4');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    PropertiesService.getPropertiesByHost(user.id)
      .then((list) => {
        setStructures(list);
        if (list[0]) setPropertyId(list[0].id);
      })
      .catch(() => setStructures([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? theme.colors.dark.card : theme.colors.light.card;

  const handleGenerate = async () => {
    if (!user?.id || !propertyId || profile?.role !== 'host') return;
    const guests = Math.max(1, parseInt(maxGuests, 10) || 4);
    setSubmitting(true);
    try {
      const { shareUrl } = await createTravelerBookingLink({
        hostId: user.id,
        propertyId,
        dateFrom: dateFrom.trim() || null,
        dateTo: dateTo.trim() || null,
        maxGuests: guests,
        travelerNotesHint: notes.trim() || null,
      });
      setLastUrl(shareUrl);
      await Clipboard.setStringAsync(shareUrl);
      Alert.alert(t('travelerLink.title'), t('travelerLink.copied'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('traveler_booking_links') || msg.includes('schema cache')) {
        Alert.alert(
          t('common.error'),
          'Esegui lo script SQL supabase-traveler-booking-links.sql sul progetto Supabase.'
        );
      } else {
        Alert.alert(t('common.error'), msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('travelerLink.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.hint, { color: secondary }]}>{t('travelerLink.subtitle')}</Text>

          {structures.length === 0 ? (
            <Text style={[styles.empty, { color: secondary }]}>{t('travelerLink.noStructures')}</Text>
          ) : (
            <>
              <Text style={[styles.label, { color: textColor }]}>{t('travelerLink.selectStructure')}</Text>
              {structures.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.structRow,
                    { backgroundColor: cardBg, borderColor: propertyId === p.id ? theme.colors.primary.blue : 'transparent' },
                  ]}
                  onPress={() => setPropertyId(p.id)}
                >
                  <Ionicons
                    name={propertyId === p.id ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={propertyId === p.id ? theme.colors.primary.blue : secondary}
                  />
                  <Text style={[styles.structTitle, { color: textColor }]} numberOfLines={2}>
                    {p.title || p.city || '—'}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.label, { color: textColor }]}>{t('travelerLink.dates')}</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: secondary, backgroundColor: cardBg }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={secondary}
                  value={dateFrom}
                  onChangeText={setDateFrom}
                />
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: secondary, backgroundColor: cardBg }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={secondary}
                  value={dateTo}
                  onChangeText={setDateTo}
                />
              </View>

              <Text style={[styles.label, { color: textColor }]}>{t('travelerLink.guests')}</Text>
              <TextInput
                style={[styles.inputFull, { color: textColor, borderColor: secondary, backgroundColor: cardBg }]}
                keyboardType="number-pad"
                value={maxGuests}
                onChangeText={setMaxGuests}
              />

              <Text style={[styles.label, { color: textColor }]}>{t('travelerLink.notes')}</Text>
              <TextInput
                style={[styles.textArea, { color: textColor, borderColor: secondary, backgroundColor: cardBg }]}
                placeholder={t('travelerLink.notesPlaceholder')}
                placeholderTextColor={secondary}
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { opacity: submitting ? 0.75 : 1 }]}
                onPress={handleGenerate}
                disabled={submitting || !propertyId}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>{t('travelerLink.generate')}</Text>
                )}
              </TouchableOpacity>

              {lastUrl ? (
                <TouchableOpacity onPress={() => Clipboard.setStringAsync(lastUrl)}>
                  <Text style={styles.linkPreview} numberOfLines={2}>
                    {lastUrl}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '700' },
  content: { padding: theme.spacing.screenPadding, paddingBottom: 48 },
  hint: { ...theme.typography.subheadline, marginBottom: theme.spacing.lg },
  empty: { ...theme.typography.body },
  label: { ...theme.typography.subheadline, fontWeight: '600', marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  structRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    marginBottom: 8,
  },
  structTitle: { flex: 1, ...theme.typography.body },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10 },
  inputFull: { borderWidth: 1, borderRadius: 8, padding: 10 },
  textArea: { borderWidth: 1, borderRadius: 8, padding: 10, minHeight: 80, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: theme.colors.primary.blue,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  primaryBtnText: { color: '#fff', ...theme.typography.headline, fontWeight: '600' },
  linkPreview: { marginTop: theme.spacing.md, color: theme.colors.primary.blue, ...theme.typography.caption1 },
});
