/**
 * KOL&BED Creator/Jolly card – full screen, Tinder-style.
 * Image (cover/gallery), age top-left, languages (flag) top-right, footer name/followers/niches.
 * Tap left/right on image to change photo; thin progress indicator on top.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { LANGUAGE_OPTIONS, type Language } from '../../constants/translations';
import { JollyService, type JollyRestaurantInfo, type JollyRatingSummary } from '../../services/jolly.service';
import type { UserProfile } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = theme.spacing.screenPadding * 2;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING;
const HOME_IMAGE_ASPECT = 4 / 3;
const HOME_IMAGE_HEIGHT = CARD_WIDTH / HOME_IMAGE_ASPECT;
const IMAGE_SECTION_HEIGHT = HOME_IMAGE_HEIGHT * (4 / 3);
const TAP_ZONE_WIDTH = SCREEN_WIDTH * 0.25;
const PROGRESS_SEGMENT_HEIGHT = 3;
const PROGRESS_GAP = 4;
const FOOTER_APPROX_HEIGHT = 160;

function getAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function getFlagForLang(code: string): string {
  const opt = LANGUAGE_OPTIONS.find((o) => o.code === code);
  return opt?.flag ?? '🌐';
}

function getLabelForLang(code: string): string {
  const opt = LANGUAGE_OPTIONS.find((o) => o.code === code);
  return opt?.label ?? code;
}

export interface KolbedCreatorCardProps {
  profile: UserProfile;
  onPressLanguages?: () => void;
  /** Callback per Scarta (swipe left); se presente mostra il pulsante */
  onReject?: () => void;
  /** Callback per Richiedi collaborazione (swipe right); se presente mostra il pulsante */
  onAccept?: () => void;
  /** Callback per "Vedi catalogo" (Jolly prodotti per la casa) */
  onPressViewCatalog?: (jollyId: string) => void;
}

const JOLLY_RATING_SUBCATEGORIES = ['cleaner', 'property_manager', 'assistenza', 'autista', 'fornitore'];
const JOLLY_EXCURSION_SUBCATEGORIES = ['excursions', 'boat_excursions'];
const JOLLY_HOME_PRODUCTS = 'home_products';

