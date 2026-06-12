import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, SectionTitle } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

const TEMPLATES = [
  { name: "Tester l'eau (bandelette)", emoji: '🧪', frequencyDays: 3 },
  { name: 'Ajouter un galet de chlore', emoji: '🧼', frequencyDays: 7 },
  { name: 'Contre-lavage du filtre', emoji: '🔄', frequencyDays: 14 },
  { name: 'Nettoyer la ligne d’eau', emoji: '🧽', frequencyDays: 7 },
  { name: 'Passer le robot / aspirateur', emoji: '🤖', frequencyDays: 7 },
  { name: 'Traitement anti-algues préventif', emoji: '🦠', frequencyDays: 14 },
  { name: 'Vérifier le niveau d’eau', emoji: '📏', frequencyDays: 7 },
];

const EMOJIS = ['🧪', '🧼', '🔄', '🧽', '🤖', '🦠', '📏', '💧', '🧹', '🗓️'];

export default function NouvelleRoutine() {
  const router = useRouter();
  const addRoutine = useAppStore((s) => s.addRoutine);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🗓️');
  const [frequency, setFrequency] = useState('7');
  const [saving, setSaving] = useState(false);

  const save = async (n: string, e: string, f: number) => {
    if (!n.trim() || f <= 0 || saving) return;
    setSaving(true);
    try {
      await addRoutine(n.trim(), e, f);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionTitle>Modèles</SectionTitle>
      {TEMPLATES.map((t) => (
        <Pressable
          key={t.name}
          style={styles.template}
          onPress={() => save(t.name, t.emoji, t.frequencyDays)}
        >
          <Text style={styles.templateText}>
            {t.emoji} {t.name}
          </Text>
          <Text style={styles.muted}>tous les {t.frequencyDays} j</Text>
        </Pressable>
      ))}

      <SectionTitle>Ou créez la vôtre</SectionTitle>
      <Text style={styles.label}>Nom</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ex. : Nettoyer le panier de la pompe"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.label}>Icône</Text>
      <View style={styles.emojiRow}>
        {EMOJIS.map((e) => (
          <Pressable
            key={e}
            style={[styles.emojiChip, emoji === e && styles.emojiChipActive]}
            onPress={() => setEmoji(e)}
          >
            <Text style={styles.emojiText}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Fréquence (jours)</Text>
      <TextInput
        style={styles.input}
        value={frequency}
        onChangeText={setFrequency}
        keyboardType="number-pad"
        placeholder="7"
        placeholderTextColor={colors.textMuted}
      />

      <Button
        title="Créer la routine"
        onPress={() => save(name, emoji, parseInt(frequency, 10) || 0)}
        disabled={!name.trim() || !(parseInt(frequency, 10) > 0)}
        loading={saving}
        style={{ marginTop: spacing.m }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
  },
  template: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.m,
    padding: spacing.m,
    marginBottom: spacing.s,
  },
  templateText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 13,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.m,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.m,
    padding: spacing.m,
    fontSize: 15,
    color: colors.text,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  emojiChip: {
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.s,
  },
  emojiChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  emojiText: {
    fontSize: 20,
  },
});
