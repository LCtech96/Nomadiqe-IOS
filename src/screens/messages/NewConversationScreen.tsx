/**
 * New Conversation Screen
 * Scegli un utente per avviare una conversazione
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { ProfilesService } from '../../services/profiles.service';
import type { UserProfile } from '../../types';
import type { ProfileScreenProps } from '../../types/navigation';

export default function NewConversationScreen({
  navigation,
}: ProfileScreenProps<'NewConversation'>) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await ProfilesService.getProfilesByRoles(['host', 'creator', 'jolly', 'manager']);
        const filtered = list.filter((p) => p.id !== user?.id);
        setProfiles(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const openChat = (p: UserProfile) => {
    navigation.replace('Conversation', {
      recipientId: p.id,
      recipientName: p.full_name || p.username || 'Utente',
    });
  };

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
        <Text style={[styles.headerTitle, { color: textColor }]}>Nuova conversazione</Text>
        <View style={styles.headerRight} />
      </View>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: secondary }]}>Nessun utente disponibile</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            onPress={() => openChat(item)}
            activeOpacity={0.7}
          >
            <Avatar uri={item.avatar_url} size={48} />
            <View style={styles.body}>
              <Text style={[styles.name, { color: textColor }]}>{item.full_name || item.username || 'Utente'}</Text>
              {item.username && (
                <Text style={[styles.username, { color: secondary }]}>@{item.username}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={secondary} />
          </TouchableOpacity>
        )}
      />
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
  headerTitle: { ...theme.typography.headline, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerRight: { width: 24 },
  list: { paddingBottom: 40 },
  empty: { paddingVertical: theme.spacing['3xl'], alignItems: 'center' },
  emptyText: { ...theme.typography.body },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.screenPadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: { flex: 1, marginLeft: theme.spacing.sm },
  name: { ...theme.typography.headline, fontWeight: '600' },
  username: { ...theme.typography.footnote, marginTop: 2 },
});
