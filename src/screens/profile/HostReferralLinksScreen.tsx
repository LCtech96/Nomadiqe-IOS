/**
 * Host: referral (commission) and personal share links
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { PropertiesService } from '../../services/properties.service';
import { CollaborationService } from '../../services/collaboration.service';
import {
  HostShareLinksService,
  shareUrlForSlug,
  type HostShareLink,
} from '../../services/hostShareLinks.service';
import type { Property } from '../../types/property';
import type { UserProfile } from '../../types/user';
import type { ProfileScreenProps } from '../../types/navigation';

type PropertyScope = 'all' | 'one';
type CreatorSource = 'collaboration' | 'external';

function displayCreatorName(link: HostShareLink): string {
  if (link.internal_label?.trim()) return link.internal_label.trim();
  if (link.creator_name?.trim()) return link.creator_name.trim();
  return '—';
}

export default function HostReferralLinksScreen({
  navigation,
}: ProfileScreenProps<'HostReferralLinks'>) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useI18n();

  const [properties, setProperties] = useState<Property[]>([]);
  const [collaborators, setCollaborators] = useState<UserProfile[]>([]);
  const [links, setLinks] = useState<HostShareLink[]>([]);
  const [loading, setLoading] = useState(true);

  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [personalModalVisible, setPersonalModalVisible] = useState(false);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? theme.colors.dark.card : theme.colors.light.card;
  const borderSoft = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#fff';

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [props, collabRows, linkRows] = await Promise.all([
        PropertiesService.getPropertiesByHost(user.id),
        CollaborationService.getRequestsByHost(user.id),
        HostShareLinksService.listByHost(user.id),
      ]);
      setProperties(props);
      const accepted = collabRows.filter((r) => r.status === 'accepted' && r.creator);
      const byId = new Map<string, UserProfile>();
      accepted.forEach((r) => {
        if (r.creator) byId.set(r.creator.id, r.creator);
      });
      setCollaborators([...byId.values()]);
      setLinks(linkRows);
    } catch {
      setProperties([]);
      setCollaborators([]);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const commissionLinks = useMemo(
    () => links.filter((l) => l.link_type === 'commission' && !l.is_hidden),
    [links]
  );
  const personalLinks = useMemo(
    () => links.filter((l) => l.link_type === 'personal' && !l.is_hidden),
    [links]
  );

  const propertyTitle = (propertyId: string | null) => {
    if (!propertyId) return t('hostReferralLinks.allMyProperties');
    const p = properties.find((x) => x.id === propertyId);
    return p?.title || p?.city || '—';
  };

  const handleCopy = async (slug: string) => {
    const url = shareUrlForSlug(slug);
    await Clipboard.setStringAsync(url);
    Alert.alert(t('hostReferralLinks.title'), t('affiliate.linkCopied'));
  };

  const handleOpen = (slug: string) => {
    Linking.openURL(shareUrlForSlug(slug)).catch(() => {});
  };

  const handleHide = async (link: HostShareLink) => {
    if (!user?.id) return;
    try {
      await HostShareLinksService.setHidden(user.id, link.id, true);
      await loadData();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  };

  const handleDelete = (link: HostShareLink) => {
    if (!user?.id) return;
    Alert.alert(t('common.delete'), t('hostReferralLinks.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await HostShareLinksService.deleteLink(user.id, link.id);
            await loadData();
          } catch (e) {
            Alert.alert(t('common.error'), (e as Error).message);
          }
        },
      },
    ]);
  };

  const renderLinkCard = (link: HostShareLink) => {
    const url = shareUrlForSlug(link.slug);
    const isCommission = link.link_type === 'commission';
    return (
      <View key={link.id} style={[styles.linkCard, { borderColor: borderSoft, backgroundColor: inputBg }]}>
        <View style={styles.linkCardTop}>
          <View style={styles.linkCardMeta}>
            {isCommission && link.commission_percent != null ? (
              <Text style={styles.commissionBadge}>{Number(link.commission_percent).toFixed(1)}%</Text>
            ) : null}
            <Text style={[styles.linkCardTitle, { color: textColor }]} numberOfLines={1}>
              {(link.link_type === 'personal'
                ? link.internal_label?.trim() || t('hostReferralLinks.personalLinkLabel')
                : displayCreatorName(link)
              ).toUpperCase()}
            </Text>
            <Text style={[styles.linkCardScope, { color: secondary }]} numberOfLines={1}>
              {propertyTitle(link.property_id).toUpperCase()}
            </Text>
          </View>
          <View style={styles.linkCardActions}>
            <TouchableOpacity onPress={() => handleCopy(link.slug)} hitSlop={8}>
              <Ionicons name="copy-outline" size={20} color={secondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOpen(link.slug)} hitSlop={8}>
              <Ionicons name="open-outline" size={20} color={secondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleHide(link)} hitSlop={8}>
              <Ionicons name="eye-off-outline" size={20} color={secondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(link)} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color={secondary} />
            </TouchableOpacity>
          </View>
        </View>
        {link.creator_name ? (
          <Text style={[styles.linkCreatorSub, { color: secondary }]}>{link.creator_name}</Text>
        ) : null}
        <Text style={[styles.linkUrl, { color: textColor, backgroundColor: cardBg }]} selectable>
          {url.toUpperCase()}
        </Text>
        <Text style={[styles.linkStats, { color: secondary }]}>
          {t('hostReferralLinks.clicks')}: {link.click_count} · {t('hostReferralLinks.bookings')}:{' '}
          {link.booking_count}
        </Text>
      </View>
    );
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          {t('hostReferralLinks.title')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.description, { color: secondary }]}>{t('hostReferralLinks.description')}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.colors.primary.blue }]}
            activeOpacity={0.85}
            onPress={() => setReferralModalVisible(true)}
          >
            <Ionicons name="person-add-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>{t('hostReferralLinks.generateReferral')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: borderSoft, backgroundColor: inputBg }]}
            activeOpacity={0.85}
            onPress={() => setPersonalModalVisible(true)}
          >
            <Ionicons name="link-outline" size={18} color={textColor} />
            <Text style={[styles.secondaryBtnText, { color: textColor }]}>
              {t('hostReferralLinks.generatePersonal')}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>
          {t('hostReferralLinks.referralListTitle')} ({commissionLinks.length})
        </Text>
        {commissionLinks.length === 0 ? (
          <Text style={[styles.empty, { color: secondary }]}>{t('hostReferralLinks.noReferralLinks')}</Text>
        ) : (
          commissionLinks.map(renderLinkCard)
        )}

        <Text style={[styles.sectionTitle, { color: textColor, marginTop: theme.spacing.lg }]}>
          {t('hostReferralLinks.personalListTitle')} ({personalLinks.length})
        </Text>
        {personalLinks.length === 0 ? (
          <Text style={[styles.empty, { color: secondary }]}>{t('hostReferralLinks.noPersonalLinks')}</Text>
        ) : (
          personalLinks.map(renderLinkCard)
        )}
      </ScrollView>

      <GenerateReferralLinkModal
        visible={referralModalVisible}
        onClose={() => setReferralModalVisible(false)}
        properties={properties}
        collaborators={collaborators}
        hostId={user?.id ?? ''}
        cardBg={cardBg}
        inputBg={inputBg}
        textColor={textColor}
        secondary={secondary}
        borderSoft={borderSoft}
        onCreated={async () => {
          setReferralModalVisible(false);
          await loadData();
        }}
      />

      <GeneratePersonalLinkModal
        visible={personalModalVisible}
        onClose={() => setPersonalModalVisible(false)}
        properties={properties}
        hostId={user?.id ?? ''}
        cardBg={cardBg}
        inputBg={inputBg}
        textColor={textColor}
        secondary={secondary}
        borderSoft={borderSoft}
        onCreated={async () => {
          setPersonalModalVisible(false);
          await loadData();
        }}
      />
    </SafeAreaView>
  );
}

// ── Modals ──────────────────────────────────────────────────────────────────

interface ModalThemeProps {
  visible: boolean;
  onClose: () => void;
  properties: Property[];
  hostId: string;
  cardBg: string;
  inputBg: string;
  textColor: string;
  secondary: string;
  borderSoft: string;
  onCreated: () => void | Promise<void>;
}

function GenerateReferralLinkModal({
  visible,
  onClose,
  properties,
  collaborators,
  hostId,
  cardBg,
  inputBg,
  textColor,
  secondary,
  borderSoft,
  onCreated,
}: ModalThemeProps & { collaborators: UserProfile[] }) {
  const { t } = useI18n();
  const [propertyScope, setPropertyScope] = useState<PropertyScope>('all');
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [creatorSource, setCreatorSource] = useState<CreatorSource>('collaboration');
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState('');
  const [creatorEmail, setCreatorEmail] = useState('');
  const [commission, setCommission] = useState('10');
  const [internalLabel, setInternalLabel] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPropertyScope('all');
    setPropertyId(properties[0]?.id ?? null);
    setCreatorSource('collaboration');
    setCreatorId(collaborators[0]?.id ?? null);
    setCreatorName('');
    setCreatorEmail('');
    setCommission('10');
    setInternalLabel('');
    setGuestMessage('');
  }, [visible, properties, collaborators]);

  const handleCreate = async () => {
    if (!hostId) return;
    const pct = parseFloat(commission.replace(',', '.'));
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      Alert.alert(t('common.error'), t('hostReferralLinks.invalidCommission'));
      return;
    }
    if (propertyScope === 'one' && !propertyId) {
      Alert.alert(t('common.error'), t('hostReferralLinks.selectProperty'));
      return;
    }
    if (creatorSource === 'collaboration' && !creatorId) {
      Alert.alert(t('common.error'), t('hostReferralLinks.selectCreator'));
      return;
    }
    if (creatorSource === 'external' && (!creatorName.trim() || !creatorEmail.trim())) {
      Alert.alert(t('common.error'), t('hostReferralLinks.externalCreatorRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const collabCreator =
        creatorSource === 'collaboration' ? collaborators.find((c) => c.id === creatorId) : null;
      const link = await HostShareLinksService.createCommissionLink({
        hostId,
        propertyId: propertyScope === 'all' ? null : propertyId,
        creatorId: creatorSource === 'collaboration' ? creatorId : null,
        creatorName:
          creatorSource === 'external'
            ? creatorName
            : collabCreator?.full_name || collabCreator?.username || null,
        creatorEmail: creatorSource === 'external' ? creatorEmail : collabCreator?.email ?? null,
        commissionPercent: pct,
        internalLabel: internalLabel || null,
        guestMessage: guestMessage || null,
      });
      await Clipboard.setStringAsync(shareUrlForSlug(link.slug));
      Alert.alert(t('hostReferralLinks.generateReferral'), t('affiliate.linkCopied'));
      await onCreated();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('host_share_links') || msg.includes('schema cache')) {
        Alert.alert(t('common.error'), t('hostReferralLinks.sqlHint'));
      } else {
        Alert.alert(t('common.error'), msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinkFormModal
      visible={visible}
      onClose={onClose}
      title={t('hostReferralLinks.generateReferral')}
      subtitle={t('hostReferralLinks.referralModalHint')}
      icon="person-add-outline"
      cardBg={cardBg}
      textColor={textColor}
      secondary={secondary}
      borderSoft={borderSoft}
      submitting={submitting}
      onSubmit={handleCreate}
    >
      <SectionLabel text={t('hostReferralLinks.forWhichProperty')} color={textColor} />
      <RadioRow
        label={t('hostReferralLinks.allMyProperties')}
        selected={propertyScope === 'all'}
        onPress={() => setPropertyScope('all')}
        textColor={textColor}
        secondary={secondary}
      />
      <RadioRow
        label={t('hostReferralLinks.oneProperty')}
        selected={propertyScope === 'one'}
        onPress={() => setPropertyScope('one')}
        textColor={textColor}
        secondary={secondary}
      />
      {propertyScope === 'one' ? (
        <PropertyPicker
          properties={properties}
          propertyId={propertyId}
          onSelect={setPropertyId}
          textColor={textColor}
          secondary={secondary}
          inputBg={inputBg}
          borderSoft={borderSoft}
          emptyLabel={t('hostReferralLinks.noProperties')}
        />
      ) : null}

      <SectionLabel text={t('hostReferralLinks.whoIsCreator')} color={textColor} />
      <RadioRow
        label={t('hostReferralLinks.fromCollaborations')}
        selected={creatorSource === 'collaboration'}
        onPress={() => setCreatorSource('collaboration')}
        textColor={textColor}
        secondary={secondary}
      />
      <RadioRow
        label={t('hostReferralLinks.externalCreator')}
        selected={creatorSource === 'external'}
        onPress={() => setCreatorSource('external')}
        textColor={textColor}
        secondary={secondary}
      />
      {creatorSource === 'collaboration' ? (
        collaborators.length === 0 ? (
          <Text style={[styles.modalHint, { color: secondary }]}>{t('hostReferralLinks.noCollaborations')}</Text>
        ) : (
          <PropertyPicker
            properties={[]}
            propertyId={creatorId}
            onSelect={setCreatorId}
            textColor={textColor}
            secondary={secondary}
            inputBg={inputBg}
            borderSoft={borderSoft}
            options={collaborators.map((c) => ({
              id: c.id,
              title: c.full_name || c.username || c.id,
            }))}
          />
        )
      ) : (
        <>
          <TextInput
            style={[styles.input, { color: textColor, borderColor: borderSoft, backgroundColor: inputBg }]}
            placeholder={t('hostReferralLinks.creatorNamePlaceholder')}
            placeholderTextColor={secondary}
            value={creatorName}
            onChangeText={setCreatorName}
          />
          <TextInput
            style={[styles.input, { color: textColor, borderColor: borderSoft, backgroundColor: inputBg }]}
            placeholder={t('hostReferralLinks.creatorEmailPlaceholder')}
            placeholderTextColor={secondary}
            value={creatorEmail}
            onChangeText={setCreatorEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </>
      )}

      <SectionLabel text={t('hostReferralLinks.commissionLabel')} color={textColor} />
      <View style={styles.commissionRow}>
        <TextInput
          style={[styles.commissionInput, { color: textColor, borderColor: borderSoft, backgroundColor: inputBg }]}
          value={commission}
          onChangeText={setCommission}
          keyboardType="decimal-pad"
        />
        <Text style={[styles.commissionSuffix, { color: secondary }]}>
          {t('hostReferralLinks.commissionSuffix')}
        </Text>
      </View>

      <SectionLabel text={t('hostReferralLinks.internalLabel')} color={textColor} />
      <TextInput
        style={[styles.input, { color: textColor, borderColor: borderSoft, backgroundColor: inputBg }]}
        placeholder={t('hostReferralLinks.internalLabelPlaceholder')}
        placeholderTextColor={secondary}
        value={internalLabel}
        onChangeText={setInternalLabel}
      />

      <SectionLabel text={t('hostReferralLinks.guestMessage')} color={textColor} />
      <TextInput
        style={[styles.textArea, { color: textColor, borderColor: borderSoft, backgroundColor: inputBg }]}
        placeholder={t('hostReferralLinks.guestMessagePlaceholder')}
        placeholderTextColor={secondary}
        value={guestMessage}
        onChangeText={(v) => setGuestMessage(v.slice(0, 280))}
        multiline
        maxLength={280}
      />
      <Text style={[styles.charCount, { color: secondary }]}>{guestMessage.length}/280</Text>
    </LinkFormModal>
  );
}

function GeneratePersonalLinkModal({
  visible,
  onClose,
  properties,
  hostId,
  cardBg,
  inputBg,
  textColor,
  secondary,
  borderSoft,
  onCreated,
}: ModalThemeProps) {
  const { t } = useI18n();
  const [propertyScope, setPropertyScope] = useState<PropertyScope>('all');
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [internalLabel, setInternalLabel] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPropertyScope('all');
    setPropertyId(properties[0]?.id ?? null);
    setInternalLabel('');
    setGuestMessage('');
  }, [visible, properties]);

  const handleCreate = async () => {
    if (!hostId) return;
    if (propertyScope === 'one' && !propertyId) {
      Alert.alert(t('common.error'), t('hostReferralLinks.selectProperty'));
      return;
    }
    setSubmitting(true);
    try {
      const link = await HostShareLinksService.createPersonalLink({
        hostId,
        propertyId: propertyScope === 'all' ? null : propertyId,
        internalLabel: internalLabel || null,
        guestMessage: guestMessage || null,
      });
      await Clipboard.setStringAsync(shareUrlForSlug(link.slug));
      Alert.alert(t('hostReferralLinks.generatePersonal'), t('affiliate.linkCopied'));
      await onCreated();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('host_share_links') || msg.includes('schema cache')) {
        Alert.alert(t('common.error'), t('hostReferralLinks.sqlHint'));
      } else {
        Alert.alert(t('common.error'), msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinkFormModal
      visible={visible}
      onClose={onClose}
      title={t('hostReferralLinks.generatePersonal')}
      subtitle={t('hostReferralLinks.personalModalHint')}
      icon="link-outline"
      cardBg={cardBg}
      textColor={textColor}
      secondary={secondary}
      borderSoft={borderSoft}
      submitting={submitting}
      onSubmit={handleCreate}
    >
      <SectionLabel text={t('hostReferralLinks.forWhichProperty')} color={textColor} />
      <RadioRow
        label={t('hostReferralLinks.allMyProperties')}
        selected={propertyScope === 'all'}
        onPress={() => setPropertyScope('all')}
        textColor={textColor}
        secondary={secondary}
      />
      <RadioRow
        label={t('hostReferralLinks.oneProperty')}
        selected={propertyScope === 'one'}
        onPress={() => setPropertyScope('one')}
        textColor={textColor}
        secondary={secondary}
      />
      {propertyScope === 'one' ? (
        <PropertyPicker
          properties={properties}
          propertyId={propertyId}
          onSelect={setPropertyId}
          textColor={textColor}
          secondary={secondary}
          inputBg={inputBg}
          borderSoft={borderSoft}
          emptyLabel={t('hostReferralLinks.noProperties')}
        />
      ) : null}

      <SectionLabel text={t('hostReferralLinks.internalLabel')} color={textColor} />
      <TextInput
        style={[styles.input, { color: textColor, borderColor: borderSoft, backgroundColor: inputBg }]}
        placeholder={t('hostReferralLinks.internalLabelPlaceholder')}
        placeholderTextColor={secondary}
        value={internalLabel}
        onChangeText={setInternalLabel}
      />

      <SectionLabel text={t('hostReferralLinks.guestMessage')} color={textColor} />
      <TextInput
        style={[styles.textArea, { color: textColor, borderColor: borderSoft, backgroundColor: inputBg }]}
        placeholder={t('hostReferralLinks.guestMessagePlaceholder')}
        placeholderTextColor={secondary}
        value={guestMessage}
        onChangeText={(v) => setGuestMessage(v.slice(0, 280))}
        multiline
        maxLength={280}
      />
      <Text style={[styles.charCount, { color: secondary }]}>{guestMessage.length}/280</Text>
    </LinkFormModal>
  );
}

function LinkFormModal({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  children,
  cardBg,
  textColor,
  secondary,
  borderSoft,
  submitting,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  cardBg: string;
  textColor: string;
  secondary: string;
  borderSoft: string;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const { t } = useI18n();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalSheet, { backgroundColor: cardBg }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Ionicons name={icon} size={20} color={theme.colors.primary.blue} />
              <Text style={[styles.modalTitle, { color: textColor }]}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={secondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.modalSubtitle, { color: secondary }]}>{subtitle}</Text>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          <View style={[styles.modalFooter, { borderTopColor: borderSoft }]}>
            <TouchableOpacity style={[styles.modalCancel, { borderColor: borderSoft }]} onPress={onClose}>
              <Text style={{ color: textColor }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSubmit, { backgroundColor: theme.colors.primary.blue }]}
              onPress={onSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="link" size={16} color="#fff" />
                  <Text style={styles.modalSubmitText}>{t('hostReferralLinks.createLink')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SectionLabel({ text, color }: { text: string; color: string }) {
  return <Text style={[styles.sectionLabel, { color }]}>{text}</Text>;
}

function RadioRow({
  label,
  selected,
  onPress,
  textColor,
  secondary,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  textColor: string;
  secondary: string;
}) {
  return (
    <TouchableOpacity style={styles.radioRow} onPress={onPress} activeOpacity={0.7}>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? theme.colors.primary.blue : secondary}
      />
      <Text style={[styles.radioLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function PropertyPicker({
  properties,
  propertyId,
  onSelect,
  textColor,
  secondary,
  inputBg,
  borderSoft,
  emptyLabel,
  options,
}: {
  properties: Property[];
  propertyId: string | null;
  onSelect: (id: string) => void;
  textColor: string;
  secondary: string;
  inputBg: string;
  borderSoft: string;
  emptyLabel?: string;
  options?: { id: string; title: string }[];
}) {
  const items =
    options ??
    properties.map((p) => ({
      id: p.id,
      title: p.title || p.city || '—',
    }));

  if (items.length === 0) {
    return <Text style={[styles.modalHint, { color: secondary }]}>{emptyLabel ?? '—'}</Text>;
  }

  return (
    <View style={[styles.pickerBox, { borderColor: borderSoft, backgroundColor: inputBg }]}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.pickerItem}
          onPress={() => onSelect(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={propertyId === item.id ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={propertyId === item.id ? theme.colors.primary.blue : secondary}
          />
          <Text style={[styles.pickerItemText, { color: textColor }]} numberOfLines={2}>
            {item.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
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
  headerTitle: { flex: 1, textAlign: 'center', ...theme.typography.headline, fontWeight: '700' },
  content: {
    padding: theme.spacing.screenPadding,
    paddingBottom: theme.spacing['3xl'],
  },
  description: { ...theme.typography.subheadline, marginBottom: theme.spacing.lg },
  actionRow: { gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
  },
  primaryBtnText: { color: '#fff', ...theme.typography.subheadline, fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  secondaryBtnText: { ...theme.typography.subheadline, fontWeight: '600' },
  sectionTitle: { ...theme.typography.subheadline, fontWeight: '800', marginBottom: theme.spacing.sm },
  empty: { ...theme.typography.caption1, marginBottom: theme.spacing.md },
  linkCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  linkCardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  linkCardMeta: { flex: 1, gap: 2 },
  commissionBadge: {
    ...theme.typography.caption1,
    color: theme.colors.success,
    fontWeight: '800',
  },
  linkCardTitle: { ...theme.typography.subheadline, fontWeight: '800' },
  linkCardScope: { ...theme.typography.caption2, fontWeight: '600' },
  linkCardActions: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  linkCreatorSub: { ...theme.typography.caption1, marginTop: 4 },
  linkUrl: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  linkStats: { ...theme.typography.caption2, marginTop: 8, textTransform: 'uppercase' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenPadding,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  modalTitle: { ...theme.typography.headline, fontWeight: '800', flex: 1 },
  modalSubtitle: {
    ...theme.typography.caption1,
    paddingHorizontal: theme.spacing.screenPadding,
    marginTop: 6,
    marginBottom: 8,
  },
  modalScroll: { paddingHorizontal: theme.spacing.screenPadding, maxHeight: 420 },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: theme.spacing.screenPadding,
    borderTopWidth: 1,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalSubmit: {
    flex: 1.2,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: { color: '#fff', fontWeight: '700' },
  sectionLabel: {
    ...theme.typography.caption1,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  radioLabel: { ...theme.typography.subheadline, flex: 1 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    ...theme.typography.body,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    ...theme.typography.body,
  },
  charCount: { ...theme.typography.caption2, marginBottom: 8 },
  commissionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  commissionInput: {
    width: 72,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'center',
    ...theme.typography.body,
  },
  commissionSuffix: { flex: 1, ...theme.typography.caption1 },
  modalHint: { ...theme.typography.caption1, marginBottom: 8 },
  pickerBox: { borderWidth: 1, borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerItemText: { flex: 1, ...theme.typography.subheadline },
});