export function KolbedCreatorCard({ profile, onPressLanguages, onReject, onAccept, onPressViewCatalog }: KolbedCreatorCardProps) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const { user: currentUser, profile: currentProfile } = useAuth();
  const [restaurantInfo, setRestaurantInfo] = useState<JollyRestaurantInfo | null>(null);
  const [ratingSummary, setRatingSummary] = useState<JollyRatingSummary | null>(null);
  const [canVote, setCanVote] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [productCount, setProductCount] = useState<number>(0);

  const isJolly = profile.role === 'jolly';
  const jollySub = (profile.jolly_subcategory ?? '') as string;
  const isRestaurantJolly = isJolly && jollySub === 'restaurant';
  const isRatingJolly = isJolly && JOLLY_RATING_SUBCATEGORIES.includes(jollySub);
  const isExcursionJolly = isJolly && JOLLY_EXCURSION_SUBCATEGORIES.includes(jollySub);
  const isHomeProductsJolly = isJolly && jollySub === JOLLY_HOME_PRODUCTS;

  useEffect(() => {
    if (!isJolly || !profile.id) return;
    if (isRestaurantJolly) {
      JollyService.getRestaurantInfo(profile.id).then(setRestaurantInfo).catch(() => setRestaurantInfo(null));
      return;
    }
    if (isRatingJolly && currentUser?.id) {
      setRatingLoading(true);
      Promise.all([
        JollyService.getJollyRating(profile.id, currentUser.id),
        currentProfile?.role === 'host' ? JollyService.hasHostCollaboratedWithJolly(currentUser.id, profile.id) : Promise.resolve(false),
      ])
        .then(([rating, collaborated]) => {
          setRatingSummary(rating);
          setCanVote(!!collaborated);
        })
        .catch(() => { setRatingSummary(null); setCanVote(false); })
        .finally(() => setRatingLoading(false));
      return;
    }
    if (isHomeProductsJolly) {
      JollyService.getProductCountByJolly(profile.id).then(setProductCount).catch(() => setProductCount(0));
    }
  }, [isJolly, isRestaurantJolly, isRatingJolly, isHomeProductsJolly, profile.id, currentUser?.id, currentProfile?.role]);

  const handleVote = async (vote: 'up' | 'down') => {
    if (!currentUser?.id || !canVote || !ratingSummary) return;
    try {
      await JollyService.setRating(currentUser.id, profile.id, vote);
      const next = await JollyService.getJollyRating(profile.id, currentUser.id);
      setRatingSummary(next);
    } catch (_) {}
  };

  const openLink = (url: string | null) => {
    if (url && url.startsWith('http')) Linking.openURL(url).catch(() => {});
  };

  const photos =
    (profile as { profile_cover_images?: string[] | null }).profile_cover_images?.filter(Boolean) ??
    (profile.avatar_url ? [profile.avatar_url] : []);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [languagesModalVisible, setLanguagesModalVisible] = useState(false);

  const age = getAge(profile.date_of_birth);
  const languages: string[] = Array.isArray((profile as { content_language?: string[] }).content_language)
    ? (profile as { content_language: string[] }).content_language
    : [];
  const motherTongue = languages[0];
  const otherLanguages = languages.slice(1);
  const nichesDisplay =
    (profile as { niches_display?: string[] }).niches_display ??
    (profile as { niches?: { niche: string }[] }).niches?.map((n) => n.niche) ??
    [];
  const followersCount = profile.followers_count ?? 0;
  const name = profile.full_name || profile.username || '—';
  const engagementRate = (profile as { average_engagement_rate?: number | null }).average_engagement_rate;

  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondaryColor = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const overlayBg = 'rgba(0,0,0,0.35)';

  const goNext = () => {
    if (photos.length <= 1) return;
    setPhotoIndex((i) => (i + 1) % photos.length);
  };

  const goPrev = () => {
    if (photos.length <= 1) return;
    setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
  };

  const openLanguages = () => {
    if (onPressLanguages) onPressLanguages();
    else setLanguagesModalVisible(true);
  };

  const photoUri = photos[photoIndex] ?? photos[0];

  const wrapperBg = isDark ? theme.colors.dark.background : theme.colors.light.background;

  return (
    <View style={[styles.wrapper, { backgroundColor: wrapperBg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          onReject != null && onAccept != null && { paddingBottom: 200 },
        ]}
        showsVerticalScrollIndicator={true}
        bounces={true}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.imageContainer, { height: IMAGE_SECTION_HEIGHT }, !photoUri && styles.imageContainerPlaceholder]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={[styles.coverImage, styles.placeholderImage]} />
          )}

          {/* Progress indicator: thin line on top */}
          {photos.length > 1 && (
            <View style={styles.progressContainer} pointerEvents="none">
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressSegment,
                    i === photoIndex ? styles.progressSegmentFilled : styles.progressSegmentEmpty,
                  ]}
                />
              ))}
            </View>
          )}

          {photos.length > 1 && (
            <View style={styles.tapHint} pointerEvents="none">
              <Text style={styles.tapHintText}>{t('kolbed.tapToScrollPhotos')}</Text>
            </View>
          )}

          {photos.length > 1 && (
            <>
              <Pressable style={styles.tapLeft} onPress={goPrev} />
              <Pressable style={styles.tapRight} onPress={goNext} />
            </>
          )}

          <View style={[styles.badge, styles.badgeTopLeft]}>
            <Text style={styles.badgeAgeText}>
              {age != null ? `${age}` : '—'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.badge, styles.badgeTopRight]}
            onPress={openLanguages}
            activeOpacity={0.8}
          >
            <Text style={styles.flagText}>
              {motherTongue ? getFlagForLang(motherTongue) : '🌐'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sezione sotto l'immagine: nome + followers + nicchie sempre in alto, poi contenuto per tipo (analytics/ristorante/rating/...) */}
        <View style={[
          styles.analyticsSection,
          {
            backgroundColor: isDark ? theme.colors.dark.secondaryBackground : theme.colors.light.secondaryBackground,
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          },
        ]}>
          {/* Nome e meta (followers + nicchie) dentro la card per tutti i tipi */}
          <Text style={[styles.cardName, { color: textColor }]} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.nameMetaRow}>
            <Text style={[styles.followersInline, { color: secondaryColor }]}>
              {followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}K` : String(followersCount)}{' '}
              {t('profile.followers')}
            </Text>
            {nichesDisplay.length > 0 && (
              <View style={styles.nichesRowInline}>
                {nichesDisplay.slice(0, 4).map((niche, i) => (
                  <View key={i} style={[styles.nicheChip, { borderColor: secondaryColor }]}>
                    <Text style={[styles.nicheChipText, { color: secondaryColor }]} numberOfLines={1}>
                      {niche}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {isRestaurantJolly ? (
            <>
              <Text style={[styles.analyticsHint, { color: secondaryColor }]}>{t('kolbed.scrollUpForAnalytics')}</Text>
              <Text style={[styles.analyticsSectionLabel, { color: textColor }]}>{t('kolbed.jollyRestaurant')}</Text>
              {restaurantInfo?.menu_url && (
                <TouchableOpacity onPress={() => openLink(restaurantInfo.menu_url)} style={styles.analyticsRow}>
                  <Text style={[styles.analyticsLabel, { color: secondaryColor }]}>{t('kolbed.jollyMenu')}</Text>
                  <Ionicons name="open-outline" size={18} color={theme.colors.primary.blue} />
                </TouchableOpacity>
              )}
              {restaurantInfo?.menu_text ? (
                <View style={styles.analyticsRow}>
                  <Text style={[styles.analyticsLabel, { color: secondaryColor }]}>{t('kolbed.jollyMenu')}</Text>
                  <Text style={[styles.analyticsValue, { color: textColor }]} numberOfLines={3}>{restaurantInfo.menu_text}</Text>
                </View>
              ) : null}
              {restaurantInfo?.address ? (
                <View style={styles.analyticsRow}>
                  <Text style={[styles.analyticsLabel, { color: secondaryColor }]}>{t('kolbed.jollyAddress')}</Text>
                  <Text style={[styles.analyticsValue, { color: textColor }]} numberOfLines={2}>{restaurantInfo.address}</Text>
                </View>
              ) : null}
              {restaurantInfo?.place_url && (
                <TouchableOpacity onPress={() => openLink(restaurantInfo.place_url)} style={[styles.analyticsRow, styles.linkRow]}>
                  <Text style={[styles.analyticsValue, { color: theme.colors.primary.blue }]}>{t('kolbed.jollyOpenMap')}</Text>
                  <Ionicons name="map-outline" size={18} color={theme.colors.primary.blue} />
                </TouchableOpacity>
              )}
              {restaurantInfo?.opening_hours && typeof restaurantInfo.opening_hours === 'object' && (
                <View style={styles.analyticsRow}>
                  <Text style={[styles.analyticsLabel, { color: secondaryColor }]}>{t('kolbed.jollyOpeningHours')}</Text>
                  <Text style={[styles.analyticsValue, { color: textColor }]}>
                    {JSON.stringify(restaurantInfo.opening_hours).replace(/[{}"]/g, ' ')}
                  </Text>
                </View>
              )}
              {restaurantInfo?.opening_days && restaurantInfo.opening_days.length > 0 && (
                <View style={styles.analyticsRow}>
                  <Text style={[styles.analyticsLabel, { color: secondaryColor }]}>{t('kolbed.jollyOpeningDays')}</Text>
                  <Text style={[styles.analyticsValue, { color: textColor }]}>{restaurantInfo.opening_days.join(', ')}</Text>
                </View>
              )}
              {!restaurantInfo && (
                <Text style={[styles.analyticsHint, { color: secondaryColor }]}>{t('kolbed.jollyNoRestaurantInfo')}</Text>
              )}
            </>
          ) : isRatingJolly ? (
            <>
              <Text style={[styles.analyticsHint, { color: secondaryColor }]}>{t('kolbed.jollyRatingHint')}</Text>
              <Text style={[styles.analyticsSectionLabel, { color: textColor }]}>{t('kolbed.jollyRating')}</Text>
              {ratingLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary.blue} style={styles.ratingLoader} />
              ) : ratingSummary != null ? (
                <>
                  <View style={styles.ratingRow}>
                    <TouchableOpacity
                      style={[styles.thumbsButton, canVote && ratingSummary.my_vote === 'up' && styles.thumbsButtonActive]}
                      onPress={() => canVote && handleVote('up')}
                      disabled={!canVote}
                    >
                      <Ionicons name="thumbs-up" size={28} color={canVote && ratingSummary.my_vote === 'up' ? theme.colors.primary.blue : secondaryColor} />
                      <Text style={[styles.thumbsCount, { color: textColor }]}>{ratingSummary.thumbs_up}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.thumbsButton, canVote && ratingSummary.my_vote === 'down' && styles.thumbsButtonActive]}
                      onPress={() => canVote && handleVote('down')}
                      disabled={!canVote}
                    >
                      <Ionicons name="thumbs-down" size={28} color={canVote && ratingSummary.my_vote === 'down' ? theme.colors.primary.blue : secondaryColor} />
                      <Text style={[styles.thumbsCount, { color: textColor }]}>{ratingSummary.thumbs_down}</Text>
                    </TouchableOpacity>
                  </View>
                  {!canVote && currentProfile?.role === 'host' && (
                    <Text style={[styles.analyticsHint, { color: secondaryColor }]}>{t('kolbed.jollyRatingHint')}</Text>
                  )}
                </>
              ) : null}
            </>
          ) : isExcursionJolly ? (
            <>
              <Text style={[styles.analyticsHint, { color: secondaryColor }]}>{t('kolbed.scrollUpForAnalytics')}</Text>
              <Text style={[styles.analyticsSectionLabel, { color: textColor }]}>
                {jollySub === 'boat_excursions' ? t('kolbed.jollyBoatExcursionsTitle') : t('kolbed.jollyExcursionsTitle')}
              </Text>
              {profile.bio ? (
                <Text style={[styles.analyticsValue, { color: textColor }]}>{profile.bio}</Text>
              ) : (
                <Text style={[styles.analyticsHint, { color: secondaryColor }]}>{t('kolbed.jollyNoRestaurantInfo')}</Text>
              )}
            </>
          ) : isHomeProductsJolly ? (
            <>
              <Text style={[styles.analyticsHint, { color: secondaryColor }]}>{t('kolbed.scrollUpForAnalytics')}</Text>
              <Text style={[styles.analyticsSectionLabel, { color: textColor }]}>{t('kolbed.jollyCatalog')}</Text>
              <Text style={[styles.analyticsValue, { color: textColor }]}>
                {t('kolbed.jollyProductsCount', { count: productCount })}
              </Text>
              {onPressViewCatalog && (
                <TouchableOpacity
                  style={[styles.catalogButton]}
                  onPress={() => onPressViewCatalog(profile.id)}
                >
                  <Text style={[styles.analyticsValue, { color: theme.colors.primary.blue }]}>{t('kolbed.jollyViewCatalog')}</Text>
                  <Ionicons name="open-outline" size={18} color={theme.colors.primary.blue} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.analyticsHint, { color: secondaryColor }]}>{t('kolbed.scrollUpForAnalytics')}</Text>
              <Text style={[styles.analyticsSectionLabel, { color: secondaryColor }]}>{t('kolbed.analytics')}</Text>
              <View style={styles.analyticsRow}>
                <Text style={[styles.analyticsLabel, { color: secondaryColor }]}>{t('kolbed.followersCount')}</Text>
                <Text style={[styles.analyticsValue, { color: textColor }]}>
                  {followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}K` : String(followersCount)}
                </Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={[styles.analyticsLabel, { color: secondaryColor }]}>{t('kolbed.engagementRate')}</Text>
                <Text style={[styles.analyticsValue, { color: textColor }]}>
                  {engagementRate != null && !Number.isNaN(engagementRate)
                    ? `${Number(engagementRate * 100).toFixed(2)}%`
                    : '3,2%'}
                </Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={[styles.analyticsLabel, { color: secondaryColor }]}>{t('kolbed.reachMedio')}</Text>
                <Text style={[styles.analyticsValue, { color: textColor }]}>
                  {followersCount >= 1000
                    ? `${((followersCount * 0.5) / 1000).toFixed(1)}K`
                    : String(Math.round(followersCount * 0.5))}
                </Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={[styles.analyticsLabel, { color: secondaryColor }]}>{t('kolbed.interazioni')}</Text>
                <Text style={[styles.analyticsValue, { color: textColor }]}>
                  {followersCount >= 1000
                    ? `${((followersCount * 0.05) / 1000).toFixed(1)}K`
                    : String(Math.max(1, Math.round(followersCount * 0.05)))}
                </Text>
              </View>
              {nichesDisplay.length > 0 && (
                <View style={styles.analyticsRow}>
                  <Text style={[styles.analyticsLabel, { color: secondaryColor }]}>{t('kolbed.niches')}</Text>
                  <Text style={[styles.analyticsValue, { color: textColor }]} numberOfLines={2}>
                    {nichesDisplay.slice(0, 4).join(' · ')}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {onReject != null && onAccept != null && (
        <View style={[styles.footer, { backgroundColor: wrapperBg }]}>
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.actionButtonWrap]}
              onPress={onReject}
              activeOpacity={0.85}
            >
              <View style={[styles.actionButton, styles.actionButtonReject]}>
                <Ionicons name="close" size={28} color="#fff" />
              </View>
              <Text style={styles.actionButtonLabel}>{t('kolbed.swipeReject')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonWrap}
              onPress={onAccept}
              activeOpacity={0.85}
            >
              <View style={[styles.actionButton, styles.actionButtonAccept]}>
                <Ionicons name="checkmark" size={28} color="#fff" />
              </View>
              <Text style={styles.actionButtonLabel}>{t('kolbed.requestCollab')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal: lingue (madre + altre) */}
      <Modal
        visible={languagesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguagesModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLanguagesModalVisible(false)}
        >
          <View
            style={[
              styles.languagesBox,
              { backgroundColor: isDark ? theme.colors.dark.card : theme.colors.light.card },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.languagesTitle, { color: textColor }]}>
              {t('kolbed.languagesModalTitle')}
            </Text>
            {motherTongue && (
              <Text style={[styles.languageRow, { color: textColor }]}>
                {getFlagForLang(motherTongue)} {t('kolbed.motherTongueLabel')}: {getLabelForLang(motherTongue)}
              </Text>
            )}
            {otherLanguages.length > 0 && (
              <Text style={[styles.languageRow, { color: secondaryColor }]}>
                {otherLanguages.map((c) => getFlagForLang(c)).join(' ')} —{' '}
                {otherLanguages.map((c) => getLabelForLang(c)).join(', ')}
              </Text>
            )}
            {languages.length === 0 && (
              <Text style={[styles.languageRow, { color: secondaryColor }]}>{t('kolbed.languagesNotSpecified')}</Text>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 240 },
  imageContainer: {
    width: '100%',
    backgroundColor: 'rgba(40,40,40,0.95)',
  },
  imageContainerPlaceholder: {
    backgroundColor: 'rgba(60,60,60,0.98)',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: 'rgba(128,128,128,0.3)',
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: PROGRESS_GAP,
    paddingTop: 50,
  },
  progressSegment: {
    height: PROGRESS_SEGMENT_HEIGHT,
    borderRadius: PROGRESS_SEGMENT_HEIGHT / 2,
    minWidth: 24,
    flex: 1,
    maxWidth: 48,
  },
  progressSegmentFilled: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  progressSegmentEmpty: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  tapHint: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapHintText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  tapLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: TAP_ZONE_WIDTH,
  },
  tapRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: TAP_ZONE_WIDTH,
  },
  badge: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  badgeTopLeft: {
    top: 48,
    left: theme.spacing.screenPadding,
  },
  badgeTopRight: {
    top: 48,
    right: theme.spacing.screenPadding,
  },
  badgeText: {
    ...theme.typography.headline,
    fontWeight: '600',
  },
  /** Età sempre bianca sul badge scuro (leggibile in light mode) */
  badgeAgeText: {
    ...theme.typography.headline,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  flagText: {
    fontSize: 24,
  },
  analyticsSection: {
    padding: theme.spacing.screenPadding,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing['2xl'],
    minHeight: 180,
  },
  analyticsHint: {
    ...theme.typography.caption1,
    marginBottom: theme.spacing.sm,
  },
  analyticsTitle: {
    ...theme.typography.headline,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  cardName: {
    ...theme.typography.title2,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  nameMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  followersInline: {
    ...theme.typography.subheadline,
  },
  nichesRowInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  analyticsSectionLabel: {
    ...theme.typography.subheadline,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  analyticsLabel: { ...theme.typography.subheadline },
  analyticsValue: { ...theme.typography.subheadline, fontWeight: '600' },
  linkRow: { marginTop: 4 },
  catalogButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.md },
  ratingLoader: { marginVertical: theme.spacing.md },
  ratingRow: { flexDirection: 'row', gap: theme.spacing.xl, marginBottom: theme.spacing.md },
  thumbsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.lg,
  },
  thumbsButtonActive: { backgroundColor: 'rgba(79, 70, 229, 0.15)' },
  thumbsCount: { ...theme.typography.headline },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.25)',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...theme.typography.title3,
    fontWeight: '600',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  followers: {
    ...theme.typography.subheadline,
  },
  nichesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  nicheChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  nicheChipText: {
    ...theme.typography.caption1,
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },
  actionButtonWrap: {
    alignItems: 'center',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonReject: {
    backgroundColor: 'rgba(255,59,48,0.9)',
  },
  actionButtonAccept: {
    backgroundColor: 'rgba(52,199,89,0.9)',
  },
  actionButtonLabel: {
    marginTop: 4,
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.screenPadding,
  },
  languagesBox: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    maxWidth: 320,
    width: '100%',
  },
  languagesTitle: {
    ...theme.typography.headline,
    marginBottom: theme.spacing.md,
  },
  languageRow: {
    ...theme.typography.body,
    marginBottom: theme.spacing.sm,
  },
});
