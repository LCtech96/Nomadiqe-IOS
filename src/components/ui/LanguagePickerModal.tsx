/**
 * Language Picker Modal
 * Menu a tendina: mostra max 3.5 elementi visibili, ricerca per filtrare, selezione lingua
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';
import { LANGUAGE_OPTIONS, type Language } from '../../constants/translations';

const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 4;
const LIST_MAX_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface LanguagePickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguagePickerModal({ visible, onClose }: LanguagePickerModalProps) {
  const { isDark } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return LANGUAGE_OPTIONS;
    return LANGUAGE_OPTIONS.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.code.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (code: Language) => {
    setLocale(code);
    setSearch('');
    onClose();
  };

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const inputBg = isDark ? theme.colors.dark.tertiaryBackground : theme.colors.light.secondaryBackground;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centered}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.box, { backgroundColor: bg }]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: textColor }]}>{t('common.language')}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={12}>
                  <Ionicons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                placeholder={t('common.search') + '...'}
                placeholderTextColor={secondary}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.code}
                style={[styles.list, { maxHeight: LIST_MAX_HEIGHT }]}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.item,
                      locale === item.code && styles.itemSelected,
                      { backgroundColor: locale === item.code ? (isDark ? `${theme.colors.primary.blue}30` : `${theme.colors.primary.blue}15`) : 'transparent' },
                    ]}
                    onPress={() => handleSelect(item.code)}
                  >
                    <View style={styles.itemLeft}>
                      <Text style={styles.flag}>{item.flag}</Text>
                      <Text style={[styles.itemLabel, { color: textColor }]}>{item.label}</Text>
                    </View>
                    {locale === item.code && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary.blue} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  centered: {
    width: '100%',
    maxWidth: 340,
  },
  box: {
    borderRadius: 16,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.headline,
    fontWeight: '700',
  },
  input: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    fontSize: 16,
  },
  list: {
    marginTop: theme.spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ITEM_HEIGHT,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 10,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  flag: {
    fontSize: 28,
    lineHeight: 32,
  },
  itemSelected: {},
});
