/**
 * KOL&BED Screen
 * Host  → vede Creator (swipe) oppure Jolly filtrati per subcategoria (swipe)
 * Creator → vede Host (swipe) con badge tier gratuito/a pagamento
 * Jolly → vede Host e Creator
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Avatar, Badge, BioText } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { ProfilesService } from '../../services/profiles.service';
import { PropertiesService } from '../../services/properties.service';
import { CollaborationService } from '../../services/collaboration.service';
import { KolbedSwipeStack } from './KolbedSwipeStack';
import { CollaborationRequestSheet } from './CollaborationRequestSheet';
import type { UserProfile } from '../../types';
import type { UserRole } from '../../types/user';
import type { Property } from '../../types/property';

// ──────────────────────────────────────────────────────────────────────────
// Types & constants
// ──────────────────────────────────────────────────────────────────────────
type HostKolbedFilter = 'creator' | 'jolly';

/** Tutte le subcategorie Jolly disponibili come filtro */
const JOLLY_SUBCATEGORIES = [
  { key: 'all', labelKey: 'kolbed.jollySubAll' as const },
  { key: 'restaurant', labelKey: 'kolbed.jollySubRestaurant' as const },
  { key: 'cleaner', labelKey: 'kolbed.jollySubCleaner' as const },
  { key: 'autista', labelKey: 'kolbed.jollySubAutista' as const },
  { key: 'photographer', labelKey: 'kolbed.jollySubPhotographer' as const },
  { key: 'social_media_manager', labelKey: 'kolbed.jollySubSMM' as const },
  { key: 'pharmacy', labelKey: 'kolbed.jollySubPharmacy' as const },
  { key: 'excursions', labelKey: 'kolbed.jollySubExcursions' as const },
  { key: 'boat_excursions', labelKey: 'kolbed.jollySubBoatExcursions' as const },
  { key: 'home_products', labelKey: 'kolbed.jollySubHomeProducts' as const },
  { key: 'assistenza', labelKey: 'kolbed.jollySubAssistenza' as const },
  { key: 'property_manager', labelKey: 'kolbed.jollySubPropertyManager' as const },
  { key: 'fornitore', labelKey: 'kolbed.jollySubFornitore' as const },
] as const;

/** Mappa creator_category → offer_type gratuiti per il creator */
const CREATOR_FREE_TIERS: Record<string, string[]> = {
  ugc_creator: ['basic', 'basic_paid'],
  micro_influencer: ['medium', 'medium_fees'],
  influencer: ['luxury', 'luxury_paid'],
};

const ROLES_FOR_OTHER: Record<NonNullable<UserRole>, NonNullable<UserRole>[]> = {
  host: ['creator', 'jolly'],
  creator: ['host', 'jolly'],
  jolly: ['host', 'creator'],
  manager: ['host', 'creator', 'jolly'],
};

// ──────────────────────────────────────────────────────────────────────────
// Helper: determine if a host is a "free match" for the creator
// ──────────────────────────────────────────────────────────────────────────
function isFreeMatchForCreator(hostProfile: UserProfile, creatorCategory: string | null | undefined): boolean {
  if (!creatorCategory) return true; // not known yet → show without label
  const freeTiers = CREATOR_FREE_TIERS[creatorCategory] ?? [];
  const hostTier = hostProfile.host_tier ?? null;
  // Check host_tier on profile first (set during onboarding)
  if (hostTier) return freeTiers.includes(hostTier) || freeTiers.includes(hostTier + '_paid');
  return true; // unknown → optimistic
}

