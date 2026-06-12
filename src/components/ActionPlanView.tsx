import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card } from '@/components/ui';
import { getProduct } from '@/data/products';
import { ActionPlan } from '@/lib/treatment';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme';

/** Affiche un plan d'action priorisé, avec ajout direct des produits au panier. */
export function ActionPlanView({ plan }: { plan: ActionPlan }) {
  const addToCart = useAppStore((s) => s.addToCart);
  const cart = useAppStore((s) => s.cart);

  return (
    <View>
      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.headline}>{plan.headline}</Text>
          <Badge
            label={plan.status === 'ok' ? 'OK' : plan.status === 'warning' ? 'À corriger' : 'Urgent'}
            tone={plan.status}
          />
        </View>
      </Card>

      {plan.steps.map((step, i) => {
        const product = step.productId ? getProduct(step.productId) : undefined;
        const inCart = product && cart.some((l) => l.productId === product.id);
        return (
          <Card key={`${step.title}-${i}`} style={styles.stepCard}>
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDetail}>{step.detail}</Text>
                {step.wait && <Text style={styles.wait}>⏳ {step.wait}</Text>}
                {product && (
                  <Pressable
                    style={[styles.productButton, inCart && styles.productButtonDone]}
                    onPress={() => !inCart && addToCart(product.id)}
                  >
                    <Ionicons
                      name={inCart ? 'checkmark' : 'cart-outline'}
                      size={14}
                      color={inCart ? colors.success : colors.primary}
                    />
                    <Text style={[styles.productButtonText, inCart && { color: colors.success }]}>
                      {inCart ? 'Au panier' : `${product.emoji} ${product.name} — ajouter au panier`}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Card>
        );
      })}

      {plan.notes.map((note, i) => (
        <Text key={i} style={styles.note}>
          {note.startsWith('💡') ? note : `ℹ️ ${note}`}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.s,
  },
  headline: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  stepCard: {
    marginTop: spacing.s,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  stepNumber: {
    backgroundColor: colors.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  stepDetail: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  wait: {
    color: colors.warning,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  productButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.s,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  productButtonDone: {
    backgroundColor: colors.successLight,
  },
  productButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  note: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.s,
  },
});
