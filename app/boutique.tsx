import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, SectionTitle } from '@/components/ui';
import { getProduct, PRODUCTS } from '@/data/products';
import { formatDate } from '@/lib/dates';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme';

function formatPrice(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} €`;
}

export default function Boutique() {
  const cart = useAppStore((s) => s.cart);
  const orders = useAppStore((s) => s.orders);
  const addToCart = useAppStore((s) => s.addToCart);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const placeOrder = useAppStore((s) => s.placeOrder);
  const markOrderReceived = useAppStore((s) => s.markOrderReceived);

  const cartLines = cart
    .map((l) => ({ line: l, product: getProduct(l.productId) }))
    .filter((x): x is { line: (typeof cart)[number]; product: NonNullable<ReturnType<typeof getProduct>> } => !!x.product);
  const total = cartLines.reduce((sum, { line, product }) => sum + product.price * line.quantity, 0);

  const checkout = () => {
    placeOrder(
      cartLines.map(({ line, product }) => ({
        productId: product.id,
        name: product.name,
        quantity: line.quantity,
        price: product.price,
      }))
    );
    Alert.alert(
      'Commande envoyée 🎉',
      "Commande simulée (démo). Marquez-la « reçue » à la livraison pour mettre à jour votre stock automatiquement."
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {cartLines.length > 0 && (
        <Card style={styles.cartCard}>
          <Text style={styles.cartTitle}>🛒 Panier</Text>
          {cartLines.map(({ line, product }) => (
            <View key={product.id} style={styles.cartRow}>
              <Text style={styles.cartName}>
                {product.emoji} {product.name}
              </Text>
              <View style={styles.cartControls}>
                <Pressable onPress={() => removeFromCart(product.id)} hitSlop={8}>
                  <Ionicons name="remove-circle-outline" size={22} color={colors.primary} />
                </Pressable>
                <Text style={styles.cartQty}>{line.quantity}</Text>
                <Pressable onPress={() => addToCart(product.id)} hitSlop={8}>
                  <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                </Pressable>
                <Text style={styles.cartPrice}>{formatPrice(product.price * line.quantity)}</Text>
              </View>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
          <Button title="Commander" onPress={checkout} />
        </Card>
      )}

      <SectionTitle>Catalogue</SectionTitle>
      {PRODUCTS.map((product) => (
        <Card key={product.id} style={styles.productCard}>
          <View style={styles.productRow}>
            <Text style={styles.productEmoji}>{product.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDescription}>{product.description}</Text>
              <Text style={styles.productPrice}>
                {formatPrice(product.price)} / {product.unit}
              </Text>
            </View>
            <Pressable style={styles.addButton} onPress={() => addToCart(product.id)} hitSlop={8}>
              <Ionicons name="cart" size={18} color="#fff" />
            </Pressable>
          </View>
        </Card>
      ))}

      {orders.length > 0 && (
        <>
          <SectionTitle>Mes commandes</SectionTitle>
          {orders.map((order) => (
            <Card key={order.id} style={styles.productCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.productName}>
                  {formatDate(order.date)} — {formatPrice(order.total)}
                </Text>
                <Badge
                  label={order.status === 'reçue' ? 'Reçue' : 'En cours'}
                  tone={order.status === 'reçue' ? 'ok' : 'neutral'}
                />
              </View>
              {order.lines.map((line) => (
                <Text key={line.productId} style={styles.orderLine}>
                  • {line.quantity} × {line.name}
                </Text>
              ))}
              {order.status === 'en cours' && (
                <Button
                  title="Marquer comme reçue (→ stock)"
                  variant="secondary"
                  onPress={() => markOrderReceived(order.id)}
                  style={{ marginTop: spacing.s }}
                />
              )}
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
  },
  cartCard: {
    borderColor: colors.primary,
    marginBottom: spacing.s,
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.s,
  },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    gap: spacing.s,
  },
  cartName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  cartControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  cartQty: {
    fontWeight: '700',
    color: colors.text,
    minWidth: 18,
    textAlign: 'center',
  },
  cartPrice: {
    fontWeight: '600',
    color: colors.text,
    minWidth: 70,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.s,
    marginVertical: spacing.s,
  },
  totalLabel: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.text,
  },
  totalValue: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.primary,
  },
  productCard: {
    marginBottom: spacing.s,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  productEmoji: {
    fontSize: 28,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  productDescription: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  productPrice: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
    gap: spacing.s,
  },
  orderLine: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
});
