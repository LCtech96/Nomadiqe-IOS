/**
 * Admin Screen
 * Solo per admin (facevoiceai@gmail.com): approva/rifiuta post e commenti in attesa
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
  Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Card, Avatar, Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { PostsService } from '../../services/posts.service';
import { ProfilesService } from '../../services/profiles.service';
import { PropertiesService, type PropertyMediaRow, type PropertyAdminSummary } from '../../services/properties.service';
import {
  JollyLocalServicesService,
  type JollyServiceMediaAdminRow,
} from '../../services/jollyLocalServices.service';
import { SupportService, type SupportTicket } from '../../services/support.service';
import { formatRelativeTime } from '../../utils/formatters';
import { STRUCTURE_OPPORTUNITIES } from '../../constants/creator';
import type { Post, PostComment } from '../../types';
import type { UserProfile } from '../../types';
import type { ProfileScreenProps } from '../../types/navigation';

type Tab = 'posts' | 'comments' | 'bio' | 'support' | 'media' | 'jollyMedia' | 'creators' | 'hosts';

export default function AdminScreen({
  navigation,
}: ProfileScreenProps<'Admin'>) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [bioProfiles, setBioProfiles] = useState<UserProfile[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [propertyMedia, setPropertyMedia] = useState<PropertyMediaRow[]>([]);
  const [propertySummaries, setPropertySummaries] = useState<Record<string, PropertyAdminSummary>>({});
  const [jollyMedia, setJollyMedia] = useState<JollyServiceMediaAdminRow[]>([]);
  const [jollyMediaPreviewUrls, setJollyMediaPreviewUrls] = useState<Record<string, string>>({});
  const [creatorApplications, setCreatorApplications] = useState<UserProfile[]>([]);
  const [hostApplications, setHostApplications] = useState<UserProfile[]>([]);
  const [selectedHost, setSelectedHost] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [mediaViewerPropertyId, setMediaViewerPropertyId] = useState<string | null>(null);
  const [viewerMediaIndex, setViewerMediaIndex] = useState(0);
  const [selectedCreator, setSelectedCreator] = useState<UserProfile | null>(null);
  const [approveOpportunities, setApproveOpportunities] = useState<string[]>([]);
  const [showOpportunityPicker, setShowOpportunityPicker] = useState(false);

  const loadPosts = async () => {
    try {
      const data = await PostsService.getPendingPosts();
      setPosts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadComments = async () => {
    try {
      const data = await PostsService.getPendingComments();
      setComments(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadBio = async () => {
    try {
      const data = await ProfilesService.getProfilesPendingBioLinkApproval();
      setBioProfiles(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSupport = async () => {
    try {
      const data = await SupportService.getAllTicketsForAdmin();
      setSupportTickets(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPropertyMedia = async () => {
    try {
      const media = await PropertiesService.getPendingPropertyMediaForAdmin();
      setPropertyMedia(media);
      const ids = [...new Set(media.map((m) => m.property_id))];
      if (ids.length === 0) {
        setPropertySummaries({});
        return;
      }
      try {
        const summaries = await PropertiesService.getPropertyAdminSummaries(ids);
        setPropertySummaries(summaries);
      } catch (summaryError) {
        console.error(
          'Property admin summaries failed — run scripts/supabase-property-media-approve-rpc.sql in Supabase:',
          summaryError
        );
        setPropertySummaries({});
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadJollyMedia = async () => {
    try {
      const media = await JollyLocalServicesService.getPendingJollyServiceMediaForAdmin();
      console.log("1. Raw Media Rows from DB:", media);

      const previews = await JollyLocalServicesService.resolveMediaPreviewUrls(media);
      console.log("2. Resolved Previews:", previews);

      setJollyMedia(media);
      setJollyMediaPreviewUrls(previews);
    } catch (e) {
      console.error(e);
      setJollyMedia([]);
      setJollyMediaPreviewUrls({});
    }
  };

  const loadCreators = async () => {
    try {
      const data = await ProfilesService.getCreatorApplicationsForAdmin();
      setCreatorApplications(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadHosts = async () => {
    try {
      const data = await ProfilesService.getHostApplicationsForAdmin();
      setHostApplications(data);
    } catch (e) {
      console.error(e);
    }
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([
      loadPosts(),
      loadComments(),
      loadBio(),
      loadSupport(),
      loadPropertyMedia(),
      loadJollyMedia(),
      loadCreators(),
      loadHosts(),
    ]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleApprovePost = async (postId: string) => {
    setUpdatingId(postId);
    try {
      await PostsService.setApprovalStatus(postId, 'approved');
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) {
      Alert.alert(t('common.error'), t('admin.errorApprovePost'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectPost = async (postId: string) => {
    setUpdatingId(postId);
    try {
      await PostsService.setApprovalStatus(postId, 'rejected');
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) {
      Alert.alert(t('common.error'), t('admin.errorRejectPost'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApproveComment = async (commentId: string) => {
    setUpdatingId(commentId);
    try {
      await PostsService.setCommentApprovalStatus(commentId, 'approved');
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      Alert.alert(t('common.error'), t('admin.errorApproveComment'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectComment = async (commentId: string) => {
    setUpdatingId(commentId);
    try {
      await PostsService.setCommentApprovalStatus(commentId, 'rejected');
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      Alert.alert(t('common.error'), t('admin.errorRejectComment'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApproveBio = async (profileId: string) => {
    setUpdatingId(profileId);
    try {
      await ProfilesService.approveBioLinks(profileId);
      setBioProfiles((prev) => prev.filter((p) => p.id !== profileId));
    } catch (e) {
      Alert.alert(t('common.error'), t('admin.errorApproveBio'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApprovePropertyMediaGroup = async (propertyId: string) => {
    if (!user?.id) return;
    const mediaIds = propertyMedia.filter((m) => m.property_id === propertyId).map((m) => m.id);
    if (mediaIds.length === 0) return;
    setUpdatingId(propertyId);
    try {
      await PropertiesService.approveAllPendingPropertyMedia(mediaIds, user.id);
      setPropertyMedia((prev) => prev.filter((m) => m.property_id !== propertyId));
      setMediaViewerPropertyId(null);
    } catch (e) {
      Alert.alert(t('common.error'), t('admin.errorApproveMedia'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectPropertyMediaGroup = async (propertyId: string) => {
    if (!user?.id) return;
    const mediaIds = propertyMedia.filter((m) => m.property_id === propertyId).map((m) => m.id);
    if (mediaIds.length === 0) return;
    setUpdatingId(propertyId);
    try {
      await PropertiesService.rejectAllPendingPropertyMedia(mediaIds, user.id);
      setPropertyMedia((prev) => prev.filter((m) => m.property_id !== propertyId));
      setMediaViewerPropertyId(null);
    } catch (e) {
      Alert.alert(t('common.error'), t('admin.errorRejectMedia'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApproveJollyMedia = async (mediaId: string) => {
    setUpdatingId(mediaId);
    try {
      await JollyLocalServicesService.approveJollyServiceMedia(mediaId);
      setJollyMedia((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (e) {
      Alert.alert(t('common.error'), t('admin.errorApproveJollyMedia'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectJollyMedia = async (mediaId: string) => {
    setUpdatingId(mediaId);
    try {
      await JollyLocalServicesService.rejectJollyServiceMedia(mediaId);
      setJollyMedia((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (e) {
      Alert.alert(t('common.error'), t('admin.errorRejectJollyMedia'));
    } finally {
      setUpdatingId(null);
    }
  };

  const jollyMediaKindLabel = (kind: string) => {
    const key = `admin.jollyMediaKinds.${kind}` as const;
    const label = t(key);
    return label === key ? kind : label;
  };

  const openCreatorDetail = (creator: UserProfile) => {
    setSelectedCreator(creator);
    setApproveOpportunities(creator.admin_approved_opportunities ?? []);
    setShowOpportunityPicker(false);
  };

  const toggleApprovalOpportunity = (value: string) => {
    setApproveOpportunities((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const handleApproveCreator = async () => {
    if (!selectedCreator) return;
    if (showOpportunityPicker) {
      if (approveOpportunities.length === 0) {
        Alert.alert(t('common.error'), t('creator.structureSubtitle'));
        return;
      }
      setUpdatingId(selectedCreator.id);
      try {
        await ProfilesService.setCreatorApproval(selectedCreator.id, 'approved', approveOpportunities);
        setCreatorApplications((prev) => prev.filter((p) => p.id !== selectedCreator.id));
        setSelectedCreator(null);
        setShowOpportunityPicker(false);
      } catch (e) {
        Alert.alert(t('common.error'), e instanceof Error ? e.message : 'Error');
      } finally {
        setUpdatingId(null);
      }
    } else {
      setShowOpportunityPicker(true);
    }
  };

  const handleRejectCreator = async () => {
    if (!selectedCreator) return;
    Alert.alert(
      t('admin.creatorReject'),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.reject'),
          style: 'destructive',
          onPress: async () => {
            setUpdatingId(selectedCreator.id);
            try {
              await ProfilesService.setCreatorApproval(selectedCreator.id, 'rejected');
              setCreatorApplications((prev) => prev.filter((p) => p.id !== selectedCreator.id));
              setSelectedCreator(null);
              setShowOpportunityPicker(false);
            } catch (e) {
              Alert.alert(t('common.error'), e instanceof Error ? e.message : 'Error');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const creatorCategoryLabel = (cat: string | null | undefined) => {
    if (!cat) return '-';
    if (cat === 'micro_influencer') return t('creator.categoryMicroInfluencer');
    if (cat === 'ugc_creator') return t('creator.categoryUgcCreator');
    return t('creator.categoryInfluencer');
  };
  const structureLabel = (value: string) => {
    const opt = STRUCTURE_OPPORTUNITIES.find((o) => o.value === value);
    return opt ? t(opt.labelKey as keyof typeof t) : value;
  };

  const openHostDetail = (host: UserProfile) => setSelectedHost(host);

  const handleApproveHost = async () => {
    if (!selectedHost) return;
    setUpdatingId(selectedHost.id);
    try {
      await ProfilesService.setHostApproval(selectedHost.id, 'approved');
      setHostApplications((prev) => prev.filter((p) => p.id !== selectedHost.id));
      setSelectedHost(null);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : 'Error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectHost = async () => {
    if (!selectedHost) return;
    Alert.alert(t('admin.hostReject'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.reject'),
        style: 'destructive',
        onPress: async () => {
          setUpdatingId(selectedHost.id);
          try {
            await ProfilesService.setHostApproval(selectedHost.id, 'rejected');
            setHostApplications((prev) => prev.filter((p) => p.id !== selectedHost.id));
            setSelectedHost(null);
          } catch (e) {
            Alert.alert(t('common.error'), e instanceof Error ? e.message : 'Error');
          } finally {
            setUpdatingId(null);
          }
        },
      },
    ]);
  };

  const getCreatorGalleryUrls = (creator: UserProfile): string[] =>
    (creator.profile_cover_images ?? []).filter(
      (url): url is string =>
        Boolean(url?.trim()) && (url.startsWith('http://') || url.startsWith('https://'))
    );

  const selectedCreatorGalleryUrls = selectedCreator
    ? getCreatorGalleryUrls(selectedCreator)
    : [];

  const propertyMediaGroups = useMemo(() => {
    const byProperty = new Map<string, PropertyMediaRow[]>();
    for (const item of propertyMedia) {
      const list = byProperty.get(item.property_id) ?? [];
      list.push(item);
      byProperty.set(item.property_id, list);
    }
    return Array.from(byProperty.entries()).map(([propertyId, media]) => ({
      propertyId,
      media,
      thumbnail: media.find((m) => m.type === 'image') ?? media[0],
    }));
  }, [propertyMedia]);

  const openPropertyMediaViewer = (propertyId: string) => {
    setViewerMediaIndex(0);
    setMediaViewerPropertyId(propertyId);
  };

  const mediaForViewer = mediaViewerPropertyId
    ? propertyMedia.filter((m) => m.property_id === mediaViewerPropertyId)
    : [];
  const viewerSummary = mediaViewerPropertyId ? propertySummaries[mediaViewerPropertyId] : undefined;
  const viewerTitle = viewerSummary?.title ?? mediaViewerPropertyId?.slice(0, 8) ?? '';
  const viewerHostName = viewerSummary?.hostName ?? '';

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('admin.moderation')}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsScroll, { borderBottomColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}
        contentContainerStyle={styles.tabs}
      >
        <TouchableOpacity
          style={[styles.tab, tab === 'posts' && styles.tabActive]}
          onPress={() => setTab('posts')}
        >
          <Text style={[styles.tabText, { color: tab === 'posts' ? theme.colors.primary.blue : secondary }]}>
            {t('admin.posts')}
          </Text>
          {posts.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{posts.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'comments' && styles.tabActive]}
          onPress={() => setTab('comments')}
        >
          <Text style={[styles.tabText, { color: tab === 'comments' ? theme.colors.primary.blue : secondary }]}>
            {t('admin.comments')}
          </Text>
          {comments.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{comments.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'bio' && styles.tabActive]}
          onPress={() => setTab('bio')}
        >
          <Text style={[styles.tabText, { color: tab === 'bio' ? theme.colors.primary.blue : secondary }]}>
            {t('admin.bioLink')}
          </Text>
          {bioProfiles.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{bioProfiles.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'support' && styles.tabActive]}
          onPress={() => setTab('support')}
        >
          <Text style={[styles.tabText, { color: tab === 'support' ? theme.colors.primary.blue : secondary }]}>
            {t('admin.support')}
          </Text>
          {supportTickets.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{supportTickets.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'media' && styles.tabActive]}
          onPress={() => setTab('media')}
        >
          <Text style={[styles.tabText, { color: tab === 'media' ? theme.colors.primary.blue : secondary }]}>
            {t('admin.media')}
          </Text>
          {propertyMediaGroups.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{propertyMediaGroups.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'jollyMedia' && styles.tabActive]}
          onPress={() => setTab('jollyMedia')}
        >
          <Text style={[styles.tabText, { color: tab === 'jollyMedia' ? theme.colors.primary.blue : secondary }]}>
            {t('admin.jollyMedia')}
          </Text>
          {jollyMedia.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{jollyMedia.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'hosts' && styles.tabActive]}
          onPress={() => setTab('hosts')}
        >
          <Text style={[styles.tabText, { color: tab === 'hosts' ? theme.colors.primary.blue : secondary }]}>
            {t('admin.hosts')}
          </Text>
          {hostApplications.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{hostApplications.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'creators' && styles.tabActive]}
          onPress={() => setTab('creators')}
        >
          <Text style={[styles.tabText, { color: tab === 'creators' ? theme.colors.primary.blue : secondary }]}>
            {t('admin.creators')}
          </Text>
          {creatorApplications.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{creatorApplications.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {tab === 'posts' && (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary.blue}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: secondary }]}>
                {t('admin.emptyPosts')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <Avatar
                  uri={item.author?.avatar_url}
                  size={40}
                  verified={Boolean(item.author?.is_verified)}
                />
                <View style={styles.meta}>
                  <Text style={[styles.authorName, { color: textColor }]}>
                    {item.author?.full_name || t('common.user')}
                  </Text>
                  <Text style={[styles.time, { color: secondary }]}>
                    {formatRelativeTime(item.created_at)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.content, { color: textColor }]}>{item.content}</Text>
              {item.media?.length > 0 && item.media[0]?.url && (
                <Image
                  source={{ uri: item.media[0].url }}
                  style={styles.media}
                  resizeMode="cover"
                />
              )}
              <View style={styles.actions}>
                <Button
                  size="sm"
                  onPress={() => handleApprovePost(item.id)}
                  disabled={updatingId === item.id}
                  style={styles.approveBtn}
                >
                  {updatingId === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    t('admin.approve')
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => handleRejectPost(item.id)}
                  disabled={updatingId === item.id}
                  style={styles.rejectBtn}
                >
                  {t('admin.reject')}
                </Button>
              </View>
            </Card>
          )}
        />
      )}

      {tab === 'comments' && (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary.blue}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: secondary }]}>
                {t('admin.emptyComments')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <Avatar
                  uri={(item.user as { avatar_url?: string })?.avatar_url}
                  size={40}
                />
                <View style={styles.meta}>
                  <Text style={[styles.authorName, { color: textColor }]}>
                    {(item.user as { full_name?: string })?.full_name || t('common.user')}
                  </Text>
                  <Text style={[styles.time, { color: secondary }]}>
                    {formatRelativeTime(item.created_at)} · Post: {item.post_id.slice(0, 8)}…
                  </Text>
                </View>
              </View>
              <Text style={[styles.content, { color: textColor }]}>{item.content}</Text>
              <View style={styles.actions}>
                <Button
                  size="sm"
                  onPress={() => handleApproveComment(item.id)}
                  disabled={updatingId === item.id}
                  style={styles.approveBtn}
                >
                  {updatingId === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    t('admin.approve')
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => handleRejectComment(item.id)}
                  disabled={updatingId === item.id}
                  style={styles.rejectBtn}
                >
                  {t('admin.reject')}
                </Button>
              </View>
            </Card>
          )}
        />
      )}

      {tab === 'bio' && (
        <FlatList
          data={bioProfiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary.blue}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: secondary }]}>
                {t('admin.emptyBio')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <Avatar uri={item.avatar_url} size={40} />
                <View style={styles.meta}>
                  <Text style={[styles.authorName, { color: textColor }]}>
                    {item.full_name || t('common.user')}
                  </Text>
                  <Text style={[styles.time, { color: secondary }]}>{item.email}</Text>
                </View>
              </View>
              <Text style={[styles.content, { color: textColor }]}>{item.bio}</Text>
              <View style={styles.actions}>
                <Button
                  size="sm"
                  onPress={() => handleApproveBio(item.id)}
                  disabled={updatingId === item.id}
                  style={styles.approveBtn}
                >
                  {updatingId === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    t('admin.approveLink')
                  )}
                </Button>
              </View>
            </Card>
          )}
        />
      )}

      {tab === 'support' && (
        <FlatList
          data={supportTickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary.blue}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: secondary }]}>
                {t('admin.emptySupport')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AdminSupportTicket', { ticketId: item.id })}
            >
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.meta}>
                    <Text style={[styles.authorName, { color: textColor }]}>
                      {item.request_type} · {item.device || '-'}
                    </Text>
                    <Text style={[styles.time, { color: secondary }]}>
                      {formatRelativeTime(item.created_at)} · User: {item.user_id.slice(0, 8)}…
                    </Text>
                  </View>
                </View>
                <Text style={[styles.content, { color: textColor }]}>
                  {t('admin.supportStatus')}: {item.status}
                </Text>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      {tab === 'media' && (
        <FlatList
          data={propertyMediaGroups}
          keyExtractor={(item) => item.propertyId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary.blue}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: secondary }]}>
                {t('admin.emptyMedia')}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const summary = propertySummaries[item.propertyId];
            const title = summary?.title ?? item.propertyId.slice(0, 8);
            const hostName = summary?.hostName ?? t('common.user');
            const thumb = item.thumbnail;
            return (
              <TouchableOpacity activeOpacity={0.7} onPress={() => openPropertyMediaViewer(item.propertyId)}>
                <Card style={styles.card}>
                  <View style={styles.mediaCardRow}>
                    <View style={styles.mediaCardMeta}>
                      <Text style={[styles.authorName, { color: textColor }]} numberOfLines={2}>
                        {title}
                      </Text>
                      <Text style={[styles.time, { color: secondary }]} numberOfLines={1}>
                        {hostName}
                      </Text>
                      <Text style={[styles.time, { color: secondary }]}>
                        {t('admin.mediaItemCount', { count: item.media.length })}
                      </Text>
                    </View>
                    {thumb?.type === 'image' ? (
                      <Image source={{ uri: thumb.url }} style={styles.mediaCardThumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.mediaCardThumb, styles.mediaCardThumbVideo]}>
                        <Ionicons name="videocam" size={24} color={secondary} />
                      </View>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {tab === 'jollyMedia' && (
        <FlatList
          data={jollyMedia}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary.blue}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: secondary }]}>{t('admin.emptyJollyMedia')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={[styles.authorName, { color: textColor }]}>
                {item.jolly_full_name || item.jolly_email || item.jolly_id.slice(0, 8)}
              </Text>
              <Text style={[styles.time, { color: secondary }]}>
                {t('admin.jollyMediaService')}: {item.service_title || item.service_id.slice(0, 8)} ·{' '}
                {t('admin.jollyMediaKind')}: {jollyMediaKindLabel(item.media_kind)}
              </Text>
              <Text style={[styles.time, { color: secondary }]}>{formatRelativeTime(item.created_at)}</Text>
              {jollyMediaPreviewUrls[item.id] ? (
                <Image
                  source={{ uri: jollyMediaPreviewUrls[item.id] }}
                  style={styles.media}
                  resizeMode="cover"
                />
              ) : item.storage_path || item.public_url ? (
                <View style={[styles.media, styles.mediaVideoPlaceholder]}>
                  <ActivityIndicator size="small" color={theme.colors.primary.blue} />
                </View>
              ) : (
                <View style={[styles.media, styles.mediaVideoPlaceholder]}>
                  <Ionicons name="image-outline" size={48} color={secondary} />
                </View>
              )}
              <View style={styles.actions}>
                <Button
                  size="sm"
                  onPress={() => handleApproveJollyMedia(item.id)}
                  disabled={updatingId === item.id}
                  style={styles.approveBtn}
                >
                  {updatingId === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    t('admin.approve')
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => handleRejectJollyMedia(item.id)}
                  disabled={updatingId === item.id}
                  style={styles.rejectBtn}
                >
                  {t('admin.reject')}
                </Button>
              </View>
            </Card>
          )}
        />
      )}

      {tab === 'hosts' && (
        <FlatList
          data={hostApplications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary.blue}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: secondary }]}>
                {t('admin.emptyHosts')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.7} onPress={() => openHostDetail(item)}>
              <Card style={styles.card}>
                <View style={styles.row}>
                  <Avatar uri={item.avatar_url} size={48} />
                  <View style={styles.meta}>
                    <Text style={[styles.authorName, { color: textColor }]}>
                      {item.full_name || t('common.user')}
                    </Text>
                    <Text style={[styles.time, { color: secondary }]}>{item.email}</Text>
                    <Text style={[styles.time, { color: secondary }]}>
                      {t('admin.hostTier')}: {item.host_tier ?? '-'} · {t('admin.hostStatus')}: {item.host_status ?? 'pending'}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      {tab === 'creators' && (
        <FlatList
          data={creatorApplications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary.blue}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: secondary }]}>
                {t('admin.emptyCreators')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openCreatorDetail(item)}
            >
              <Card style={styles.card}>
                <View style={styles.row}>
                  <Avatar uri={item.avatar_url} size={48} />
                  <View style={styles.meta}>
                    <Text style={[styles.authorName, { color: textColor }]}>
                      {item.full_name || t('common.user')}
                    </Text>
                    <Text style={[styles.time, { color: secondary }]}>{item.email}</Text>
                    <Text style={[styles.time, { color: secondary }]}>
                      {t('admin.creatorCategory')}: {creatorCategoryLabel(item.creator_category)} · {t('admin.creatorStatus')}: {item.creator_status ?? 'pending'}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal: dettaglio creator e approvazione con opportunità */}
      <Modal
        visible={selectedCreator !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setSelectedCreator(null);
          setShowOpportunityPicker(false);
        }}
      >
        {selectedCreator && (
          <View style={[styles.viewerContainer, { backgroundColor: bg }]}>
            <View style={[styles.viewerHeader, styles.creatorModalHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
              <Text style={[styles.viewerTitle, { color: textColor, flex: 1 }]} numberOfLines={1}>
                {selectedCreator.full_name || selectedCreator.email}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedCreator(null);
                  setShowOpportunityPicker(false);
                }}
              >
                <Ionicons name="close" size={28} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.viewerScroll} contentContainerStyle={styles.creatorDetailContent}>
              <View style={styles.creatorDetailRow}>
                <Text style={[styles.creatorDetailLabel, { color: secondary }]}>{t('admin.creatorCategory')}</Text>
                <Text style={[styles.creatorDetailValue, { color: textColor }]}>
                  {creatorCategoryLabel(selectedCreator.creator_category)}
                </Text>
              </View>
              <View style={styles.creatorDetailRow}>
                <Text style={[styles.creatorDetailLabel, { color: secondary }]}>{t('admin.creatorStructures')}</Text>
                <Text style={[styles.creatorDetailValue, { color: textColor }]}>
                  {(selectedCreator.creator_structure_preferences ?? [])
                    .map((v) => structureLabel(v))
                    .join(', ') || '-'}
                </Text>
              </View>
              <View style={styles.creatorDetailRow}>
                <Text style={[styles.creatorDetailLabel, { color: secondary }]}>{t('admin.creatorSocialLinks')}</Text>
                <View style={styles.creatorLinks}>
                  {Object.entries(selectedCreator.social_links ?? {}).map(([key, url]) =>
                    url ? (
                      <Text key={key} style={[styles.creatorLink, { color: theme.colors.primary.blue }]} numberOfLines={1}>
                        {key}: {url}
                      </Text>
                    ) : null
                  )}
                  {!Object.values(selectedCreator.social_links ?? {}).filter(Boolean).length && (
                    <Text style={[styles.creatorDetailValue, { color: secondary }]}>-</Text>
                  )}
                </View>
              </View>
              <View style={styles.creatorDetailRow}>
                <Text style={[styles.creatorDetailLabel, { color: secondary }]}>{t('admin.creatorStatus')}</Text>
                <Text style={[styles.creatorDetailValue, { color: textColor }]}>
                  {selectedCreator.creator_status ?? 'pending'}
                </Text>
              </View>

              {showOpportunityPicker && (
                <View style={styles.opportunitySection}>
                  <Text style={[styles.creatorDetailLabel, { color: secondary }]}>
                    {t('admin.creatorApprove')} — {t('creator.structureSubtitle')}
                  </Text>
                  {STRUCTURE_OPPORTUNITIES.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.opportunityRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                      onPress={() => toggleApprovalOpportunity(opt.value)}
                    >
                      <Ionicons
                        name={approveOpportunities.includes(opt.value) ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={approveOpportunities.includes(opt.value) ? theme.colors.primary.blue : secondary}
                      />
                      <Text style={[styles.creatorDetailValue, { color: textColor }]}>{t(opt.labelKey as keyof typeof t)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {selectedCreatorGalleryUrls.length > 0 && (
                <View style={styles.creatorGallerySection}>
                  <Text style={[styles.creatorDetailLabel, { color: secondary }]}>
                    {t('admin.creatorGallery')}
                  </Text>
                  {selectedCreatorGalleryUrls.map((uri, index) => (
                    <RNImage
                      key={`${uri}-${index}`}
                      source={{ uri }}
                      style={styles.creatorGalleryImage}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}

              <View style={styles.creatorActions}>
                {selectedCreator.creator_status === 'pending' && (
                  <>
                    <Button
                      size="lg"
                      onPress={handleApproveCreator}
                      disabled={updatingId === selectedCreator.id}
                      style={styles.approveBtn}
                    >
                      {updatingId === selectedCreator.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : showOpportunityPicker ? (
                        t('admin.approve')
                      ) : (
                        t('admin.creatorApprove')
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onPress={handleRejectCreator}
                      disabled={updatingId === selectedCreator.id}
                      style={styles.rejectBtn}
                    >
                      {t('admin.creatorReject')}
                    </Button>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      <Modal
        visible={selectedHost !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedHost(null)}
      >
        {selectedHost && (
          <View style={[styles.viewerContainer, { backgroundColor: bg }]}>
            <View style={[styles.viewerHeader, styles.creatorModalHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
              <Text style={[styles.viewerTitle, { color: textColor, flex: 1 }]} numberOfLines={1}>
                {selectedHost.full_name || selectedHost.email}
              </Text>
              <TouchableOpacity onPress={() => setSelectedHost(null)}>
                <Ionicons name="close" size={28} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.viewerScroll} contentContainerStyle={styles.creatorDetailContent}>
              <View style={styles.creatorDetailRow}>
                <Text style={[styles.creatorDetailLabel, { color: secondary }]}>{t('admin.hostTier')}</Text>
                <Text style={[styles.creatorDetailValue, { color: textColor }]}>{selectedHost.host_tier ?? '-'}</Text>
              </View>
              <View style={styles.creatorDetailRow}>
                <Text style={[styles.creatorDetailLabel, { color: secondary }]}>{t('admin.hostJustification')}</Text>
                <Text style={[styles.creatorDetailValue, { color: textColor }]}>
                  {selectedHost.host_tier_justification ?? '-'}
                </Text>
              </View>
              <View style={styles.creatorDetailRow}>
                <Text style={[styles.creatorDetailLabel, { color: secondary }]}>{t('admin.hostPaymentModel')}</Text>
                <Text style={[styles.creatorDetailValue, { color: textColor }]}>
                  {selectedHost.payment_model ?? (selectedHost.has_own_website ? t('admin.hostOwnWebsite') : '-')}
                </Text>
              </View>
              <View style={styles.creatorDetailRow}>
                <Text style={[styles.creatorDetailLabel, { color: secondary }]}>{t('admin.creatorSocialLinks')}</Text>
                <View style={styles.creatorLinks}>
                  {Object.entries(selectedHost.social_links ?? {}).map(([key, url]) =>
                    url ? (
                      <Text key={key} style={[styles.creatorLink, { color: theme.colors.primary.blue }]} numberOfLines={2}>
                        {key}: {url}
                      </Text>
                    ) : null
                  )}
                </View>
              </View>
              <View style={styles.creatorActions}>
                <Button size="lg" onPress={handleApproveHost} disabled={updatingId === selectedHost.id} style={styles.approveBtn}>
                  {updatingId === selectedHost.id ? <ActivityIndicator size="small" color="#fff" /> : t('admin.hostApprove')}
                </Button>
                <Button variant="outline" size="lg" onPress={handleRejectHost} disabled={updatingId === selectedHost.id} style={styles.rejectBtn}>
                  {t('admin.hostReject')}
                </Button>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Modal: galleria immagini in attesa per una struttura */}
      <Modal
        visible={mediaViewerPropertyId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMediaViewerPropertyId(null)}
      >
        <View style={[styles.viewerContainer, { backgroundColor: bg }]}>
          <View style={[styles.viewerHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
            <Text style={[styles.viewerTitle, { color: textColor }]} numberOfLines={1}>
              {viewerTitle}
            </Text>
            {viewerHostName ? (
              <Text style={[styles.viewerSubtitle, { color: secondary }]} numberOfLines={1}>
                {viewerHostName}
              </Text>
            ) : null}
            <Text style={[styles.viewerSubtitle, { color: secondary }]}>
              {t('admin.mediaPendingSwipe', { count: mediaForViewer.length })}
              {mediaForViewer.length > 1
                ? ` · ${viewerMediaIndex + 1}/${mediaForViewer.length}`
                : ''}
            </Text>
            <TouchableOpacity
              style={styles.viewerCloseBtn}
              onPress={() => setMediaViewerPropertyId(null)}
            >
              <Ionicons name="close" size={28} color={textColor} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={mediaForViewer}
            keyExtractor={(m) => m.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.viewerCarousel}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setViewerMediaIndex(index);
            }}
            renderItem={({ item: m }) => (
              <View style={styles.viewerSlide}>
                {m.type === 'image' ? (
                  <Image source={{ uri: m.url }} style={styles.viewerImage} contentFit="contain" />
                ) : (
                  <View style={[styles.viewerImage, styles.viewerVideoPlaceholder]}>
                    <Ionicons name="videocam" size={64} color={secondary} />
                    <Text style={[styles.viewerVideoText, { color: secondary }]}>Video</Text>
                  </View>
                )}
                <Text style={[styles.viewerItemTime, { color: secondary }]}>
                  {formatRelativeTime(m.uploaded_at)}
                </Text>
              </View>
            )}
          />
          {mediaViewerPropertyId && (
            <View style={[styles.viewerFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
              <View style={styles.viewerActions}>
                <Button
                  size="lg"
                  onPress={() => handleApprovePropertyMediaGroup(mediaViewerPropertyId)}
                  disabled={updatingId === mediaViewerPropertyId}
                  style={styles.approveBtn}
                >
                  {updatingId === mediaViewerPropertyId ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    t('admin.approveAllMedia')
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onPress={() => handleRejectPropertyMediaGroup(mediaViewerPropertyId)}
                  disabled={updatingId === mediaViewerPropertyId}
                  style={styles.rejectBtn}
                >
                  {t('admin.rejectAllMedia')}
                </Button>
              </View>
            </View>
          )}
        </View>
      </Modal>
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
  headerRight: { width: 24 },
  tabsScroll: {
    borderBottomWidth: 1,
    maxHeight: 52,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.screenPadding,
    alignItems: 'center',
  },
  tab: {
    paddingVertical: theme.spacing.md,
    marginRight: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  tabActive: {},
  tabText: { ...theme.typography.headline, fontWeight: '600' },
  badge: {
    backgroundColor: theme.colors.primary.blue,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  list: { padding: theme.spacing.screenPadding, paddingBottom: 40 },
  empty: { paddingVertical: theme.spacing['3xl'], alignItems: 'center' },
  emptyText: { ...theme.typography.body },
  card: { padding: theme.spacing.cardPadding, marginBottom: theme.spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  meta: { marginLeft: theme.spacing.md },
  authorName: { ...theme.typography.headline, fontWeight: '600' },
  time: { ...theme.typography.caption1, marginTop: 2 },
  content: { ...theme.typography.body, marginBottom: theme.spacing.md },
  media: { width: '100%', height: 200, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.xs,},
  mediaVideoPlaceholder: { backgroundColor: 'rgba(128,128,128,0.2)', justifyContent: 'center', alignItems: 'center' },
  mediaCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  mediaCardMeta: { flex: 1 },
  mediaCardThumb: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  mediaCardThumbVideo: { justifyContent: 'center', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: theme.spacing.md },
  approveBtn: { flex: 1 },
  rejectBtn: { flex: 1 },
  viewerContainer: { flex: 1 },
  viewerHeader: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
  },
  creatorModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewerTitle: { ...theme.typography.title2, fontWeight: '700' },
  viewerSubtitle: { ...theme.typography.caption1, marginTop: 4 },
  viewerCloseBtn: { position: 'absolute', top: theme.spacing.md, right: theme.spacing.screenPadding },
  viewerScroll: { flex: 1 },
  viewerScrollContent: { padding: theme.spacing.screenPadding, paddingBottom: 40 },
  creatorDetailContent: { padding: theme.spacing.screenPadding, paddingBottom: 40 },
  creatorDetailRow: { marginBottom: theme.spacing.lg },
  creatorDetailLabel: { ...theme.typography.caption1, marginBottom: 4 },
  creatorDetailValue: { ...theme.typography.body },
  creatorLinks: { gap: 4 },
  creatorLink: { ...theme.typography.footnote },
  opportunitySection: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.lg },
  opportunityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  creatorGallerySection: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.md },
  creatorGalleryImage: {
    width: '100%',
    height: SCREEN_WIDTH * 0.75,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  creatorActions: { gap: theme.spacing.md, marginTop: theme.spacing.xl },
  viewerCarousel: { flex: 1 },
  viewerSlide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.md,
    justifyContent: 'center',
  },
  viewerFooter: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
  },
  viewerImage: {
    width: '100%',
    height: SCREEN_WIDTH * 0.85,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  viewerVideoPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  viewerVideoText: { marginTop: 8 },
  viewerItemTime: { ...theme.typography.caption1, marginTop: theme.spacing.sm },
  viewerActions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md },
});
