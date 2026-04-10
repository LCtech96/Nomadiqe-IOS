/**
 * Gestione catalogo prodotti del Jolly (prodotti per la casa)
 * Aggiungi, modifica, elimina prodotti con prezzi e quantità
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { JollyService, type JollyProduct } from '../../services/jolly.service';
import { theme } from '../../theme';
import type { ProfileScreenProps } from '../../types/navigation';

export default function JollyMyProductsScreen({
  navigation,
}: ProfileScreenProps<'JollyMyProducts'>) {
  const { profile } = useAuth();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [products, setProducts] = useState<JollyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<JollyProduct | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [quantityStr, setQuantityStr] = useState('');
  const [saving, setSaving] = useState(false);

  const jollyId = profile?.id ?? '';
  const isJollyHomeProducts = profile?.role === 'jolly' && profile?.jolly_subcategory === 'home_products';

  const load = () => {
    if (!jollyId) return;
    setLoading(true);
    JollyService.getProductsByJolly(jollyId)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [jollyId]);

  const openAdd = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPriceStr('');
    setQuantityStr('0');
    setModalVisible(true);
  };

  const openEdit = (p: JollyProduct) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description ?? '');
    setPriceStr(String(p.price));
    setQuantityStr(String(p.quantity));
    setModalVisible(true);
  };

  const handleSave = async () => {
    const price = parseFloat(priceStr.replace(',', '.'));
    const quantity = parseInt(quantityStr, 10) || 0;
    if (!name.trim()) {
      Alert.alert(t('common.error'), 'Nome obbligatorio');
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      Alert.alert(t('common.error'), 'Prezzo non valido');
      return;
    }
    setSaving(true);
    try {
      if (editingProduct) {
        await JollyService.updateProduct(editingProduct.id, jollyId, {
          name: name.trim(),
          description: description.trim() || null,
          price,
          quantity,
        });
      } else {
        await JollyService.createProduct(jollyId, {
          name: name.trim(),
          description: description.trim() || null,
          price,
          quantity,
        });
      }
      setModalVisible(false);
      load();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (p: JollyProduct) => {
    Alert.alert(
      t('common.delete') || 'Elimina',
      `Eliminare "${p.name}"?`,
      [
        { text: t('common.cancel') || 'Annulla', style: 'cancel' },
        {
          text: t('common.delete') || 'Elimina',
          style: 'destructive',
          onPress: () => JollyService.deleteProduct(p.id, jollyId).then(load).catch(() => {}),
        },
      ]
    );
  };

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? theme.colors.dark.card : theme.colors.light.card;

  if (!isJollyHomeProducts) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>{t('kolbed.jollyCatalog')}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: secondary }]}>{t('kolbed.jollyNoProducts')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('kolbed.jollyCatalog')}</Text>
        <TouchableOpacity onPress={openAdd}>
          <Ionicons name="add-circle" size={28} color={theme.colors.primary.blue} />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: secondary }]}>{t('kolbed.jollyNoProducts')}</Text>
          <Button title="Aggiungi prodotto" onPress={openAdd} style={styles.addBtn} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.productCard, { backgroundColor: cardBg }]}>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.productMeta, { color: secondary }]}>€ {Number(item.price).toFixed(2)} · {t('kolbed.quantity')}: {item.quantity}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(item)}>
                  <Ionicons name="pencil" size={22} color={theme.colors.primary.blue} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={22} color={theme.colors.primary.red || '#e74c3c'} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              {editingProduct ? 'Modifica prodotto' : 'Aggiungi prodotto'}
            </Text>
            <TextInput
              style={[styles.input, { color: textColor, borderColor: secondary }]}
              placeholder="Nome prodotto"
              placeholderTextColor={secondary}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, styles.inputArea, { color: textColor, borderColor: secondary }]}
              placeholder="Descrizione (opzionale)"
              placeholderTextColor={secondary}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TextInput
              style={[styles.input, { color: textColor, borderColor: secondary }]}
              placeholder="Prezzo (es. 9.99)"
              placeholderTextColor={secondary}
              value={priceStr}
              onChangeText={setPriceStr}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, { color: textColor, borderColor: secondary }]}
              placeholder="Quantità"
              placeholderTextColor={secondary}
              value={quantityStr}
              onChangeText={setQuantityStr}
              keyboardType="number-pad"
            />
            <View style={styles.modalButtons}>
              <Button title={t('common.cancel') || 'Annulla'} onPress={() => setModalVisible(false)} style={styles.modalBtn} />
              <Button title={t('common.save') || 'Salva'} onPress={handleSave} loading={saving} style={styles.modalBtn} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '700', flex: 1, marginLeft: theme.spacing.sm },
  headerRight: { width: 28 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.screenPadding },
  emptyText: { ...theme.typography.body, marginBottom: theme.spacing.md },
  addBtn: { marginTop: theme.spacing.md },
  list: { padding: theme.spacing.screenPadding, paddingBottom: 40 },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  productInfo: { flex: 1 },
  productName: { ...theme.typography.headline, fontWeight: '600' },
  productMeta: { ...theme.typography.caption1, marginTop: 2 },
  actions: { flexDirection: 'row', gap: theme.spacing.md },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: theme.spacing.screenPadding, paddingBottom: 40 },
  modalTitle: { ...theme.typography.title2, fontWeight: '700', marginBottom: theme.spacing.lg },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: theme.spacing.sm, ...theme.typography.body },
  inputArea: { minHeight: 60 },
  modalButtons: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg },
  modalBtn: { flex: 1 },
});
