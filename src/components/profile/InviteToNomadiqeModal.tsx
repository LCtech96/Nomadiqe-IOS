/**
 * Modal to pick which role to invite (host, creator, or Jolly).
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { createInvite, type InviteRole } from '../../services/invitations.service';
import { getOrderedInviteRoles } from '../../utils/inviteRoles';
import type { UserRole } from '../../types';

interface InviteToNomadiqeModalProps {
  visible: boolean;
  onClose: () => void;
  userRole: UserRole;
}

const ROLE_LABEL_KEYS: Record<InviteRole, string> = {
  host: 'profile.inviteRoleHost',
  creator: 'profile.inviteRoleCreator',
  jolly: 'profile.inviteRoleJolly',
};

export function InviteToNomadiqeModal({
  visible,
  onClose,
  userRole,
}: InviteToNomadiqeModalProps) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const { profile } = useAuth();
  const [loadingRole, setLoadingRole] = useState<InviteRole | null>(null);

  const orderedRoles = useMemo(() => getOrderedInviteRoles(userRole), [userRole]);

  const serifFamily = Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  });

  const boxBg = isDark ? theme.colors.dark.secondaryBackground : '#FFFFFF';
  const textColor = isDark ? theme.colors.dark.label : '#1A1A1A';
  const descriptionColor = isDark ? theme.colors.dark.secondaryLabel : '#6B7C93';

  const handleInvite = async (role: InviteRole) => {
    if (!profile?.id || loadingRole) return;
    try {
      setLoadingRole(role);
      const link = await createInvite(profile.id, role);
      await Clipboard.setStringAsync(link);
      Alert.alert(t('settings.linkCopied'), t('settings.linkCopiedMessage'));
      onClose();
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : t('settings.errorGenerateLink');
      Alert.alert(t('common.error'), message);
    } finally {
      setLoadingRole(null);
    }
  };

  const getButtonStyle = (index: number) => {
    if (index === 0) {
      return styles.roleButtonPrimary;
    }
    if (index === 1) {
      return [
        styles.roleButtonSecondary,
        { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F2' },
      ];
    }
    return [
      styles.roleButtonOutline,
      {
        backgroundColor: isDark ? 'transparent' : '#FFFFFF',
        borderColor: isDark ? theme.colors.dark.separator : '#E0E0E0',
      },
    ];
  };

  const getButtonTextStyle = (index: number) => {
    if (index === 0) return styles.roleButtonTextPrimary;
    return [styles.roleButtonTextSecondary, { color: textColor }];
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.box, { backgroundColor: boxBg }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor, fontFamily: serifFamily }]}>
                {t('profile.inviteModalTitle').toUpperCase()}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={22} color={textColor} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.description, { color: descriptionColor, fontFamily: serifFamily }]}>
              {t('profile.inviteModalDescription').toUpperCase()}
            </Text>

            <View style={styles.buttons}>
              {orderedRoles.map((role, index) => (
                <TouchableOpacity
                  key={role}
                  style={getButtonStyle(index)}
                  onPress={() => handleInvite(role)}
                  disabled={loadingRole !== null}
                  activeOpacity={0.85}
                >
                  {loadingRole === role ? (
                    <ActivityIndicator
                      size="small"
                      color={index === 0 ? '#FFFFFF' : theme.colors.primary.blue}
                    />
                  ) : (
                    <Text style={[getButtonTextStyle(index), { fontFamily: serifFamily }]}>
                      {t(ROLE_LABEL_KEYS[role])}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  box: {
    width: '100%',
    maxWidth: 360,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    paddingRight: theme.spacing.sm,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.2,
    marginBottom: theme.spacing.lg,
  },
  buttons: {
    gap: theme.spacing.sm,
  },
  roleButtonPrimary: {
    backgroundColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  roleButtonSecondary: {
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  roleButtonOutline: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  roleButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  roleButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
});
