import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, EmptyState, SectionTitle } from '@/components/ui';
import { lowStockItems, useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme';

export default function Stock() {
  const router = useRouter();
  const stock = useAppStore((s) => s.stock);
  const adjustStock = useAppStore((s) => s.adjustStock);
  const removeStockItem = useAppStore((s) => s.removeStockItem);
  const cart = useAppStore((s) => s.cart);

  const low = lowStockItems(stock);
  const cartCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  const confirmRemove = (id: string, name: string) => {
    Alert.alert('Retirer du stock', `Retirer « ${name} » de votre inventaire ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: () => removeStockItem(id) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button
        title={cartCount > 0 ? `🛒 Boutique (${cartCount} article${cartCount > 1 ? 's' : ''} au panier)` : '🛒 Ouvrir la boutique'}
        onPress={() => router.push('/boutique')}
      />

      {low.length > 0 && (
        <Card style={styles.alertCard}>
          <Text style={styles.alertText}>
            ⚠️ {low.length} produit{low.length > 1 ? 's' : ''} en stock bas :{' '}
            {low.map((l) => l.name).join(', ')}
          </Text>
        </Card>
      )}

      <SectionTitle>Mon inventaire</SectionTitle>
      {stock.length === 0 ? (
        <Card>
          <EmptyState emoji="📦" message="Votre inventaire est vide. Commandez des produits dans la boutique : ils seront ajoutés ici à réception." />
        </Card>
      ) : (
        stock.map((item) => {
          const isLow = item.quantity <= item.lowThreshold;
          return (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={styles.badgeRow}>
                    <Badge
                      label={`${item.quantity} ${item.unit}`}
                      tone={isLow ? 'warning' : 'ok'}
                    />
                    {isLow && <Badge label="Stock bas" tone="danger" />}
                  </View>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepButton}
                    onPress={() => adjustStock(item.id, -1)}
                    hitSlop={8}
                  >
                    <Ionicons name="remove" size={20} color={colors.primary} />
                  </Pressable>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <Pressable
                    style={styles.stepButton}
                    onPress={() => adjustStock(item.id, 1)}
                    hitSlop={8}
                  >
                    <Ionicons name="add" size={20} color={colors.primary} />
                  </Pressable>
                </View>
                <Pressable onPress={() => confirmRemove(item.id, item.name)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
            </Card>
          );
        })
      )}

      <Text style={styles.hint}>
        Décrémentez le stock à chaque utilisation : une alerte apparaît quand le seuil bas est
        atteint.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
  },
  alertCard: {
    marginTop: spacing.m,
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  alertText: {
    color: colors.warning,
    fontWeight: '600',
    fontSize: 14,
  },
  itemCard: {
    marginBottom: spacing.s,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  stepButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    minWidth: 28,
    textAlign: 'center',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.l,
  },
});
