/**
 * Profile Screen
 * Profilo utente corrente – header orizzontale (avatar sinistra + info destra),
 * menu navigazione in grid card 2 colonne con icone, "I miei post" compatto.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Button, Avatar, Badge, LanguagePickerModal, BioText } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { formatNumberAbbreviated } from '../../utils/formatters';
import { AuthService } from '../../services/auth.service';
import { SupportService } from '../../services/support.service';
import { PropertiesService } from '../../services/properties.service';
import { PostsService } from '../../services/posts.service';
import { isAdminEmail } from '../../constants/admin';
import type { Property } from '../../types/property';
import type { Post } from '../../types/post';
import { useFocusEffect } from '@react-navigation/native';
import type { ProfileScreenProps } from '../../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_PADDING = theme.spacing.screenPadding;
const CARD_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

// ──────────────────────────────────────────────────────────────────────────
// Grid card component
// ──────────────────────────────────────────────────────────────────────────
interface GridCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: number;
  color?: string;
  bgColor?: string;
}

function GridCard({ icon, label, onPress, badge, color, bgColor }: GridCardProps) {
  const { isDark } = useTheme();
  const iconColor = color ?? theme.colors.primary.blue;
  const cardBg = bgColor ?? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)');
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;

  return (
    <TouchableOpacity
      style={[styles.gridCard, { backgroundColor: cardBg, width: CARD_SIZE, height: CARD_SIZE * 0.75 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.gridCardIconWrap}>
        <Ionicons name={icon} size={28} color={iconColor} />
        {badge != null && badge > 0 && (
          <View style={styles.gridCardBadge}>
            <Text style={styles.gridCardBadgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.gridCardLabel, { color: textColor }]} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Main screen
// ──────────────────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }: ProfileScreenProps<'Profile'>) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { isDark, setTheme } = useTheme();
  const { t } = useI18n();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const [supportUnread, setSupportUnread] = useState(0);
  const [hostStructures, setHostStructures] = useState<Property[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      SupportService.getUnreadSupportCount(user.id).then(setSupportUnread);
      if (profile?.role === 'host') {
        PropertiesService.getPropertiesByHost(user.id).then(setHostStructures);
      }
      PostsService.getPostsByAuthor(user.id, 0, 20)
        .then(({ posts }) => setMyPosts(posts))
        .catch(() => setMyPosts([]));
    }, [user?.id, profile?.role])
  );

  const backgroundColor = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondaryColor = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';

  const handleChangePhoto = async () => {
    if (!user?.id) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.photoPermissionTitle'), t('common.photoPermissionMessage'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingAvatar(true);
    try {
      await AuthService.uploadAvatar(user.id, result.assets[0].uri, result.assets[0].base64 ?? null);
      await refreshProfile();
    } catch (e) {
      console.error(e);
      Alert.alert(t('common.error'), t('common.photoError'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!profile) return null;

  const isHost = profile.role === 'host';
  const isJolly = profile.role === 'jolly';
  const isAdmin = isAdminEmail(profile.email);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <Text style={[styles.topBarTitle, { color: textColor }]}>{t('nav.profile')}</Text>
          <View style={styles.topBarIcons}>
            <TouchableOpacity onPress={() => setLanguagePickerVisible(true)} style={styles.topBarBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="language-outline" size={22} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTheme(isDark ? 'light' : 'dark')} style={styles.topBarBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={22} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.topBarBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="settings-outline" size={22} color={textColor} />
              {supportUnread > 0 && (
                <View style={styles.gearBadge}>
                  <Text style={styles.gearBadgeText}>{supportUnread > 99 ? '99+' : supportUnread}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <LanguagePickerModal visible={languagePickerVisible} onClose={() => setLanguagePickerVisible(false)} />

        {/* ── Profile header: avatar left + info right ── */}
        <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
          <View style={styles.profileHeaderRow}>
            {/* Avatar (sinistra) */}
            <TouchableOpacity onPress={handleChangePhoto} disabled={uploadingAvatar} activeOpacity={0.8} style={styles.avatarWrap}>
              <Avatar uri={profile.avatar_url} size={86} verified={Boolean(profile.is_verified)} />
              {uploadingAvatar ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              ) : (
                <View style={styles.avatarCameraBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Info (destra) */}
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
                {profile.full_name || t('common.noName')}
              </Text>
              {profile.username && (
                <Text style={[styles.username, { color: secondaryColor }]}>@{profile.username}</Text>
              )}
              {profile.role && (
                <Badge variant="primary" style={styles.roleBadge}>{profile.role}</Badge>
              )}
              {/* Stats inline */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: textColor }]}>
                    {formatNumberAbbreviated(profile.followers_count || 0)}
                  </Text>
                  <Text style={[styles.statLabel, { color: secondaryColor }]}>{t('profile.followers')}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: secondaryColor }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: textColor }]}>
                    {formatNumberAbbreviated(profile.following_count || 0)}
                  </Text>
                  <Text style={[styles.statLabel, { color: secondaryColor }]}>{t('profile.following')}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: secondaryColor }]} />
                <View style={styles.statItem}>
                  <Ionicons name="cash-outline" size={13} color={theme.colors.primary.blue} />
                  <Text style={[styles.statValue, { color: textColor }]}>{profile.points || 0}</Text>
                  <Text style={[styles.statLabel, { color: secondaryColor }]}>{t('profile.points')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bio */}
          {profile.bio ? (
            <BioText
              bio={profile.bio}
              bioLinksApproved={profile.bio_links_approved}
              style={[styles.bio, { color: secondaryColor }]}
            />
          ) : null}

          {/* Edit Profile */}
          <Button variant="outline" onPress={() => navigation.navigate('EditProfile')} style={styles.editBtn}>
            {t('profile.editProfile')}
          </Button>
        </View>

        {/* ── I miei post (thumbnails compatti) ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>{t('profile.myPosts')}</Text>
          </View>
          {myPosts.length > 0 ? (
            <View style={styles.postsGrid}>
              {myPosts.slice(0, 6).map((post) => {
                const media = Array.isArray(post.media)
                  ? post.media
                  : typeof post.media === 'string'
                  ? (() => { try { return JSON.parse(post.media as unknown as string); } catch { return []; } })()
                  : [];
                const firstImage = media?.find((m: { type?: string; url?: string }) => m?.type === 'image' && m?.url);
                return (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postThumbWrap}
                    onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                    activeOpacity={0.75}
                  >
                    {firstImage?.url ? (
                      <Image source={{ uri: firstImage.url }} style={styles.postThumb} />
                    ) : (
                      <View style={[styles.postThumb, styles.postThumbPlaceholder, { backgroundColor: cardBg }]}>
                        <Ionicons name="image-outline" size={22} color={secondaryColor} />
                      </View>
                    )}
                    {post.approval_status === 'pending' && (
                      <View style={styles.postPendingBadge}>
                        <Ionicons name="time-outline" size={12} color="#fff" />
                      </View>
                    )}
                    {post.visibility === 'private' && (
                      <View style={styles.postPrivateBadge}>
                        <Ionicons name="lock-closed" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.emptyHint, { color: secondaryColor }]}>{t('profile.myPostsEmpty')}</Text>
          )}
        </View>

        {/* ── Grid cards menu ── */}
        <View style={styles.gridSection}>
          {/* Row 1: Messaggi + Notifiche */}
          <View style={styles.gridRow}>
            <GridCard
              icon="chatbubbles-outline"
              label={t('profile.messages')}
              onPress={() => navigation.navigate('MessagesList')}
            />
            <GridCard
              icon="notifications-outline"
              label={t('profile.notifications')}
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>

          {/* Row 2: Dashboard + (Admin se applicabile) */}
          <View style={styles.gridRow}>
            {profile.role && (
              <GridCard
                icon="bar-chart-outline"
                label={t('nav.dashboard')}
                onPress={() => navigation.navigate('Dashboard')}
              />
            )}
            {isAdmin && (
              <GridCard
                icon="shield-checkmark-outline"
                label={t('profile.adminPage')}
                onPress={() => navigation.navigate('Admin')}
              />
            )}
            {/* Filler per row dispari */}
            {profile.role && !isAdmin && <View style={{ width: CARD_SIZE, height: CARD_SIZE * 0.75 }} />}
          </View>

          {/* Row 3: La mia struttura + Richieste link (solo host) */}
          {isHost && (
            <View style={styles.gridRow}>
              <GridCard
                icon="business-outline"
                label={t('profile.myStructure')}
                onPress={() => navigation.navigate('HostStructure', {})}
              />
              <GridCard
                icon="link-outline"
                label={t('affiliate.richiesteLink')}
                onPress={() => navigation.navigate('AffiliateLinkRequests')}
              />
            </View>
          )}
          {isHost && (
            <View style={styles.gridRow}>
              <GridCard
                icon="card-outline"
                label={t('travelerLink.menuLabel')}
                onPress={() => navigation.navigate('HostTravelerLink')}
              />
              <View style={{ width: CARD_SIZE, height: CARD_SIZE * 0.75 }} />
            </View>
          )}

          {/* Strutture host (card lista strutture) */}
          {isHost && hostStructures.length > 0 && (
            <View style={[styles.structuresCard, { backgroundColor: cardBg }]}>
              <Text style={[styles.structuresCardTitle, { color: secondaryColor }]}>
                {t('profile.myStructure')}
              </Text>
              {hostStructures.map((prop) => (
                <TouchableOpacity
                  key={prop.id}
                  style={styles.structureRow}
                  onPress={() => navigation.navigate('HostStructureView', { propertyId: prop.id })}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: (prop.images ?? [])[0] || undefined }}
                    style={styles.structureThumb}
                  />
                  <View style={styles.structureInfo}>
                    <Text style={[styles.structureName, { color: textColor }]} numberOfLines={1}>
                      {prop.title || t('profile.myStructure')}
                    </Text>
                    {prop.city && (
                      <Text style={[styles.structureLocation, { color: secondaryColor }]} numberOfLines={1}>
                        {prop.city}{prop.country ? `, ${prop.country}` : ''}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={secondaryColor} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* I miei prodotti (solo Jolly home_products) */}
          {isJolly && profile.jolly_subcategory === 'home_products' && (
            <View style={styles.gridRow}>
              <GridCard
                icon="cart-outline"
                label={t('kolbed.jollyMyProducts')}
                onPress={() => navigation.navigate('JollyMyProducts')}
              />
              <View style={{ width: CARD_SIZE }} />
            </View>
          )}
        </View>

        {/* ── Sign Out ── */}
        <TouchableOpacity style={[styles.signOutBtn, { borderColor: theme.colors.error }]} onPress={signOut} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
          <Text style={[styles.signOutText, { color: theme.colors.error }]}>{t('auth.signOut')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: GRID_PADDING,
    paddingVertical: theme.spacing.md,
  },
  topBarTitle: {
    ...theme.typography.largeTitle,
    fontWeight: '700',
  },
  topBarIcons: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  topBarBtn: { padding: 4, position: 'relative' },
  gearBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  gearBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Profile card
  profileCard: {
    marginHorizontal: GRID_PADDING,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  avatarWrap: { position: 'relative' },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 43,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: { flex: 1, paddingTop: 2 },
  name: { ...theme.typography.title2, fontWeight: '700' },
  username: { ...theme.typography.caption1, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', marginTop: 6 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  statItem: { alignItems: 'center', flexDirection: 'column' },
  statValue: { ...theme.typography.subheadline, fontWeight: '700' },
  statLabel: { ...theme.typography.caption2, marginTop: 1 },
  statDivider: { width: 1, height: 24, opacity: 0.2 },
  bio: { ...theme.typography.footnote, marginTop: theme.spacing.md, lineHeight: 18 },
  editBtn: { marginTop: theme.spacing.md, width: '100%' },

  // Posts grid
  section: {
    marginHorizontal: GRID_PADDING,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: { ...theme.typography.headline, fontWeight: '600' },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  postThumbWrap: {
    width: (SCREEN_WIDTH - GRID_PADDING * 2 - 4 * 2) / 3,
    aspectRatio: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  postThumb: { width: '100%', height: '100%' },
  postThumbPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  postPendingBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,165,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postPrivateBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyHint: { ...theme.typography.caption1, paddingVertical: theme.spacing.sm },

  // Grid cards
  gridSection: {
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
    marginBottom: theme.spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  gridCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  gridCardIconWrap: { position: 'relative' },
  gridCardBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  gridCardBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  gridCardLabel: {
    ...theme.typography.footnote,
    fontWeight: '600',
    lineHeight: 16,
  },

  // Structures card
  structuresCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
  },
  structuresCardTitle: {
    ...theme.typography.caption1,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  structureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  structureThumb: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  structureInfo: { flex: 1 },
  structureName: { ...theme.typography.subheadline, fontWeight: '600' },
  structureLocation: { ...theme.typography.caption1, marginTop: 2 },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: GRID_PADDING,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1.5,
    marginBottom: theme.spacing.xl,
  },
  signOutText: { ...theme.typography.subheadline, fontWeight: '600' },
});