// ──────────────────────────────────────────────────────────────────────────
// Main screen
// ──────────────────────────────────────────────────────────────────────────
export default function KOLBEDScreen() {
  const navigation = useNavigation();
  const { profile } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [structures, setStructures] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Host filters
  const [hostFilter, setHostFilter] = useState<HostKolbedFilter>('creator');
  const [jollySubFilter, setJollySubFilter] = useState<string>('all');

  // Swipe stack
  const [swipeStack, setSwipeStack] = useState<UserProfile[]>([]);
  const [collabSheetTarget, setCollabSheetTarget] = useState<UserProfile | null>(null);
  const [collabSheetVisible, setCollabSheetVisible] = useState(false);

  // Creator view
  const [creatorViewMode, setCreatorViewMode] = useState<'structures' | 'hosts'>('structures');

  const myRole = profile?.role ?? null;
  const hostId = profile?.id ?? null;
  const creatorId = profile?.id ?? null;
  const isCreator = myRole === 'creator';
  const isHost = myRole === 'host';

  const rolesToShow =
    myRole && myRole in ROLES_FOR_OTHER && !isHost
      ? ROLES_FOR_OTHER[myRole as keyof typeof ROLES_FOR_OTHER]
      : [];

  const creatorStatus = profile?.creator_status ?? null;
  const creatorApproved = isCreator && creatorStatus === 'approved';
  const creatorPending = isCreator && (creatorStatus === 'pending' || creatorStatus == null);
  const creatorRejected = isCreator && creatorStatus === 'rejected';

  const backgroundColor = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondaryColor = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;

  // ── Load ──────────────────────────────────────────────────────────────
  const load = async () => {
    try {
      if (isHost) {
        const creatorAndJolly = await ProfilesService.getProfilesByRoles(['creator', 'jolly']);
        const creatorIds = creatorAndJolly.filter((p) => p.role === 'creator').map((p) => p.id);
        const nichesMap = creatorIds.length > 0
          ? await ProfilesService.getCreatorNichesByUserIds(creatorIds)
          : {};
        const withNiches = creatorAndJolly.map((p) =>
          p.role === 'creator' && nichesMap[p.id] ? { ...p, niches_display: nichesMap[p.id] } : p
        );
        setUsers(withNiches);
        setStructures([]);
      } else if (isCreator) {
        if (creatorPending || creatorRejected) {
          setUsers([]);
          setStructures([]);
        } else if (creatorApproved) {
          const offerTypes = profile?.admin_approved_opportunities ?? [];
          const [structuresData, hostAndJollyProfiles] = await Promise.all([
            PropertiesService.getPropertiesForCreators(offerTypes),
            ProfilesService.getProfilesByRoles(rolesToShow),
          ]);
          setStructures(structuresData);
          const hostIds = [...new Set(structuresData.map((p) => p.owner_id))];
          const hostProfiles = hostIds.length > 0
            ? await ProfilesService.getProfilesByIds(hostIds)
            : [];
          const jollyProfiles = hostAndJollyProfiles.filter((p) => p.role === 'jolly');
          setUsers([...hostProfiles, ...jollyProfiles]);
        } else {
          const [profilesData, structuresData] = await Promise.all([
            ProfilesService.getProfilesByRoles(rolesToShow),
            PropertiesService.getPropertiesForCreators(),
          ]);
          setUsers(profilesData);
          setStructures(structuresData);
        }
      } else {
        const [profilesData, structuresData] = await Promise.all([
          ProfilesService.getProfilesByRoles(rolesToShow),
          isCreator ? PropertiesService.getPropertiesForCreators() : Promise.resolve([]),
        ]);
        setUsers(profilesData);
        setStructures(structuresData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [profile?.role, profile?.creator_status, profile?.admin_approved_opportunities, isCreator, isHost]);

  // ── Filtered lists ─────────────────────────────────────────────────────
  /** Lista filtrata per host: Creator approvati oppure Jolly (con subcategoria) */
  const hostFilteredUsers = useMemo(() => {
    if (!isHost) return [];
    if (hostFilter === 'creator') {
      return users.filter((u) => u.role === 'creator' && u.creator_status === 'approved');
    }
    // Jolly
    const jollyList = users.filter((u) => u.role === 'jolly');
    if (jollySubFilter === 'all') return jollyList;
    return jollyList.filter((u) => u.jolly_subcategory === jollySubFilter);
  }, [isHost, users, hostFilter, jollySubFilter]);

  const creatorHostUsers = useMemo(
    () => (isCreator ? users.filter((u) => u.role === 'host') : []),
    [isCreator, users]
  );

  // ── Sync swipe stack ───────────────────────────────────────────────────
  useEffect(() => {
    if (isHost) setSwipeStack(hostFilteredUsers);
  }, [isHost, hostFilteredUsers]);

  useEffect(() => {
    if (isCreator && creatorViewMode === 'hosts') setSwipeStack(creatorHostUsers);
  }, [isCreator, creatorViewMode, creatorHostUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // ── Actions ────────────────────────────────────────────────────────────
  const openPropertyDetail = (propertyId: string) => {
    (navigation.getParent() as { navigate: (tab: string, params?: { screen: string; params: { propertyId: string } }) => void })
      ?.navigate('ExploreTab', { screen: 'PropertyDetail', params: { propertyId } });
  };

  const handleSwipeLeft = (p: UserProfile) => {
    setSwipeStack((prev) => prev.filter((x) => x.id !== p.id));
  };

  const openCollaborationSheet = (p: UserProfile) => {
    if (isHost && hostId) {
      setCollabSheetTarget(p);
      setCollabSheetVisible(true);
      return;
    }
    if (isCreator && creatorId && p.role === 'host') {
      setCollabSheetTarget(p);
      setCollabSheetVisible(true);
    }
  };

  const removeProfileFromStack = (id: string) =>
    setSwipeStack((prev) => prev.filter((x) => x.id !== id));

  const handleViewCatalog = (jollyId: string) => {
    (navigation.getParent() as { navigate: (name: string, params?: { screen: string; params: { jollyId: string } }) => void } | undefined)
      ?.navigate('ProfileTab', { screen: 'JollyProductList', params: { jollyId } });
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {profile?.id && (
        <CollaborationRequestSheet
          visible={collabSheetVisible}
          onClose={() => {
            setCollabSheetVisible(false);
            setCollabSheetTarget(null);
          }}
          target={collabSheetTarget}
          initiatedBy={isHost ? 'host' : 'creator'}
          currentUserId={profile.id}
          onSuccess={() => {
            if (collabSheetTarget) removeProfileFromStack(collabSheetTarget.id);
            setCollabSheetTarget(null);
          }}
        />
      )}
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('nav.kolbed')}</Text>
      </View>

      {/* ── HOST VIEW ─────────────────────────────────────────── */}
      {isHost ? (
        <>
          {/* Filter: Creator | Jolly */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, hostFilter === 'creator' && styles.filterChipActive]}
              onPress={() => setHostFilter('creator')}
            >
              <Text style={[styles.filterChipText, { color: hostFilter === 'creator' ? '#fff' : textColor }]}>
                {t('kolbed.filterCreator')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, hostFilter === 'jolly' && styles.filterChipActive]}
              onPress={() => setHostFilter('jolly')}
            >
              <Text style={[styles.filterChipText, { color: hostFilter === 'jolly' ? '#fff' : textColor }]}>
                {t('kolbed.filterJolly')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subcategory chips: piccoli, a scomparsa dopo selezione */}
          {hostFilter === 'jolly' && (
            <View style={styles.subFilterWrap}>
              {jollySubFilter === 'all' ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.subFilterRow}
                >
                  {JOLLY_SUBCATEGORIES.map(({ key, labelKey }) => (
                    <TouchableOpacity
                      key={key}
                      style={[styles.subFilterChip, jollySubFilter === key && styles.subFilterChipActive]}
                      onPress={() => setJollySubFilter(key)}
                    >
                      <Text
                        style={[styles.subFilterChipText, { color: jollySubFilter === key ? '#fff' : textColor }]}
                        numberOfLines={1}
                      >
                        {t(labelKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <TouchableOpacity
                  style={[styles.subFilterChip, styles.subFilterChipActive, styles.subFilterChipSelected]}
                  onPress={() => setJollySubFilter('all')}
                >
                  <Text style={[styles.subFilterChipText, { color: '#fff' }]}>
                    {t(JOLLY_SUBCATEGORIES.find((s) => s.key === jollySubFilter)?.labelKey ?? 'kolbed.jollySubAll')}
                  </Text>
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Swipe stack */}
          <View style={styles.swipeArea}>
            <KolbedSwipeStack
              profiles={swipeStack}
              onSwipeLeft={handleSwipeLeft}
              onRequestCollaboration={openCollaborationSheet}
              onPressViewCatalog={handleViewCatalog}
            />
          </View>
        </>

      /* ── CREATOR: in attesa / rifiutato ────────────────────── */
      ) : creatorPending ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: secondaryColor }]}>{t('kolbed.creatorPending')}</Text>
        </View>
      ) : creatorRejected ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: secondaryColor }]}>{t('kolbed.creatorRejected')}</Text>
        </View>
      ) : rolesToShow.length === 0 && !isCreator ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: secondaryColor }]}>{t('kolbed.emptyHint')}</Text>
        </View>

      /* ── CREATOR VIEW ──────────────────────────────────────── */
      ) : isCreator ? (
        <>
          {/* Tab: Strutture per te | Host */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, creatorViewMode === 'structures' && styles.filterChipActive]}
              onPress={() => setCreatorViewMode('structures')}
            >
              <Text style={[styles.filterChipText, { color: creatorViewMode === 'structures' ? '#fff' : textColor }]}>
                {t('kolbed.structuresForYou')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, creatorViewMode === 'hosts' && styles.filterChipActive]}
              onPress={() => setCreatorViewMode('hosts')}
            >
              <Text style={[styles.filterChipText, { color: creatorViewMode === 'hosts' ? '#fff' : textColor }]}>
                {t('roles.host')}
              </Text>
            </TouchableOpacity>
          </View>

          {creatorViewMode === 'hosts' ? (
            /* Swipe Host */
            <View style={styles.swipeArea}>
              <KolbedSwipeStack
                profiles={swipeStack}
                onSwipeLeft={handleSwipeLeft}
                onRequestCollaboration={openCollaborationSheet}
                onPressViewCatalog={handleViewCatalog}
              />
            </View>
          ) : (
            /* Strutture per te */
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={theme.colors.primary.blue} />
              }
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t('kolbed.structuresForYou')}</Text>
              {structures.length === 0 ? (
                <Text style={[styles.emptyInline, { color: secondaryColor }]}>{t('kolbed.structuresEmpty')}</Text>
              ) : (
                <View style={styles.structuresList}>
                  {structures.map((prop) => {
                    const freeTiers = CREATOR_FREE_TIERS[profile?.creator_category ?? ''] ?? [];
                    const isFree = !prop.offer_type || freeTiers.includes(prop.offer_type);
                    return (
                      <TouchableOpacity
                        key={prop.id}
                        activeOpacity={0.7}
                        onPress={() => openPropertyDetail(prop.id)}
                      >
                        <Card style={styles.structureCard}>
                          <Image source={{ uri: prop.images?.[0] ?? '' }} style={styles.structureImage} resizeMode="cover" />
                          <View style={styles.structureInfo}>
                            <View style={styles.structureTitleRow}>
                              <Text style={[styles.structureTitle, { color: textColor }]} numberOfLines={1}>
                                {prop.title || t('properties.property')}
                              </Text>
                              {/* Badge tier */}
                              <View style={[styles.tierBadge, isFree ? styles.tierBadgeFree : styles.tierBadgePaid]}>
                                <Ionicons
                                  name={isFree ? 'checkmark-circle' : 'cash-outline'}
                                  size={11}
                                  color={isFree ? '#34C759' : '#FF9500'}
                                />
                                <Text style={[styles.tierBadgeText, { color: isFree ? '#34C759' : '#FF9500' }]}>
                                  {isFree ? t('kolbed.freeMatchForYou') : t('kolbed.paidCollabRequired')}
                                </Text>
                              </View>
                            </View>
                            {prop.city && (
                              <Text style={[styles.structureLocation, { color: secondaryColor }]} numberOfLines={1}>
                                {prop.city}{prop.country ? `, ${prop.country}` : ''}
                              </Text>
                            )}
                            {prop.base_price_per_night > 0 && (
                              <Text style={[styles.structurePrice, { color: theme.colors.primary.blue }]}>
                                €{prop.base_price_per_night} {t('properties.perNight')}
                              </Text>
                            )}
                          </View>
                        </Card>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )}
        </>

      /* ── ALTRI RUOLI (Jolly, Manager) ─────────────────────── */
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={theme.colors.primary.blue} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.7}>
              <Card style={styles.card}>
                <View style={styles.row}>
                  <Avatar uri={item.avatar_url} size={56} verified={Boolean(item.is_verified)} />
                  <View style={styles.info}>
                    <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
                      {item.full_name || t('common.user')}
                    </Text>
                    {item.username && (
                      <Text style={[styles.username, { color: secondaryColor }]} numberOfLines={1}>@{item.username}</Text>
                    )}
                    {item.role && (
                      <Badge variant="outline" style={styles.roleBadge}>{t(`roles.${item.role}`) || item.role}</Badge>
                    )}
                    {item.bio ? (
                      <BioText bio={item.bio} bioLinksApproved={item.bio_links_approved} style={[styles.bio, { color: secondaryColor }]} numberOfLines={2} />
                    ) : null}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  headerTitle: { ...theme.typography.largeTitle, fontWeight: '700' },

  // Filter chips (main row)
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(120,120,128,0.2)',
  },
  filterChipActive: { backgroundColor: theme.colors.primary.blue },
  filterChipText: { ...theme.typography.subheadline, fontWeight: '600' },

  // Sub-filter chips (jolly subcategories) – piccoli, a scomparsa dopo selezione
  subFilterWrap: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.xs,
    minHeight: 32,
  },
  subFilterRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  subFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(120,120,128,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(120,120,128,0.3)',
  },
  subFilterChipActive: {
    backgroundColor: 'rgba(79,70,229,0.85)',
    borderColor: 'rgba(79,70,229,0.85)',
  },
  subFilterChipSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  subFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 100,
  },

  // Swipe area
  swipeArea: {
    flex: 1,
    paddingHorizontal: theme.spacing.screenPadding,
    minHeight: 0,
  },

  // Empty states
  empty: { flex: 1, padding: theme.spacing.screenPadding, justifyContent: 'center' },
  emptyText: { ...theme.typography.body, textAlign: 'center' },
  emptyInline: { ...theme.typography.subheadline, marginBottom: theme.spacing.lg },

  // Scroll / list
  scroll: { flex: 1 },
  list: { padding: theme.spacing.screenPadding, paddingBottom: 120 },
  sectionTitle: { ...theme.typography.headline, fontWeight: '600', marginBottom: theme.spacing.md, marginTop: theme.spacing.sm },

  // Structures
  structuresList: { marginBottom: theme.spacing.xl },
  structureCard: { overflow: 'hidden', padding: 0, marginBottom: theme.spacing.md },
  structureImage: { width: '100%', height: 160, backgroundColor: 'rgba(128,128,128,0.2)' },
  structureInfo: { padding: theme.spacing.md },
  structureTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: 2 },
  structureTitle: { ...theme.typography.headline, fontWeight: '600', flex: 1 },
  structureLocation: { ...theme.typography.caption1, marginTop: 2 },
  structurePrice: { ...theme.typography.subheadline, fontWeight: '600', marginTop: 4 },

  // Tier badge
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  tierBadgeFree: { backgroundColor: 'rgba(52,199,89,0.12)' },
  tierBadgePaid: { backgroundColor: 'rgba(255,149,0,0.12)' },
  tierBadgeText: { ...theme.typography.caption2, fontWeight: '700' },

  // Profile cards (other roles)
  card: { padding: theme.spacing.cardPadding, marginBottom: theme.spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  info: { flex: 1, marginLeft: theme.spacing.md },
  name: { ...theme.typography.headline, fontWeight: '600' },
  username: { ...theme.typography.subheadline, marginTop: 2 },
  roleBadge: { marginTop: theme.spacing.sm, alignSelf: 'flex-start' },
  bio: { ...theme.typography.caption1, marginTop: theme.spacing.sm },
});
