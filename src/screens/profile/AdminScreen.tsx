/**
 * Admin Screen
 * Solo per lucacorrao1996@gmail.com: approva/rifiuta post e commenti in attesa
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';

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
import { PropertiesService, type PropertyMediaRow } from '../../services/properties.service';
import { SupportService, type SupportTicket } from '../../services/support.service';
import { formatRelativeTime } from '../../utils/formatters';
import { STRUCTURE_OPPORTUNITIES } from '../../constants/creator';
import type { Post, PostComment } from '../../types';
import type { UserProfile } from '../../types';
import type { ProfileScreenProps } from '../../types/navigation';

type Tab = 'posts' | 'comments' | 'bio' | 'support' | 'media' | 'creators';

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
  const [propertyTitles, setPropertyTitles] = useState<Record<string, string>>({});
  const [creatorApplications, setCreatorApplications] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [mediaViewerPropertyId, setMediaViewerPropertyId] = useState<string | null>(null);
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
      const titles = await PropertiesService.getPropertyTitles(ids);
      setPropertyTitles(titles);
    } catch (e) {
      console.error(e);
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

  const load = async () => {
    setLoading(true);
    await Promise.all([loadPosts(), loadComments(), loadBio(), loadSupport(), loadPropertyMedia(), loadCreators()]);
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

  const handleApprovePropertyMedia = async (mediaId: string) => {
    if (!user?.id) return;
    setUpdatingId(mediaId);
    try {
      await PropertiesService.approvePropertyMedia(mediaId, user.id);
      setPropertyMedia((prev) => {
        const next = prev.filter((m) => m.id !== mediaId);
        const openId = mediaViewerPropertyId;
        if (openId && !next.some((m) => m.property_id === openId)) setMediaViewerPropertyId(null);
        return next;
      });
    } catch (e) {
      Alert.alert(t('common.error'), t('admin.errorApproveMedia'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectPropertyMedia = async (mediaId: string) => {
    if (!user?.id) return;
    setUpdatingId(mediaId);
    try {
      await PropertiesService.rejectPropertyMedia(mediaId, user.id);
      setPropertyMedia((prev) => {
        const next = prev.filter((m) => m.id !== mediaId);
        const openId = mediaViewerPropertyId;
        if (openId && !next.some((m) => m.property_id === openId)) setMediaViewerPropertyId(null);
        return next;
      });
    } catch (e) {
      Alert.alert(t('common.error'), t('admin.errorRejectMedia'));
    } finally {
      setUpdatingId(null);
    }
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

  const mediaForViewer = mediaViewerPropertyId
    ? propertyMedia.filter((m) => m.property_id === mediaViewerPropertyId)
    : [];
  const viewerTitle = mediaViewerPropertyId ? (propertyTitles[mediaViewerPropertyId] ?? mediaViewerPropertyId.slice(0, 8)) : '';

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

      {/* Tab Post | Commenti */}
      <View style={[styles.tabs, { borderBottomColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}>
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
          {propertyMedia.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{propertyMedia.length}</Text>
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
      </View>

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
          data={propertyMedia}
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
                {t('admin.emptyMedia')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={[styles.authorName, { color: textColor }]}>
                {propertyTitles[item.property_id] ?? item.property_id.slice(0, 8)} · {item.type === 'image' ? 'Foto' : 'Video'}
              </Text>
              <Text style={[styles.time, { color: secondary }]}>
                {formatRelativeTime(item.uploaded_at)}
              </Text>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setMediaViewerPropertyId(item.property_id)}
              >
                {item.type === 'image' ? (
                  <Image source={{ uri: item.url }} style={styles.media} resizeMode="cover" />
                ) : (
                  <View style={[styles.media, styles.mediaVideoPlaceholder]}>
                    <Ionicons name="videocam" size={48} color={secondary} />
                    <Text style={[styles.time, { color: secondary }]}>Video</Text>
                  </View>
                )}
                <Text style={[styles.viewAllHint, { color: theme.colors.primary.blue }]}>
                  Tocca per aprire e visionare tutte le immagini della struttura
                </Text>
              </TouchableOpacity>
              <View style={styles.actions}>
                <Button
                  size="sm"
                  onPress={() => handleApprovePropertyMedia(item.id)}
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
                  onPress={() => handleRejectPropertyMedia(item.id)}
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
            <Text style={[styles.viewerSubtitle, { color: secondary }]}>
              {mediaForViewer.length} in attesa · scorri per visionare tutte
            </Text>
            <TouchableOpacity
              style={styles.viewerCloseBtn}
              onPress={() => setMediaViewerPropertyId(null)}
            >
              <Ionicons name="close" size={28} color={textColor} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.viewerScroll}
            contentContainerStyle={styles.viewerScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {mediaForViewer.map((m) => (
              <View key={m.id} style={styles.viewerItem}>
                {m.type === 'image' ? (
                  <Image source={{ uri: m.url }} style={styles.viewerImage} resizeMode="contain" />
                ) : (
                  <View style={[styles.viewerImage, styles.viewerVideoPlaceholder]}>
                    <Ionicons name="videocam" size={64} color={secondary} />
                    <Text style={[styles.viewerVideoText, { color: secondary }]}>Video</Text>
                  </View>
                )}
                <Text style={[styles.viewerItemTime, { color: secondary }]}>
                  {formatRelativeTime(m.uploaded_at)}
                </Text>
                <View style={styles.viewerActions}>
                  <Button
                    size="sm"
                    onPress={() => handleApprovePropertyMedia(m.id)}
                    disabled={updatingId === m.id}
                    style={styles.approveBtn}
                  >
                    {updatingId === m.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      t('admin.approve')
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handleRejectPropertyMedia(m.id)}
                    disabled={updatingId === m.id}
                    style={styles.rejectBtn}
                  >
                    {t('admin.reject')}
                  </Button>
                </View>
              </View>
            ))}
          </ScrollView>
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: theme.spacing.screenPadding,
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
  media: { width: '100%', height: 200, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.xs },
  mediaVideoPlaceholder: { backgroundColor: 'rgba(128,128,128,0.2)', justifyContent: 'center', alignItems: 'center' },
  viewAllHint: { ...theme.typography.caption1, marginBottom: theme.spacing.md },
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
  creatorActions: { gap: theme.spacing.md, marginTop: theme.spacing.xl },
  viewerItem: { marginBottom: theme.spacing['2xl'] },
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
