import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, EmptyState, SectionTitle } from '@/components/ui';
import { formatDue, isOverdue } from '@/lib/dates';
import { FILTER_LABELS, SANITIZER_LABELS } from '@/lib/treatment';
import { dueRoutines, lowStockItems, useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

export default function Dashboard() {
  const router = useRouter();
  const analyses = useAppStore((s) => s.analyses);
  const routines = useAppStore((s) => s.routines);
  const stock = useAppStore((s) => s.stock);
  const pool = useAppStore((s) => s.pool);

  const lastAnalysis = analyses[0];
  const upcoming = dueRoutines(routines, 3).slice(0, 3);
  const low = lowStockItems(stock);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Ma piscine 🏊</Text>

      {pool ? (
        <Pressable onPress={() => router.push('/piscine')}>
          <Text style={styles.poolSummary}>
            {pool.volumeM3.toString().replace('.', ',')} m³ · {SANITIZER_LABELS[pool.sanitizer]} ·{' '}
            {FILTER_LABELS[pool.filterType]} — modifier
          </Text>
        </Pressable>
      ) : (
        <Card style={styles.setupCard}>
          <Text style={styles.setupTitle}>⚙️ Configurez votre piscine</Text>
          <Text style={styles.muted}>
            Volume, désinfection, filtration et analyseur : indispensable pour des dosages précis
            et des plans d'action adaptés.
          </Text>
          <Button
            title="Configurer ma piscine"
            onPress={() => router.push('/piscine')}
            style={{ marginTop: spacing.s }}
          />
        </Card>
      )}

      <View style={styles.quickRow}>
        <Pressable style={styles.quickAction} onPress={() => router.push('/analyse/eau')}>
          <Ionicons name="water" size={28} color={colors.primary} />
          <Text style={styles.quickLabel}>Analyser l'eau</Text>
        </Pressable>
        <Pressable style={styles.quickAction} onPress={() => router.push('/analyse/bandelette')}>
          <Ionicons name="flask" size={28} color={colors.primary} />
          <Text style={styles.quickLabel}>Bandelette</Text>
        </Pressable>
      </View>

      <SectionTitle>État de l'eau</SectionTitle>
      <Card>
        {lastAnalysis ? (
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{lastAnalysis.summary}</Text>
              <Text style={styles.muted}>
                Dernière analyse (
                {lastAnalysis.type === 'eau'
                  ? 'couleur'
                  : lastAnalysis.type === 'bandelette'
                    ? 'bandelette'
                    : 'mesures manuelles'}
                )
              </Text>
            </View>
            <Badge
              label={
                lastAnalysis.severity === 'ok'
                  ? 'OK'
                  : lastAnalysis.severity === 'warning'
                    ? 'À surveiller'
                    : 'Action requise'
              }
              tone={lastAnalysis.severity}
            />
          </View>
        ) : (
          <EmptyState emoji="📷" message="Aucune analyse pour l'instant. Prenez une photo de l'eau ou d'une bandelette pour commencer." />
        )}
      </Card>

      <SectionTitle>Prochaines actions</SectionTitle>
      {upcoming.length === 0 ? (
        <Card>
          <EmptyState emoji="✅" message="Rien à faire dans les 3 prochains jours. Tout est à jour !" />
        </Card>
      ) : (
        upcoming.map((r) => (
          <Card key={r.id} style={styles.itemCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>
                {r.emoji} {r.name}
              </Text>
              <Badge label={formatDue(r.nextDueAt)} tone={isOverdue(r.nextDueAt) ? 'danger' : 'neutral'} />
            </View>
          </Card>
        ))
      )}

      {low.length > 0 && (
        <>
          <SectionTitle>Stock bas</SectionTitle>
          <Card>
            {low.map((item) => (
              <View key={item.id} style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Badge label={`${item.quantity} ${item.unit}`} tone="warning" />
              </View>
            ))}
            <Link href="/boutique" style={styles.shopLink}>
              Commander dans la boutique →
            </Link>
          </Card>
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
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  poolSummary: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.m,
  },
  setupCard: {
    marginBottom: spacing.m,
    borderColor: colors.primary,
  },
  setupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: spacing.l,
    gap: spacing.s,
  },
  quickLabel: {
    fontWeight: '600',
    color: colors.text,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  itemCard: {
    marginBottom: spacing.s,
  },
  shopLink: {
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.s,
  },
});
