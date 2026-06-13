import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card, EmptyState, SectionTitle } from '@/components/ui';
import { formatDate } from '@/lib/dates';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

export default function AnalyseHub() {
  const router = useRouter();
  const analyses = useAppStore((s) => s.analyses);
  const pool = useAppStore((s) => s.pool);

  // Avec un photomètre, des gouttes ou une sonde, la saisie manuelle est la
  // lecture la plus fiable : on la met en avant.
  const manualFirst = !!pool && pool.analyzer !== 'bandelette';

  const manualCard = (
    <Pressable style={[styles.bigCard, manualFirst && styles.recommended]} onPress={() => router.push('/analyse/manuelle')}>
      <Ionicons name="create" size={36} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.bigTitle}>
          Saisie des mesures{manualFirst ? ' · recommandé' : ''}
        </Text>
        <Text style={styles.muted}>
          À la main ou pré-remplie par photo de bandelette, puis plan d'action avec dosages précis.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {manualFirst && manualCard}

      <Pressable style={styles.bigCard} onPress={() => router.push('/analyse/eau')}>
        <Ionicons name="water" size={36} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.bigTitle}>Couleur de l'eau</Text>
          <Text style={styles.muted}>
            Photographiez la surface : diagnostic (claire, verte, trouble…) et actions recommandées.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
      </Pressable>

      <Pressable style={styles.bigCard} onPress={() => router.push('/analyse/bandelette')}>
        <Ionicons name="flask" size={36} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.bigTitle}>Bandelette de test</Text>
          <Text style={styles.muted}>
            Photographiez la bandelette : lecture du chlore, pH, TAC, TH et stabilisant.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
      </Pressable>

      {!manualFirst && manualCard}

      <SectionTitle>Historique</SectionTitle>
      {analyses.length === 0 ? (
        <Card>
          <EmptyState emoji="🗂️" message="Vos analyses apparaîtront ici." />
        </Card>
      ) : (
        analyses.map((a) => (
          <Card key={a.id} style={styles.historyCard}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {a.type === 'eau' ? '💧' : a.type === 'bandelette' ? '🧪' : '📋'} {a.summary}
                </Text>
                <Text style={styles.muted}>{formatDate(a.date)}</Text>
              </View>
              <Badge
                label={a.severity === 'ok' ? 'OK' : a.severity === 'warning' ? 'À surveiller' : 'Action requise'}
                tone={a.severity}
              />
            </View>
            {a.details.map((d, i) => (
              <Text key={i} style={styles.detail}>
                • {d}
              </Text>
            ))}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
  },
  bigCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    backgroundColor: colors.card,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  bigTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  recommended: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  historyCard: {
    marginBottom: spacing.s,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.s,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  detail: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
});
