import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { formatDue, isOverdue } from '@/lib/dates';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme';

export default function Routines() {
  const router = useRouter();
  const routines = useAppStore((s) => s.routines);
  const completeRoutine = useAppStore((s) => s.completeRoutine);
  const removeRoutine = useAppStore((s) => s.removeRoutine);

  const sorted = [...routines].sort((a, b) => a.nextDueAt - b.nextDueAt);

  const confirmRemove = (id: string, name: string) => {
    Alert.alert('Supprimer la routine', `Supprimer « ${name} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeRoutine(id) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button title="+ Nouvelle routine" onPress={() => router.push('/routine/nouvelle')} />

      {sorted.length === 0 ? (
        <Card style={{ marginTop: spacing.m }}>
          <EmptyState emoji="🗓️" message="Créez vos routines d'entretien : vous recevrez un rappel à chaque échéance." />
        </Card>
      ) : (
        sorted.map((r) => {
          const overdue = isOverdue(r.nextDueAt);
          return (
            <Card key={r.id} style={styles.routineCard}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    {r.emoji} {r.name}
                  </Text>
                  <Text style={styles.muted}>Tous les {r.frequencyDays} jours</Text>
                  <Badge label={formatDue(r.nextDueAt)} tone={overdue ? 'danger' : 'neutral'} />
                </View>
                <View style={styles.actions}>
                  <Pressable
                    style={styles.doneButton}
                    onPress={() => completeRoutine(r.id)}
                    hitSlop={8}
                  >
                    <Ionicons name="checkmark" size={22} color="#fff" />
                  </Pressable>
                  <Pressable onPress={() => confirmRemove(r.id, r.name)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>
            </Card>
          );
        })
      )}

      <Text style={styles.hint}>
        ✓ marque la tâche comme faite et programme le prochain rappel automatiquement.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
  },
  routineCard: {
    marginTop: spacing.s,
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
  muted: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 6,
  },
  actions: {
    alignItems: 'center',
    gap: spacing.m,
  },
  doneButton: {
    backgroundColor: colors.success,
    borderRadius: 999,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.l,
  },
});
