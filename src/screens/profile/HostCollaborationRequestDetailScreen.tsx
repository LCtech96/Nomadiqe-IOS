/**
 * Host: dettaglio richiesta di collaborazione + form (date, servizi, descrizione, programma parziale, contenuti)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, Button, Input } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import {
  CollaborationService,
  type CollaborationRequestWithCreator,
  type CollaborationRequestDetails,
  type KolbedPartialType,
  type CollaborationRequestExtras,
} from '../../services/collaboration.service';
import { ProfilesService } from '../../services/profiles.service';
import { containsLink } from '../../utils/bio';
import { theme } from '../../theme';
import type { ProfileScreenProps } from '../../types/navigation';

const ACCESSORY_OPTIONS = [
  { key: 'transfer', labelKey: 'collabRequestDetail.transfer' },
  { key: 'boat_tour', labelKey: 'collabRequestDetail.boatTour' },
  { key: 'horse_ride', labelKey: 'collabRequestDetail.horseRide' },
  { key: 'other', labelKey: 'collabRequestDetail.other' },
] as const;

const KOLBED_PARTIAL_OPTIONS: { value: KolbedPartialType; labelKey: string }[] = [
  { value: 'full', labelKey: 'collabRequestDetail.kolbedFull' },
  { value: 'cleaning_only', labelKey: 'collabRequestDetail.kolbedCleaningOnly' },
  { value: '50_discount', labelKey: 'collabRequestDetail.kolbed50Discount' },
  { value: 'half_coverage', labelKey: 'collabRequestDetail.kolbedHalfCoverage' },
];

const MAX_DESCRIPTION = 500;

export default function HostCollaborationRequestDetailScreen({
  navigation,
  route,
}: ProfileScreenProps<'HostCollaborationRequestDetail'>) {
  const { requestId } = route.params;
  const { isDark } = useTheme();
  const { profile } = useAuth();
  const { t } = useI18n();
  const [request, setRequest] = useState<CollaborationRequestWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [accessoryServices, setAccessoryServices] = useState<string[]>([]);
  const [paidCollaboration, setPaidCollaboration] = useState(false);
  const [description, setDescription] = useState('');
  const [kolbedPartialType, setKolbedPartialType] = useState<KolbedPartialType | null>(null);
  const [contentQuantity, setContentQuantity] = useState('');
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [jollyNames, setJollyNames] = useState<string[]>([]);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    CollaborationService.getRequestById(requestId)
      .then((r) => {
        setRequest(r);
        if (r) {
          setDateFrom(r.preferred_dates_from ?? '');
          setDateTo(r.preferred_dates_to ?? '');
          setAccessoryServices(r.accessory_services ?? []);
          setPaidCollaboration(r.paid_collaboration ?? false);
          setDescription(r.description ?? '');
          setKolbedPartialType((r.kolbed_partial_type as KolbedPartialType) ?? null);
          setContentQuantity(r.content_quantity_desired ?? '');
        }
      })
      .catch(() => setRequest(null))
      .finally(() => setLoading(false));
  }, [requestId]);

  useEffect(() => {
    if (!request?.request_extras) {
      setJollyNames([]);
      return;
    }
    const raw = request.request_extras as CollaborationRequestExtras | Record<string, unknown>;
    const ids = Array.isArray((raw as { selected_jolly_ids?: string[] }).selected_jolly_ids)
      ? (raw as { selected_jolly_ids: string[] }).selected_jolly_ids
      : [];
    if (ids.length === 0) {
      setJollyNames([]);
      return;
    }
    ProfilesService.getProfilesByIds(ids)
      .then((list) => setJollyNames(list.map((p) => p.full_name || p.username || 'Jolly')))
      .catch(() => setJollyNames([]));
  }, [request?.request_extras, request?.id]);

  const toggleAccessory = (key: string) => {
    setAccessoryServices((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!request || !profile?.id || profile.id !== request.host_id) return;
    const desc = description.slice(0, MAX_DESCRIPTION);
    if (desc && containsLink(desc)) {
      setDescriptionError(t('collabRequestDetail.descriptionNoLinks'));
      return;
    }
    setDescriptionError(null);
    setSaving(true);
    try {
      const details: CollaborationRequestDetails = {
        preferred_dates_from: dateFrom || undefined,
        preferred_dates_to: dateTo || undefined,
        accessory_services: accessoryServices.length ? accessoryServices : undefined,
        paid_collaboration: paidCollaboration,
        description: desc || undefined,
        kolbed_partial_type: kolbedPartialType ?? undefined,
        content_quantity_desired: contentQuantity || undefined,
      };
      await CollaborationService.updateRequestDetails(requestId, profile.id, details);
      Alert.alert('', t('collabRequestDetail.saved'));
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? theme.colors.dark.card : theme.colors.light.card;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
      </View>
    );
  }
  if (!request) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('collabRequestDetail.title')}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: secondary }]}>{t('common.error')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const creator = request.creator;
  const pendingFromCreator =
    request.initiated_by === 'creator' && request.status === 'pending' && profile?.id === request.host_id;
  const extras = (request.request_extras || {}) as CollaborationRequestExtras;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          {t('collabRequestDetail.title')}
        </Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {pendingFromCreator && (
          <>
            <Text style={[styles.sectionLabel, { color: textColor }]}>{t('collabRequestDetail.pendingHostActions')}</Text>
            <Text style={[styles.hintSmall, { color: secondary }]}>{t('collabRequestDetail.counterYellowHint')}</Text>
            <View style={styles.hostActionRow}>
              <TouchableOpacity
                style={[styles.hostActBtn, { backgroundColor: '#FF3B30' }]}
                disabled={acting}
                onPress={async () => {
                  if (!profile?.id) return;
                  setActing(true);
                  try {
                    await CollaborationService.hostRejectCollaborationRequest(request.id, profile.id);
                    navigation.goBack();
                  } catch (e) {
                    Alert.alert(t('common.error'), (e as Error).message);
                  } finally {
                    setActing(false);
                  }
                }}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.hostActBtn, { backgroundColor: '#FFCC00' }]}
                disabled={acting}
                onPress={() => {
                  Alert.alert(
                    t('collabRequestDetail.pendingHostActions'),
                    undefined,
                    [
                      {
                        text: t('collabRequestDetail.kolbedHalfCoverage'),
                        onPress: async () => {
                          if (!profile?.id) return;
                          setActing(true);
                          try {
                            await CollaborationService.hostCounterOfferCollaboration(request.id, profile.id, 'half_coverage');
                            navigation.goBack();
                          } catch (e) {
                            Alert.alert(t('common.error'), (e as Error).message);
                          } finally {
                            setActing(false);
                          }
                        },
                      },
                      {
                        text: t('collabRequestDetail.kolbed50Discount'),
                        onPress: async () => {
                          if (!profile?.id) return;
                          setActing(true);
                          try {
                            await CollaborationService.hostCounterOfferCollaboration(request.id, profile.id, '50_discount');
                            navigation.goBack();
                          } catch (e) {
                            Alert.alert(t('common.error'), (e as Error).message);
                          } finally {
                            setActing(false);
                          }
                        },
                      },
                      { text: t('common.cancel'), style: 'cancel' },
                    ]
                  );
                }}
              >
                <Ionicons name="remove-outline" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.hostActBtn, { backgroundColor: '#34C759' }]}
                disabled={acting}
                onPress={async () => {
                  if (!profile?.id) return;
                  setActing(true);
                  try {
                    await CollaborationService.hostAcceptCollaborationRequest(request.id, profile.id);
                    navigation.goBack();
                  } catch (e) {
                    Alert.alert(t('common.error'), (e as Error).message);
                  } finally {
                    setActing(false);
                  }
                }}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: cardBg, marginBottom: theme.spacing.lg }]}>
              <Text style={[styles.sectionLabel, { color: textColor, marginBottom: 8 }]}>
                {t('collabRequestDetail.creatorRequestSummary')}
              </Text>
              {extras.cover_flights ? (
                <Text style={{ color: textColor, marginBottom: 6 }}>✓ {t('collabRequestDetail.coverFlightsYes')}</Text>
              ) : null}
              {jollyNames.length > 0 ? (
                <Text style={{ color: secondary, marginBottom: 6 }}>
                  {t('collabRequestDetail.selectedJollies')}: {jollyNames.join(', ')}
                </Text>
              ) : null}
              {extras.notes ? (
                <Text style={{ color: textColor }}>{extras.notes}</Text>
              ) : null}
            </View>
          </>
        )}

        {/* Creator/Jolly summary */}
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <Avatar uri={creator?.avatar_url} size={64} />
          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryName, { color: textColor }]} numberOfLines={1}>
              {creator?.full_name || creator?.username || '—'}
            </Text>
            <Text style={[styles.summaryRole, { color: secondary }]}>
              {creator?.role === 'creator' ? 'Creator' : 'Jolly'}
              {creator?.role === 'creator' && (creator?.followers_count ?? 0) > 0
                ? ` · ${(creator.followers_count ?? 0) >= 1000 ? `${((creator.followers_count ?? 0) / 1000).toFixed(1)}K` : creator.followers_count} follower`
                : ''}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: secondary }]}>{t('collabRequestDetail.preferredDates')}</Text>
        <View style={styles.row}>
          <Input
            containerStyle={styles.halfInput}
            placeholder={t('collabRequestDetail.from')}
            value={dateFrom}
            onChangeText={setDateFrom}
            style={{ color: textColor }}
            placeholderTextColor={secondary}
          />
          <Input
            containerStyle={styles.halfInput}
            placeholder={t('collabRequestDetail.to')}
            value={dateTo}
            onChangeText={setDateTo}
            style={{ color: textColor }}
            placeholderTextColor={secondary}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: secondary }]}>{t('collabRequestDetail.accessoryServices')}</Text>
        <View style={styles.chipsRow}>
          {ACCESSORY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                { backgroundColor: accessoryServices.includes(opt.key) ? theme.colors.primary.blue : cardBg, borderColor: secondary },
              ]}
              onPress={() => toggleAccessory(opt.key)}
            >
              <Text style={[styles.chipText, { color: accessoryServices.includes(opt.key) ? '#fff' : textColor }]}>
                {t(opt.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: textColor }]}>{t('collabRequestDetail.paidCollaboration')}</Text>
          <Switch value={paidCollaboration} onValueChange={setPaidCollaboration} trackColor={{ false: secondary, true: theme.colors.primary.blue }} thumbColor="#fff" />
        </View>
        <Text style={[styles.hint, { color: secondary }]}>{t('collabRequestDetail.paidCollaborationHint')}</Text>

        <Text style={[styles.sectionLabel, { color: secondary }]}>{t('collabRequestDetail.description')}</Text>
        <Input
          multiline
          numberOfLines={4}
          placeholder={t('collabRequestDetail.descriptionPlaceholder')}
          value={description}
          onChangeText={(v) => { setDescription(v.slice(0, MAX_DESCRIPTION)); setDescriptionError(null); }}
          error={descriptionError ?? undefined}
          helperText={`${description.length}/${MAX_DESCRIPTION}. ${t('collabRequestDetail.descriptionNoLinks')}`}
          style={{ color: textColor }}
          placeholderTextColor={secondary}
        />

        <Text style={[styles.sectionLabel, { color: secondary }]}>{t('collabRequestDetail.kolbedPartial')}</Text>
        <View style={styles.chipsRow}>
          {KOLBED_PARTIAL_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                { backgroundColor: kolbedPartialType === opt.value ? theme.colors.primary.blue : cardBg, borderColor: secondary },
              ]}
              onPress={() => setKolbedPartialType(opt.value)}
            >
              <Text style={[styles.chipText, { color: kolbedPartialType === opt.value ? '#fff' : textColor }]}>
                {t(opt.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: secondary }]}>{t('collabRequestDetail.contentQuantity')}</Text>
        <Input
          placeholder={t('collabRequestDetail.contentQuantityPlaceholder')}
          value={contentQuantity}
          onChangeText={setContentQuantity}
          style={{ color: textColor }}
          placeholderTextColor={secondary}
        />

        <Button onPress={handleSave} loading={saving} style={styles.saveButton}>
          {t('collabRequestDetail.save')}
        </Button>
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
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '700', flex: 1 },
  headerRight: { width: 24 },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.screenPadding, paddingBottom: theme.spacing['3xl'] },
  emptyText: { ...theme.typography.body },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  summaryInfo: { flex: 1 },
  summaryName: { ...theme.typography.title3, fontWeight: '600' },
  summaryRole: { ...theme.typography.caption1, marginTop: 2 },
  sectionLabel: { ...theme.typography.subheadline, fontWeight: '600', marginBottom: theme.spacing.sm },
  row: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  halfInput: { flex: 1 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  chipText: { ...theme.typography.subheadline },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xs },
  switchLabel: { ...theme.typography.body, flex: 1 },
  hint: { ...theme.typography.caption1, marginBottom: theme.spacing.md },
  saveButton: { marginTop: theme.spacing.xl },
  hintSmall: { ...theme.typography.caption1, marginBottom: theme.spacing.sm },
  hostActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  hostActBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
