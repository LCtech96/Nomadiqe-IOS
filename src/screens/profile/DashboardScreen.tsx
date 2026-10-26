/**
 * Dashboard Screen
 * Schermata principale per host / creator / jolly: ruolo + lista host/creator invitati
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';

import { Avatar } from '../../components/ui';
import { SocialPlatformIcon } from '../../components/creator/SocialPlatformIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { getInvitedByMe, createInvite, type InvitationWithInvited } from '../../services/invitations.service';
import {
  CollaborationService,
  type CollaborationRequestWithCreator,
  type CollaborationRequestWithHost,
} from '../../services/collaboration.service';
import {
  CreatorDashboardAnalyticsService,
  type CreatorAnalyticsUploadKey,
  type CreatorAnalyticsUploads,
} from '../../services/creatorDashboardAnalytics.service';
import { theme } from '../../theme';
import type { ProfileScreenProps } from '../../types/navigation';
import {
  JollyLocalServicesService,
  type JollyServiceMediaRow,
  type LocalJollyService,
} from '../../services/jollyLocalServices.service';
import { PropertiesService } from '../../services/properties.service';
import {
  countLinkedSocialAccounts,
  getInviteProgressPercent,
  listLinkedSocialAccounts,
  socialDisplayHandle,
  summarizeCreatorCollaborations,
} from '../../utils/creatorDashboard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOST_GRID_GAP = 10;
const HOST_GRID_PAD = theme.spacing.screenPadding;
const HOST_TILE_W = (SCREEN_WIDTH - HOST_GRID_PAD * 2 - HOST_GRID_GAP * 2) / 3;
const CREATOR_STAT_W = (SCREEN_WIDTH - HOST_GRID_PAD * 2 - HOST_GRID_GAP * 2) / 3;
const CREATOR_HALF_W = (SCREEN_WIDTH - HOST_GRID_PAD * 2 - HOST_GRID_GAP) / 2;

const CREATOR_ANALYTICS_ROWS: { key: CreatorAnalyticsUploadKey; labelKey: string }[] = [
  { key: 'last_90_days', labelKey: 'dashboard.creatorAnalyticsLast90Days' },
  { key: 'last_month', labelKey: 'dashboard.creatorAnalyticsLastMonth' },
  { key: 'last_week', labelKey: 'dashboard.creatorAnalyticsLastWeek' },
  { key: 'pie_chart_views', labelKey: 'dashboard.creatorAnalyticsPieChart' },
  { key: 'accounts_reached', labelKey: 'dashboard.creatorAnalyticsAccountsReached' },
  { key: 'content_reels', labelKey: 'dashboard.creatorAnalyticsReels' },
  { key: 'content_posts', labelKey: 'dashboard.creatorAnalyticsPosts' },
  { key: 'content_stories', labelKey: 'dashboard.creatorAnalyticsStories' },
  { key: 'profile_activity', labelKey: 'dashboard.creatorAnalyticsProfileActivity' },
  { key: 'profile_visits', labelKey: 'dashboard.creatorAnalyticsProfileVisits' },
  { key: 'external_link_taps', labelKey: 'dashboard.creatorAnalyticsExternalLinks' },
  { key: 'audience_demographics_30d', labelKey: 'dashboard.creatorAnalyticsAudience30d' },
  { key: 'audience_demographics_7d', labelKey: 'dashboard.creatorAnalyticsAudience7d' },
];

type JollySubcategory =
  | 'cleaner'
  | 'property_manager'
  | 'fornitore'
  | 'restaurant'
  | 'excursions'
  | 'home_products';

const JOLLY_SUBCATEGORY_LABEL_KEYS: Record<JollySubcategory, string> = {
  cleaner: 'onboarding.jollyCleaner',
  property_manager: 'onboarding.jollyPropertyManager',
  fornitore: 'onboarding.jollyFornitore',
  restaurant: 'onboarding.jollyRestaurant',
  excursions: 'onboarding.jollyExcursions',
  home_products: 'onboarding.jollyHomeProducts',
};

export default function DashboardScreen({
  navigation,
}: ProfileScreenProps<'Dashboard'>) {
  const { isDark } = useTheme();
  const { profile, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [invitedList, setInvitedList] = useState<InvitationWithInvited[]>([]);
  const [loadingInvited, setLoadingInvited] = useState(false);
  const [collabRequests, setCollabRequests] = useState<Awaited<ReturnType<typeof CollaborationService.getRequestsByHost>>>([]);
  const [loadingCollab, setLoadingCollab] = useState(false);
  const [pendingFromCreators, setPendingFromCreators] = useState<CollaborationRequestWithCreator[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [activePropertyCount, setActivePropertyCount] = useState(0);

  const inviteRole = profile?.role === 'host' ? 'host' : profile?.role === 'creator' ? 'creator' : null;
  const isHost = profile?.role === 'host';
  const isCreator = profile?.role === 'creator';
  const invitedEmptyRoleLabel = inviteRole === 'host' ? t('settings.inviteHost') : inviteRole === 'creator' ? t('settings.inviteCreator') : '';

  const [creatorCollabs, setCreatorCollabs] = useState<CollaborationRequestWithHost[]>([]);
  const [loadingCreatorCollabs, setLoadingCreatorCollabs] = useState(false);
  const [loadingCreatorInvite, setLoadingCreatorInvite] = useState(false);
  const [analyticsUploads, setAnalyticsUploads] = useState<CreatorAnalyticsUploads | null>(null);
  const [uploadingAnalyticsKey, setUploadingAnalyticsKey] = useState<CreatorAnalyticsUploadKey | null>(null);

  const linkedSocialCount = useMemo(
    () => countLinkedSocialAccounts(profile?.social_links),
    [profile?.social_links]
  );
  const linkedSocialAccounts = useMemo(() => {
    const accounts = listLinkedSocialAccounts(profile?.social_links);
    if (accounts.length > 0) return accounts;
    const instagram = profile?.social_links?.instagram?.trim();
    if (instagram) return [{ platform: 'instagram' as const, url: instagram }];
    if (profile?.username) {
      return [{ platform: 'instagram' as const, url: `@${profile.username}` }];
    }
    return [{ platform: 'instagram' as const, url: '' }];
  }, [profile?.social_links, profile?.username]);
  const creatorCollabSummary = useMemo(
    () => summarizeCreatorCollaborations(creatorCollabs),
    [creatorCollabs]
  );

  useEffect(() => {
    if (!profile?.id || !inviteRole) return;
    setLoadingInvited(true);
    getInvitedByMe(profile.id, inviteRole)
      .then(setInvitedList)
      .catch(() => setInvitedList([]))
      .finally(() => setLoadingInvited(false));
  }, [profile?.id, inviteRole]);

  const loadCreatorData = useCallback(async () => {
    if (!profile?.id || profile.role !== 'creator') return;
    setLoadingCreatorCollabs(true);
    setLoadingInvited(true);
    try {
      const [collabs, uploads, invited] = await Promise.all([
        CollaborationService.getRequestsByCreator(profile.id),
        CreatorDashboardAnalyticsService.load(profile.id),
        getInvitedByMe(profile.id, 'creator'),
      ]);
      setCreatorCollabs(collabs);
      setAnalyticsUploads(uploads);
      setInvitedList(invited);
    } catch {
      setCreatorCollabs([]);
      setAnalyticsUploads(null);
      setInvitedList([]);
    } finally {
      setLoadingCreatorCollabs(false);
      setLoadingInvited(false);
    }
  }, [profile?.id, profile?.role]);

  useFocusEffect(
    useCallback(() => {
      loadCreatorData();
    }, [loadCreatorData])
  );

  const loadHostData = useCallback(async () => {
    if (!profile?.id || profile?.role !== 'host') return;
    setLoadingCollab(true);
    setLoadingPending(true);
    try {
      const [sent, pending] = await Promise.all([
        CollaborationService.getRequestsByHost(profile.id),
        CollaborationService.getPendingRequestsToHost(profile.id),
      ]);
      setPendingFromCreators(pending);
      setCollabRequests(
        sent.filter(
          (r) => r.initiated_by !== 'creator' || r.status === 'accepted'
        )
      );
    } catch {
      setCollabRequests([]);
      setPendingFromCreators([]);
    } finally {
      setLoadingCollab(false);
      setLoadingPending(false);
    }
  }, [profile?.id, profile?.role]);

  useEffect(() => {
    loadHostData();
  }, [loadHostData]);

  useEffect(() => {
    if (!profile?.id || !isHost) return;
    PropertiesService.getActivePropertiesForHost(profile.id)
      .then((list) => setActivePropertyCount(list.length))
      .catch(() => setActivePropertyCount(0));
  }, [profile?.id, isHost]);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const sectionTitle = isHost ? t('dashboard.invitedHosts') : null;
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : '#fff';
  const softBg = isDark ? 'rgba(255,255,255,0.06)' : '#F6F7FB';
  const borderSoft = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const isJolly = profile?.role === 'jolly';
  const rawJollySub = profile?.jolly_subcategory ?? null;
  const normalizedJollySub = rawJollySub === 'boat_excursions' ? 'excursions' : rawJollySub;
  const jollySub = normalizedJollySub && normalizedJollySub in JOLLY_SUBCATEGORY_LABEL_KEYS
    ? (normalizedJollySub as JollySubcategory)
    : null;
  const jollyServiceName = jollySub ? t(JOLLY_SUBCATEGORY_LABEL_KEYS[jollySub]) : t('dashboard.jollyServiceUnknown');
  const [jollyServices, setJollyServices] = useState<LocalJollyService[]>([]);
  const [jollyMediaByService, setJollyMediaByService] = useState<Record<string, JollyServiceMediaRow[]>>({});
  const onboardingJollyService: LocalJollyService = {
    id: 'onboarding',
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    is_active: true,
    service_type: (jollySub ?? 'cleaning') as any,
    availability: 'flexible' as any,
    title: jollyServiceName,
    description: profile?.bio?.trim?.() ? profile.bio.trim() : null,
    price_per_hour: null,
    price_per_service: null,
    cities: [],
    countries: [],
    skills: [],
  };
  const displayedJollyServices = [onboardingJollyService, ...jollyServices];

  const loadJollyServices = useCallback(async () => {
    if (!profile?.id || profile.role !== 'jolly') return;
    try {
      const list = await JollyLocalServicesService.list(profile.id);
      setJollyServices(list);
      const mediaEntries = await Promise.all(
        list.map(async (service) => [service.id, await JollyLocalServicesService.getMediaForService(service.id)] as const)
      );
      setJollyMediaByService(Object.fromEntries(mediaEntries));
    } catch {
      setJollyServices([]);
      setJollyMediaByService({});
    }
  }, [profile?.id, profile?.role]);

  useFocusEffect(
    useCallback(() => {
      loadJollyServices();
    }, [loadJollyServices])
  );

  const activeServicesCount = displayedJollyServices.filter((s) => s.is_active).length;
  const totalServicesCount = displayedJollyServices.length;

  const handleCreatorInvite = async () => {
    if (!profile?.id) return;
    try {
      setLoadingCreatorInvite(true);
      const link = await createInvite(profile.id, 'creator');
      await Clipboard.setStringAsync(link);
      Alert.alert(t('settings.linkCopied'), t('settings.linkCopiedMessage'));
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : t('settings.errorGenerateLink');
      Alert.alert(t('common.error'), message);
    } finally {
      setLoadingCreatorInvite(false);
    }
  };

  const handleAnalyticsUpload = async (key: CreatorAnalyticsUploadKey) => {
    if (!profile?.id) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('common.error'), t('common.photoError'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    try {
      setUploadingAnalyticsKey(key);
      const next = await CreatorDashboardAnalyticsService.setUpload(
        profile.id,
        key,
        result.assets[0].uri
      );
      setAnalyticsUploads(next);
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : t('common.photoError');
      Alert.alert(t('common.error'), message);
    } finally {
      setUploadingAnalyticsKey(null);
    }
  };

  const renderCreatorCollabRow = (req: CollaborationRequestWithHost) => {
    const hostName =
      req.host?.full_name || req.host?.username || t('common.user');
    const statusLabel =
      req.status === 'pending'
        ? t('dashboard.creatorPending')
        : req.status === 'accepted'
        ? t('dashboard.creatorActive')
        : req.status === 'completed'
        ? t('dashboard.creatorCompleted')
        : req.status ?? '';
    return (
      <View key={req.id} style={[styles.creatorCollabRow, { borderColor: borderSoft, backgroundColor: softBg }]}>
        <Avatar uri={req.host?.avatar_url} size={40} />
        <View style={styles.creatorCollabInfo}>
          <Text style={[styles.creatorCollabName, { color: textColor }]} numberOfLines={1}>
            {hostName}
          </Text>
          <Text style={[styles.creatorCollabMeta, { color: secondary }]} numberOfLines={1}>
            {statusLabel.toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {isJolly
              ? t('dashboard.jollyTitle')
              : isCreator
              ? t('dashboard.creatorTitle')
              : t('dashboard.title')}
          </Text>
          {isJolly ? (
            <Text style={[styles.headerSubtitle, { color: secondary }]} numberOfLines={1}>
              {t('dashboard.jollySubtitle')}
            </Text>
          ) : isCreator ? (
            <Text style={[styles.headerSubtitle, { color: secondary }]} numberOfLines={2}>
              {t('dashboard.creatorSubtitle')}
            </Text>
          ) : null}
        </View>
        {isJolly ? (
          <TouchableOpacity
            style={[styles.headerCta, { backgroundColor: theme.colors.primary.blue }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateService')}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.headerCtaText}>{t('dashboard.jollyNewService')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {isJolly ? (
          <>
            {/* My collaborations */}
            <View style={[styles.webCard, { backgroundColor: cardBg, borderColor: borderSoft }]}>
              <View style={styles.webCardHeaderRow}>
                <View style={styles.webCardTitleRow}>
                  <Ionicons name="people-outline" size={18} color={theme.colors.primary.blue} />
                  <Text style={[styles.webCardTitle, { color: textColor }]}>{t('dashboard.jollyMyCollaborations')}</Text>
                </View>
              </View>
              <View style={styles.pillsRow}>
                <View style={[styles.pill, { backgroundColor: softBg, borderColor: borderSoft }]}>
                  <Text style={[styles.pillText, { color: secondary }]}>{t('dashboard.jollyPending')}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: softBg, borderColor: borderSoft }]}>
                  <Text style={[styles.pillText, { color: secondary }]}>{t('dashboard.jollyActive')}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: softBg, borderColor: borderSoft }]}>
                  <Text style={[styles.pillText, { color: secondary }]}>{t('dashboard.jollyCompleted')}</Text>
                </View>
              </View>
              <Text style={[styles.webEmptyText, { color: secondary }]}>{t('dashboard.jollyNoCollaborationsYet')}</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: borderSoft }]}>
                <Text style={[styles.statLabel, { color: secondary }]}>{t('dashboard.jollyTotalRequests')}</Text>
                <Text style={[styles.statValue, { color: textColor }]}>0</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: borderSoft }]}>
                <Text style={[styles.statLabel, { color: secondary }]}>{t('dashboard.jollyPending')}</Text>
                <Text style={[styles.statValue, { color: textColor }]}>0</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: borderSoft }]}>
                <Text style={[styles.statLabel, { color: secondary }]}>{t('dashboard.jollyActiveServices')}</Text>
                <Text style={[styles.statValue, { color: textColor }]}>{activeServicesCount}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: borderSoft }]}>
                <Text style={[styles.statLabel, { color: secondary }]}>{t('dashboard.jollyTotalServices')}</Text>
                <Text style={[styles.statValue, { color: textColor }]}>{totalServicesCount}</Text>
              </View>
            </View>

            {/* Hosts in your area */}
            <View style={[styles.webCard, { backgroundColor: cardBg, borderColor: borderSoft }]}>
              <View style={styles.webCardHeaderRow}>
                <View style={styles.webCardTitleRow}>
                  <Ionicons name="person-outline" size={18} color={theme.colors.primary.blue} />
                  <Text style={[styles.webCardTitle, { color: textColor }]}>{t('dashboard.jollyHostsInYourArea')}</Text>
                </View>
              </View>
              <Text style={[styles.webSubText, { color: secondary }]}>{t('dashboard.jollyHostsInYourAreaSubtitle')}</Text>
              <Text style={[styles.webEmptyText, { color: secondary }]}>{t('dashboard.jollyNoHostsInArea')}</Text>
            </View>

            {/* Payments */}
            <View style={[styles.webCard, { backgroundColor: cardBg, borderColor: borderSoft }]}>
              <Text style={[styles.webCardTitle, { color: textColor }]}>{t('dashboard.jollyPayments')}</Text>
              <Text style={[styles.webSubText, { color: secondary }]}>{t('dashboard.jollyPaymentsSubtitle')}</Text>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.colors.primary.blue }]}
                activeOpacity={0.85}
                onPress={() => Alert.alert(t('dashboard.jollyStripeConnect'), t('dashboard.jollyStripeConnectSoon'))}
              >
                <Text style={styles.primaryButtonText}>{t('dashboard.jollyStripeConnect')}</Text>
              </TouchableOpacity>
            </View>

            {/* Service requests received */}
            <View style={[styles.webCard, { backgroundColor: cardBg, borderColor: borderSoft }]}>
              <Text style={[styles.webCardTitle, { color: textColor }]}>{t('dashboard.jollyServiceRequestsReceived')}</Text>
              <Text style={[styles.webSubText, { color: secondary }]}>{t('dashboard.jollyServiceRequestsReceivedSubtitle')}</Text>
              <View style={styles.centerEmptyBlock}>
                <View style={[styles.emptyIconWrap, { backgroundColor: softBg, borderColor: borderSoft }]}>
                  <Ionicons name="briefcase-outline" size={26} color={secondary} />
                </View>
                <Text style={[styles.webEmptyText, { color: secondary, textAlign: 'center' }]}>
                  {t('dashboard.jollyNoServiceRequests')}
                </Text>
              </View>
            </View>

            {/* Services you offer */}
            <View style={[styles.webCard, { backgroundColor: cardBg, borderColor: borderSoft }]}>
              <View style={styles.webCardHeaderRow}>
                <View>
                  <Text style={[styles.webCardTitle, { color: textColor }]}>{t('dashboard.jollyServicesYouOffer')}</Text>
                  <Text style={[styles.webSubText, { color: secondary }]}>{t('dashboard.jollyServicesYouOfferSubtitle')}</Text>
                </View>
              </View>

              {displayedJollyServices.map((svc) => (
                <View key={svc.id} style={[styles.serviceRow, { backgroundColor: softBg, borderColor: borderSoft }]}>
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceTitle, { color: textColor }]} numberOfLines={1}>
                      {(svc.title || jollyServiceName).toUpperCase()}
                      {!svc.is_active ? ` • ${t('dashboard.jollyInactive')}` : ''}
                    </Text>
                    <Text style={[styles.serviceMeta, { color: secondary }]} numberOfLines={2}>
                      {svc.description?.trim?.()
                        ? svc.description.trim()
                        : t('dashboard.jollyServiceDescriptionPlaceholder')}
                    </Text>
                    <Text style={[styles.serviceMeta, { color: secondary }]} numberOfLines={1}>
                      {t(`createService.availability.${svc.availability}` as any)}
                    </Text>
                    {jollyMediaByService[svc.id]?.length ? (
                      <View style={styles.mediaStatusWrap}>
                        {jollyMediaByService[svc.id].map((media) => (
                          <View
                            key={media.id}
                            style={[
                              styles.mediaStatusPill,
                              {
                                borderColor: borderSoft,
                                backgroundColor:
                                  media.status === 'approved'
                                    ? 'rgba(52,199,89,0.12)'
                                    : media.status === 'rejected'
                                    ? 'rgba(255,59,48,0.12)'
                                    : 'rgba(255,149,0,0.12)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.mediaStatusText,
                                {
                                  color:
                                    media.status === 'approved'
                                      ? theme.colors.success
                                      : media.status === 'rejected'
                                      ? theme.colors.error
                                      : theme.colors.warning,
                                },
                              ]}
                            >
                              {media.status === 'approved'
                                ? t('dashboard.jollyMediaApproved')
                                : media.status === 'rejected'
                                ? t('dashboard.jollyMediaRejected')
                                : t('dashboard.jollyMediaPending')}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                  {svc.id !== 'onboarding' ? (
                    <View style={styles.serviceActions}>
                      <TouchableOpacity
                        style={[styles.smallActionBtn, { borderColor: borderSoft, backgroundColor: cardBg }]}
                        activeOpacity={0.8}
                        onPress={async () => {
                          if (!profile?.id) return;
                          await JollyLocalServicesService.setActive(profile.id, svc.id, !svc.is_active);
                          await loadJollyServices();
                        }}
                      >
                        <Ionicons
                          name={svc.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
                          size={16}
                          color={theme.colors.primary.blue}
                        />
                        <Text style={[styles.smallActionText, { color: theme.colors.primary.blue }]}>
                          {svc.is_active ? t('dashboard.jollyMarkInactive') : t('dashboard.jollyMarkActive')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconActionBtn, { borderColor: borderSoft, backgroundColor: cardBg }]}
                        activeOpacity={0.8}
                        onPress={async () => {
                          if (!profile?.id) return;
                          Alert.alert(t('common.delete'), t('dashboard.jollyDeleteConfirm'), [
                            { text: t('common.cancel'), style: 'cancel' },
                            {
                              text: t('common.delete'),
                              style: 'destructive',
                              onPress: async () => {
                                await JollyLocalServicesService.delete(profile.id, svc.id);
                                await loadJollyServices();
                              },
                            },
                          ]);
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </>
        ) : isCreator ? (
          <>
            <View style={styles.creatorStatsRow}>
              <View style={[styles.creatorStatCard, { backgroundColor: cardBg, borderColor: borderSoft, width: CREATOR_STAT_W }]}>
                <Text style={[styles.creatorStatLabel, { color: secondary }]}>
                  {t('dashboard.creatorSocialAccounts')}
                </Text>
                <Text style={[styles.creatorStatValue, { color: textColor }]}>{linkedSocialCount}</Text>
                <Text style={[styles.creatorStatSub, { color: secondary }]}>
                  {t('dashboard.creatorLinkedAccounts')}
                </Text>
              </View>
              <View style={[styles.creatorStatCard, { backgroundColor: cardBg, borderColor: borderSoft, width: CREATOR_STAT_W }]}>
                <Text style={[styles.creatorStatLabel, { color: secondary }]}>
                  {t('dashboard.creatorActiveCollaborations')}
                </Text>
                <Text style={[styles.creatorStatValue, { color: textColor }]}>
                  {creatorCollabSummary.activeCount}
                </Text>
              </View>
              <View style={[styles.creatorStatCard, { backgroundColor: cardBg, borderColor: borderSoft, width: CREATOR_STAT_W }]}>
                <Text style={[styles.creatorStatLabel, { color: secondary }]}>
                  {t('dashboard.creatorTotalCollaborations')}
                </Text>
                <Text style={[styles.creatorStatValue, { color: textColor }]}>
                  {creatorCollabSummary.total}
                </Text>
              </View>
            </View>

            <View style={[styles.webCard, { backgroundColor: cardBg, borderColor: borderSoft }]}>
              <View style={styles.webCardHeaderRow}>
                <View style={styles.webCardTitleRow}>
                  <Ionicons name="people-outline" size={18} color={theme.colors.primary.blue} />
                  <Text style={[styles.webCardTitle, { color: textColor }]}>
                    {t('dashboard.creatorMyCollaborations')}
                  </Text>
                </View>
              </View>
              <View style={styles.pillsRow}>
                <View style={[styles.creatorPill, styles.creatorPillPending]}>
                  <Text style={styles.creatorPillTextPending}>
                    {creatorCollabSummary.pending} {t('dashboard.creatorPending').toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.creatorPill, styles.creatorPillActive]}>
                  <Text style={styles.creatorPillTextActive}>
                    {creatorCollabSummary.active} {t('dashboard.creatorActive').toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.creatorPill, styles.creatorPillCompleted]}>
                  <Text style={styles.creatorPillTextCompleted}>
                    {creatorCollabSummary.completed} {t('dashboard.creatorCompleted').toUpperCase()}
                  </Text>
                </View>
              </View>
              {loadingCreatorCollabs ? (
                <ActivityIndicator size="small" color={theme.colors.primary.blue} style={styles.loader} />
              ) : creatorCollabs.length === 0 ? (
                <Text style={[styles.webEmptyText, { color: secondary, textAlign: 'center' }]}>
                  {t('dashboard.creatorNoCollaborationsYet')}
                </Text>
              ) : (
                creatorCollabs.map(renderCreatorCollabRow)
              )}
            </View>

            <View style={[styles.webCard, { backgroundColor: cardBg, borderColor: borderSoft }]}>
              <View style={styles.webCardHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.webCardTitle, { color: textColor }]}>
                    {t('dashboard.creatorReferralInvites')}
                  </Text>
                  <Text style={[styles.webSubText, { color: secondary }]}>
                    {t('dashboard.creatorReferralHint')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.creatorInviteBtn, { backgroundColor: theme.colors.primary.blue }]}
                  onPress={handleCreatorInvite}
                  disabled={loadingCreatorInvite}
                  activeOpacity={0.85}
                >
                  {loadingCreatorInvite ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="person-add-outline" size={16} color="#fff" />
                      <Text style={styles.creatorInviteBtnText}>{t('dashboard.creatorGenerateInvite')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              {loadingInvited ? (
                <ActivityIndicator size="small" color={theme.colors.primary.blue} style={styles.loader} />
              ) : invitedList.length === 0 ? (
                <Text style={[styles.webEmptyText, { color: secondary, textAlign: 'center' }]}>
                  {t('dashboard.creatorNoInvitesYet')}
                </Text>
              ) : (
                invitedList.map((inv) => {
                  const progress = getInviteProgressPercent(inv.invited);
                  const name = inv.invited?.full_name || inv.invited?.username || t('common.user');
                  return (
                    <View key={inv.id} style={[styles.inviteProgressRow, { borderColor: borderSoft }]}>
                      <View style={styles.inviteProgressHeader}>
                        <Avatar uri={inv.invited?.avatar_url} size={36} />
                        <Text style={[styles.inviteProgressName, { color: textColor }]} numberOfLines={1}>
                          {name}
                        </Text>
                        <Text style={[styles.inviteProgressPct, { color: secondary }]}>{progress}%</Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: softBg }]}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progress}%`, backgroundColor: theme.colors.primary.blue },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={[styles.webCard, { backgroundColor: cardBg, borderColor: borderSoft }]}>
              <View style={styles.webCardTitleRow}>
                <Ionicons name="airplane-outline" size={18} color={theme.colors.primary.blue} />
                <Text style={[styles.webCardTitle, { color: textColor }]}>
                  {t('dashboard.creatorDepartureAirport')}
                </Text>
              </View>
              <Text style={[styles.webSubText, { color: secondary }]}>{t('dashboard.creatorDepartureHint')}</Text>
              <TouchableOpacity
                style={[styles.outlineButton, { borderColor: borderSoft, backgroundColor: cardBg }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('CreatorDeparture')}
              >
                <Ionicons name="airplane-outline" size={16} color={textColor} />
                <Text style={[styles.outlineButtonText, { color: textColor }]}>
                  {t('dashboard.creatorManageDeparture')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.creatorHalfRow}>
              <View
                style={[
                  styles.webCard,
                  styles.creatorHalfCard,
                  { backgroundColor: cardBg, borderColor: borderSoft, width: CREATOR_HALF_W },
                ]}
              >
                <Text style={[styles.webCardTitle, { color: textColor }]}>
                  {t('dashboard.creatorLinkedSocialAccounts')}
                </Text>
                <Text style={[styles.webSubText, { color: secondary }]}>
                  {t('dashboard.creatorLinkedSocialHint')}
                </Text>
                {linkedSocialAccounts.map(({ platform, url }) => (
                    <View
                      key={platform}
                      style={[styles.socialAccountRow, { borderColor: borderSoft, backgroundColor: softBg }]}
                    >
                      <SocialPlatformIcon platform={platform} size={24} />
                      <View style={styles.socialAccountInfo}>
                        <Text style={[styles.socialAccountHandle, { color: textColor }]} numberOfLines={1}>
                          {url ? socialDisplayHandle(url) : '@—'}
                        </Text>
                        <Text style={[styles.socialAccountFollowers, { color: secondary }]}>
                          {t('dashboard.creatorFollowers', {
                            count: platform === 'instagram' ? profile?.followers_count ?? 0 : 0,
                          }).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>

              <View
                style={[
                  styles.webCard,
                  styles.creatorHalfCard,
                  { backgroundColor: cardBg, borderColor: borderSoft, width: CREATOR_HALF_W },
                ]}
              >
                <Text style={[styles.webCardTitle, { color: textColor }]}>
                  {t('dashboard.creatorYourCollaborations')}
                </Text>
                <Text style={[styles.webSubText, { color: secondary }]}>
                  {t('dashboard.creatorYourCollaborationsHint')}
                </Text>
                {loadingCreatorCollabs ? (
                  <ActivityIndicator size="small" color={theme.colors.primary.blue} style={styles.loader} />
                ) : creatorCollabs.length === 0 ? (
                  <Text style={[styles.webEmptyText, { color: secondary, textAlign: 'center' }]}>
                    {t('dashboard.creatorNoCollaborationsYet')}
                  </Text>
                ) : (
                  creatorCollabs.map(renderCreatorCollabRow)
                )}
              </View>
            </View>

            <View style={[styles.webCard, { backgroundColor: cardBg, borderColor: borderSoft }]}>
              <View style={styles.webCardTitleRow}>
                <Ionicons name="bar-chart-outline" size={18} color={theme.colors.primary.blue} />
                <Text style={[styles.webCardTitle, { color: textColor }]}>
                  {t('dashboard.creatorUpdatedAnalytics')}
                </Text>
              </View>
              <Text style={[styles.webSubText, { color: secondary }]}>
                {t('dashboard.creatorUpdatedAnalyticsHint')}
              </Text>
              {CREATOR_ANALYTICS_ROWS.map(({ key, labelKey }) => {
                const label = t(labelKey);
                const uploaded = analyticsUploads?.[key];
                const isUploading = uploadingAnalyticsKey === key;
                return (
                  <View key={key} style={styles.analyticsUploadRow}>
                    <Text style={[styles.analyticsUploadLabel, { color: textColor }]} numberOfLines={3}>
                      {label.toUpperCase()}
                    </Text>
                    <TouchableOpacity
                      style={[styles.analyticsUploadBtn, { borderColor: borderSoft, backgroundColor: cardBg }]}
                      onPress={() => handleAnalyticsUpload(key)}
                      disabled={isUploading}
                      activeOpacity={0.85}
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color={theme.colors.primary.blue} />
                      ) : uploaded ? (
                        <>
                          <Image source={{ uri: uploaded }} style={styles.analyticsThumb} />
                          <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                        </>
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={14} color={secondary} />
                          <Text style={[styles.analyticsUploadBtnText, { color: textColor }]} numberOfLines={2}>
                            {t('dashboard.creatorUpload', { label })}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <>
            {isHost ? (
              <>
                <Text style={[styles.hostDashHint, { color: secondary }]}>
                  {t('hostReferralLinks.hostDashboardHint')}
                </Text>
                <View style={styles.hostStatsRow}>
                  <View style={[styles.hostStatTile, { backgroundColor: cardBg, borderColor: borderSoft }]}>
                    <Ionicons name="home-outline" size={22} color={theme.colors.primary.blue} />
                    <Text style={[styles.hostStatValue, { color: textColor }]}>{activePropertyCount}</Text>
                    <Text style={[styles.hostStatLabel, { color: secondary }]}>
                      {t('hostReferralLinks.activeProperties')}
                    </Text>
                  </View>
                  <View style={[styles.hostStatTile, { backgroundColor: cardBg, borderColor: borderSoft }]}>
                    <Ionicons name="person-add-outline" size={22} color={theme.colors.primary.blue} />
                    <Text style={[styles.hostStatValue, { color: textColor }]}>{invitedList.length}</Text>
                    <Text style={[styles.hostStatLabel, { color: secondary }]}>
                      {t('hostReferralLinks.invitedHostsShort')}
                    </Text>
                  </View>
                  <View style={[styles.hostStatTile, { backgroundColor: cardBg, borderColor: borderSoft }]}>
                    <Ionicons name="sparkles-outline" size={22} color={theme.colors.primary.blue} />
                    <Text style={[styles.hostStatValue, { color: textColor }]}>{profile?.points ?? 0}</Text>
                    <Text style={[styles.hostStatLabel, { color: secondary }]}>{t('dashboard.points')}</Text>
                  </View>
                </View>
                <View style={styles.hostNavGrid}>
                  <HostDashNavTile
                    icon="link-outline"
                    label={t('hostReferralLinks.menuCard')}
                    onPress={() => navigation.navigate('HostReferralLinks')}
                    textColor={textColor}
                    cardBg={cardBg}
                    borderSoft={borderSoft}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={[styles.pointsCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                  <Text style={[styles.pointsLabel, { color: secondary }]}>{t('dashboard.points')}</Text>
                  <Text style={[styles.pointsValue, { color: textColor }]}>
                    {profile?.points ?? 0}
                  </Text>
                  <Text style={[styles.pointsHint, { color: secondary }]}>
                    {t('dashboard.pointsHint')}
                  </Text>
                </View>
                <Text style={[styles.roleLabel, { color: secondary }]}>{t('dashboard.role')}</Text>
                <Text style={[styles.roleValue, { color: textColor }]}>
                  {profile?.role || '—'}
                </Text>
                <Text style={[styles.hint, { color: secondary }]}>
                  {t('dashboard.hint')}
                </Text>
              </>
            )}

            {sectionTitle && (
              <View style={styles.invitedSection}>
                <Text style={[styles.invitedTitle, { color: textColor }]}>{sectionTitle}</Text>
                {loadingInvited ? (
                  <ActivityIndicator size="small" color={theme.colors.primary.blue} style={styles.loader} />
                ) : invitedList.length === 0 ? (
                  <Text style={[styles.invitedEmpty, { color: secondary }]}>
                    {t('dashboard.invitedEmpty', { role: invitedEmptyRoleLabel })}
                  </Text>
                ) : (
                  invitedList.map((inv) => (
                    <View key={inv.id} style={styles.invitedRow}>
                      <Avatar uri={inv.invited?.avatar_url} size={44} />
                      <View style={styles.invitedInfo}>
                        <Text style={[styles.invitedName, { color: textColor }]} numberOfLines={1}>
                          {inv.invited?.full_name || t('common.user')}
                        </Text>
                        {inv.invited?.username && (
                          <Text style={[styles.invitedUsername, { color: secondary }]} numberOfLines={1}>
                            @{inv.invited.username}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {profile?.role === 'host' && (
              <>
                <View style={styles.invitedSection}>
              <Text style={[styles.invitedTitle, { color: textColor }]}>{t('dashboard.requestsFromCreatorsTitle')}</Text>
              {loadingPending ? (
                <ActivityIndicator size="small" color={theme.colors.primary.blue} style={styles.loader} />
              ) : pendingFromCreators.length === 0 ? (
                <Text style={[styles.invitedEmpty, { color: secondary }]}>
                  {t('dashboard.requestsFromCreatorsEmpty')}
                </Text>
              ) : (
                pendingFromCreators.map((req) => {
                  const isActing = actingId === req.id;
                  return (
                    <View key={req.id} style={styles.pendingBlock}>
                      <TouchableOpacity
                        style={[styles.invitedRow, styles.pendingRow]}
                        onPress={() => navigation.navigate('HostCollaborationRequestDetail', { requestId: req.id })}
                        activeOpacity={0.75}
                      >
                        <Avatar uri={req.creator?.avatar_url} size={44} />
                        <View style={styles.invitedInfo}>
                          <Text style={[styles.invitedName, { color: textColor }]} numberOfLines={1}>
                            {req.creator?.full_name || req.creator?.username || t('common.user')}
                          </Text>
                          <Text style={[styles.invitedUsername, { color: secondary }]} numberOfLines={1}>
                            {req.creator?.role === 'creator' ? 'Creator' : 'Jolly'} · {t('dashboard.openRequest')}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={secondary} />
                      </TouchableOpacity>
                      <View style={styles.pendingQuickRow}>
                        <TouchableOpacity
                          style={[styles.quickDot, { backgroundColor: '#FF3B30' }]}
                          disabled={isActing}
                          onPress={async () => {
                            if (!profile?.id || isActing) return;
                            setActingId(req.id);
                            try {
                              await CollaborationService.hostRejectCollaborationRequest(req.id, profile.id);
                              setPendingFromCreators((prev) => prev.filter((r) => r.id !== req.id));
                            } catch (e) {
                              Alert.alert(t('common.error'), (e as Error).message);
                            } finally {
                              setActingId(null);
                            }
                          }}
                        />
                        <TouchableOpacity
                          style={[styles.quickDot, { backgroundColor: '#FFCC00' }]}
                          disabled={isActing}
                          onPress={() => {
                            Alert.alert(
                              t('dashboard.requestsFromCreatorsTitle'),
                              undefined,
                              [
                                {
                                  text: t('collabRequestDetail.kolbedHalfCoverage'),
                                  onPress: async () => {
                                    if (!profile?.id) return;
                                    setActingId(req.id);
                                    try {
                                      await CollaborationService.hostCounterOfferCollaboration(req.id, profile.id, 'half_coverage');
                                      setPendingFromCreators((prev) => prev.filter((r) => r.id !== req.id));
                                      await refreshProfile?.();
                                    } catch (e) {
                                      Alert.alert(t('common.error'), (e as Error).message);
                                    } finally {
                                      setActingId(null);
                                    }
                                  },
                                },
                                {
                                  text: t('collabRequestDetail.kolbed50Discount'),
                                  onPress: async () => {
                                    if (!profile?.id) return;
                                    setActingId(req.id);
                                    try {
                                      await CollaborationService.hostCounterOfferCollaboration(req.id, profile.id, '50_discount');
                                      setPendingFromCreators((prev) => prev.filter((r) => r.id !== req.id));
                                      await refreshProfile?.();
                                    } catch (e) {
                                      Alert.alert(t('common.error'), (e as Error).message);
                                    } finally {
                                      setActingId(null);
                                    }
                                  },
                                },
                                { text: t('common.cancel'), style: 'cancel' },
                              ]
                            );
                          }}
                        />
                        <TouchableOpacity
                          style={[styles.quickDot, { backgroundColor: '#34C759' }]}
                          disabled={isActing}
                          onPress={async () => {
                            if (!profile?.id || isActing) return;
                            setActingId(req.id);
                            try {
                              await CollaborationService.hostAcceptCollaborationRequest(req.id, profile.id);
                              setPendingFromCreators((prev) => prev.filter((r) => r.id !== req.id));
                              await refreshProfile?.();
                            } catch (e) {
                              Alert.alert(t('common.error'), (e as Error).message);
                            } finally {
                              setActingId(null);
                            }
                          }}
                        >
                          {isActing ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Ionicons name="checkmark" size={22} color="#fff" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
            <View style={styles.invitedSection}>
              <Text style={[styles.invitedTitle, { color: textColor }]}>{t('dashboard.creatorsApprovedTitle')}</Text>
              {loadingCollab ? (
                <ActivityIndicator size="small" color={theme.colors.primary.blue} style={styles.loader} />
              ) : collabRequests.length === 0 ? (
                <Text style={[styles.invitedEmpty, { color: secondary }]}>
                  {t('dashboard.collabRequestsEmpty')}
                </Text>
              ) : (
                collabRequests.map((req) => (
                  <TouchableOpacity
                    key={req.id}
                    style={styles.invitedRow}
                    onPress={() => navigation.navigate('HostCollaborationRequestDetail', { requestId: req.id })}
                    activeOpacity={0.7}
                  >
                    <Avatar uri={req.creator?.avatar_url} size={44} />
                    <View style={styles.invitedInfo}>
                      <Text style={[styles.invitedName, { color: textColor }]} numberOfLines={1}>
                        {req.creator?.full_name || req.creator?.username || t('common.user')}
                      </Text>
                      <Text style={[styles.invitedUsername, { color: secondary }]} numberOfLines={1}>
                        {req.creator?.role === 'creator' ? 'Creator' : 'Jolly'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={secondary} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function HostDashNavTile({
  icon,
  label,
  onPress,
  textColor,
  cardBg,
  borderSoft,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  textColor: string;
  cardBg: string;
  borderSoft: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.hostNavTile, { backgroundColor: cardBg, borderColor: borderSoft, width: HOST_TILE_W }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name={icon} size={26} color={theme.colors.primary.blue} />
      <Text style={[styles.hostNavTileLabel, { color: textColor }]} numberOfLines={3}>
        {label.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hostDashHint: { ...theme.typography.caption1, marginBottom: theme.spacing.md },
  hostStatsRow: {
    flexDirection: 'row',
    gap: HOST_GRID_GAP,
    marginBottom: theme.spacing.lg,
  },
  hostStatTile: {
    width: HOST_TILE_W,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  hostStatValue: { ...theme.typography.title2, fontWeight: '800' },
  hostStatLabel: {
    ...theme.typography.caption2,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  hostNavGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: HOST_GRID_GAP,
    marginBottom: theme.spacing.xl,
  },
  hostNavTile: {
    minHeight: HOST_TILE_W * 0.95,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  hostNavTileLabel: {
    ...theme.typography.caption2,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  headerCenter: { flex: 1, paddingHorizontal: theme.spacing.md },
  headerTitle: { ...theme.typography.headline, fontWeight: '700' },
  headerSubtitle: { ...theme.typography.caption1, marginTop: 2 },
  headerRight: { width: 24 },
  headerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  headerCtaText: { color: '#fff', ...theme.typography.footnote, fontWeight: '700' },
  scroll: { flex: 1 },
  content: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing['3xl'],
  },
  pointsCard: {
    padding: theme.spacing.lg,
    borderRadius: 12,
    marginBottom: theme.spacing.xl,
  },
  pointsLabel: { ...theme.typography.caption1, marginBottom: 4 },
  pointsValue: { ...theme.typography.largeTitle, fontWeight: '700' },
  pointsHint: { ...theme.typography.caption1, marginTop: theme.spacing.sm },
  roleLabel: { ...theme.typography.caption1, marginBottom: 4 },
  roleValue: { ...theme.typography.title1, marginBottom: theme.spacing.lg },
  hint: { ...theme.typography.body, marginBottom: theme.spacing.xl },
  invitedSection: { marginTop: theme.spacing.lg },
  invitedTitle: { ...theme.typography.headline, fontWeight: '600', marginBottom: theme.spacing.md },
  loader: { marginVertical: theme.spacing.md },
  invitedEmpty: { ...theme.typography.subheadline },
  invitedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  pendingRow: { flexWrap: 'nowrap', alignItems: 'center' },
  pendingBlock: { marginBottom: theme.spacing.md },
  pendingQuickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  quickDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptRejectBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    minWidth: 72,
    alignItems: 'center',
  },
  acceptBtnText: { ...theme.typography.footnote, color: '#fff', fontWeight: '600' },
  rejectBtnText: { ...theme.typography.footnote, fontWeight: '600' },
  invitedInfo: { flex: 1 },
  invitedName: { ...theme.typography.body, fontWeight: '600' },
  invitedUsername: { ...theme.typography.caption1 },
  structureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: 12,
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  structureBtnText: { ...theme.typography.body, fontWeight: '600', flex: 1 },

  // ── Jolly web-style dashboard blocks ──
  webCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  webCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  webCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  webCardTitle: { ...theme.typography.headline, fontWeight: '700' },
  webSubText: { ...theme.typography.caption1, marginTop: 2 },
  webEmptyText: { ...theme.typography.caption1, marginTop: 10 },
  pillsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  pillText: { ...theme.typography.caption2, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  statCard: {
    width: '47.5%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  statLabel: { ...theme.typography.caption2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  statValue: { ...theme.typography.title1, fontWeight: '800', marginTop: 6 },

  primaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  primaryButtonText: { color: '#fff', ...theme.typography.footnote, fontWeight: '700' },

  centerEmptyBlock: { alignItems: 'center', justifyContent: 'center', paddingTop: 6, paddingBottom: 6 },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  serviceRow: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  serviceInfo: { flex: 1, gap: 4 },
  serviceTitle: { ...theme.typography.subheadline, fontWeight: '900', letterSpacing: 0.6 },
  serviceMeta: { ...theme.typography.caption1 },
  mediaStatusWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  mediaStatusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  mediaStatusText: { ...theme.typography.caption2, fontWeight: '800' },
  serviceActions: { gap: 10, alignItems: 'flex-end' },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  smallActionText: { ...theme.typography.caption1, fontWeight: '800' },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Creator web-style dashboard ──
  creatorStatsRow: {
    flexDirection: 'row',
    gap: HOST_GRID_GAP,
    marginBottom: 14,
  },
  creatorStatCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minHeight: 108,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  creatorStatLabel: {
    ...theme.typography.caption2,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  creatorStatValue: {
    ...theme.typography.largeTitle,
    fontWeight: '800',
    marginTop: 8,
  },
  creatorStatSub: {
    ...theme.typography.caption2,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  creatorPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  creatorPillPending: { backgroundColor: 'rgba(255,204,0,0.18)' },
  creatorPillActive: { backgroundColor: 'rgba(0,122,255,0.12)' },
  creatorPillCompleted: { backgroundColor: 'rgba(52,199,89,0.14)' },
  creatorPillTextPending: {
    ...theme.typography.caption2,
    fontWeight: '800',
    color: '#B8860B',
    textTransform: 'uppercase',
  },
  creatorPillTextActive: {
    ...theme.typography.caption2,
    fontWeight: '800',
    color: theme.colors.primary.blue,
    textTransform: 'uppercase',
  },
  creatorPillTextCompleted: {
    ...theme.typography.caption2,
    fontWeight: '800',
    color: theme.colors.success,
    textTransform: 'uppercase',
  },
  creatorInviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    maxWidth: '46%',
  },
  creatorInviteBtnText: {
    color: '#fff',
    ...theme.typography.caption2,
    fontWeight: '700',
    flexShrink: 1,
  },
  inviteProgressRow: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  inviteProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  inviteProgressName: {
    ...theme.typography.subheadline,
    fontWeight: '600',
    flex: 1,
  },
  inviteProgressPct: {
    ...theme.typography.caption1,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  outlineButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  outlineButtonText: {
    ...theme.typography.caption1,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  creatorHalfRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: HOST_GRID_GAP,
    marginBottom: 0,
  },
  creatorHalfCard: {
    flexGrow: 1,
    minWidth: CREATOR_HALF_W,
  },
  socialAccountRow: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  socialAccountInfo: { flex: 1, gap: 2 },
  socialAccountHandle: {
    ...theme.typography.subheadline,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  socialAccountFollowers: {
    ...theme.typography.caption2,
    fontWeight: '600',
  },
  creatorCollabRow: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  creatorCollabInfo: { flex: 1, gap: 2 },
  creatorCollabName: { ...theme.typography.subheadline, fontWeight: '700' },
  creatorCollabMeta: { ...theme.typography.caption2, fontWeight: '700' },
  analyticsUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  analyticsUploadLabel: {
    ...theme.typography.caption1,
    fontWeight: '700',
    flex: 1,
    paddingRight: 8,
  },
  analyticsUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '52%',
    minHeight: 36,
  },
  analyticsUploadBtnText: {
    ...theme.typography.caption2,
    fontWeight: '600',
    flexShrink: 1,
  },
  analyticsThumb: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },
});
