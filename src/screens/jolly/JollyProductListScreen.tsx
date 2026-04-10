/**
 * Catalogo prodotti di un Jolly (prodotti per la casa / e-commerce)
 * Visibile da host/altri dalla card KOL&BED
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { ProfilesService } from '../../services/profiles.service';
import { JollyService, type JollyProduct } from '../../services/jolly.service';
import { theme } from '../../theme';
import type { ProfileScreenProps } from '../../types/navigation';
import type { UserProfile } from '../../types';

export default function JollyProductListScreen({
  navigation,
  route,
}: ProfileScreenProps<'JollyProductList'>) {
  const { jollyId } = route.params;
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [jolly, setJolly] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<JollyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ProfilesService.getProfilesByIds([jollyId]).then((list) => setJolly(list[0] ?? null)),
      JollyService.getProductsByJolly(jollyId).then(setProducts),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [jollyId]);

  const bg = isDark ? theme.colors.dark.background : theme.colors.light.background;
  const textColor = isDark ? theme.colors.dark.label : theme.colors.light.label;
  const secondary = isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel;
  const cardBg = isDark ? theme.colors.dark.card : theme.colors.light.card;

  const jollyName = jolly?.full_name || jolly?.username || t('common.user');

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
          {t('kolbed.jollyCatalog')} · {jollyName}
        </Text>
        <View style={styles.headerRight} />
      </View>
      {products.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={48} color={secondary} />
          <Text style={[styles.emptyText, { color: secondary }]}>{t('kolbed.jollyNoProducts')}</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.productCard, { backgroundColor: cardBg }]}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.productImage} resizeMode="cover" />
              ) : (
                <View style={[styles.productImage, styles.productImagePlaceholder]} />
              )}
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: textColor }]} numberOfLines={2}>{item.name}</Text>
                {item.description ? (
                  <Text style={[styles.productDesc, { color: secondary }]} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <View style={styles.productRow}>
                  <Text style={[styles.productPrice, { color: textColor }]}>€ {Number(item.price).toFixed(2)}</Text>
                  <Text style={[styles.productQty, { color: secondary }]}>{t('kolbed.quantity')}: {item.quantity}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: { ...theme.typography.headline, fontWeight: '700', flex: 1, marginLeft: theme.spacing.sm },
  headerRight: { width: 24 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.screenPadding },
  emptyText: { ...theme.typography.body, marginTop: theme.spacing.md },
  list: { padding: theme.spacing.screenPadding, paddingBottom: 40 },
  productCard: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  productImage: { width: 80, height: 80 },
  productImagePlaceholder: { backgroundColor: 'rgba(128,128,128,0.2)' },
  productInfo: { flex: 1, padding: theme.spacing.md, justifyContent: 'center' },
  productName: { ...theme.typography.headline, fontWeight: '600' },
  productDesc: { ...theme.typography.caption1, marginTop: 2 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  productPrice: { ...theme.typography.subheadline, fontWeight: '700' },
  productQty: { ...theme.typography.caption1 },
});
