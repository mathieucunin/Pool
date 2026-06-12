import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, SectionTitle } from '@/components/ui';
import {
  Analyzer,
  ANALYZER_LABELS,
  FILTER_LABELS,
  FilterType,
  POOL_TYPE_LABELS,
  PoolType,
  Sanitizer,
  SANITIZER_LABELS,
} from '@/lib/treatment';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

type Shape = 'rectangulaire' | 'ronde' | 'ovale';

const SHAPE_LABELS: Record<Shape, string> = {
  rectangulaire: 'Rectangulaire',
  ronde: 'Ronde',
  ovale: 'Ovale',
};

function ChipSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {(Object.keys(options) as T[]).map((key) => (
        <Pressable
          key={key}
          style={[styles.chip, value === key && styles.chipActive]}
          onPress={() => onChange(key)}
        >
          <Text style={[styles.chipText, value === key && styles.chipTextActive]}>
            {options[key]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function parseNum(text: string): number {
  const value = parseFloat(text.replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function computeVolume(shape: Shape, length: number, width: number, depth: number): number {
  if (depth <= 0) return 0;
  if (shape === 'ronde') return Math.PI * (length / 2) ** 2 * depth; // length = diamètre
  if (shape === 'ovale') return length * width * depth * 0.89;
  return length * width * depth;
}

export default function ConfigPiscine() {
  const router = useRouter();
  const pool = useAppStore((s) => s.pool);
  const setPool = useAppStore((s) => s.setPool);

  const [poolType, setPoolType] = useState<PoolType>(pool?.poolType ?? 'enterree');
  const [filterType, setFilterType] = useState<FilterType>(pool?.filterType ?? 'sable');
  const [sanitizer, setSanitizer] = useState<Sanitizer>(pool?.sanitizer ?? 'chlore');
  const [analyzer, setAnalyzer] = useState<Analyzer>(pool?.analyzer ?? 'bandelette');

  const [shape, setShape] = useState<Shape>('rectangulaire');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [volume, setVolume] = useState(pool ? String(pool.volumeM3).replace('.', ',') : '');

  const updateDims = (l: string, w: string, d: string, s: Shape) => {
    setLength(l);
    setWidth(w);
    setDepth(d);
    setShape(s);
    const computed = computeVolume(s, parseNum(l), s === 'ronde' ? 0 : parseNum(w), parseNum(d));
    if (computed > 0) setVolume(computed.toFixed(1).replace('.', ','));
  };

  const volumeM3 = parseNum(volume);

  const save = () => {
    if (volumeM3 <= 0) return;
    setPool({ volumeM3, poolType, filterType, sanitizer, analyzer });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Ces informations permettent de calculer des dosages précis et d'adapter les
        recommandations à votre installation.
      </Text>

      <SectionTitle>Type de bassin</SectionTitle>
      <ChipSelect options={POOL_TYPE_LABELS} value={poolType} onChange={setPoolType} />

      <SectionTitle>Volume d'eau</SectionTitle>
      <ChipSelect options={SHAPE_LABELS} value={shape} onChange={(s) => updateDims(length, width, depth, s)} />
      <View style={styles.dimsRow}>
        <View style={styles.dimField}>
          <Text style={styles.label}>{shape === 'ronde' ? 'Diamètre (m)' : 'Longueur (m)'}</Text>
          <TextInput
            style={styles.input}
            value={length}
            onChangeText={(t) => updateDims(t, width, depth, shape)}
            keyboardType="decimal-pad"
            placeholder="8"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        {shape !== 'ronde' && (
          <View style={styles.dimField}>
            <Text style={styles.label}>Largeur (m)</Text>
            <TextInput
              style={styles.input}
              value={width}
              onChangeText={(t) => updateDims(length, t, depth, shape)}
              keyboardType="decimal-pad"
              placeholder="4"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}
        <View style={styles.dimField}>
          <Text style={styles.label}>Prof. moyenne (m)</Text>
          <TextInput
            style={styles.input}
            value={depth}
            onChangeText={(t) => updateDims(length, width, t, shape)}
            keyboardType="decimal-pad"
            placeholder="1,5"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>
      <Text style={styles.label}>Volume (m³) — calculé, modifiable</Text>
      <TextInput
        style={[styles.input, styles.volumeInput]}
        value={volume}
        onChangeText={setVolume}
        keyboardType="decimal-pad"
        placeholder="48"
        placeholderTextColor={colors.textMuted}
      />

      <SectionTitle>Filtration</SectionTitle>
      <ChipSelect options={FILTER_LABELS} value={filterType} onChange={setFilterType} />

      <SectionTitle>Désinfection</SectionTitle>
      <ChipSelect options={SANITIZER_LABELS} value={sanitizer} onChange={setSanitizer} />

      <SectionTitle>Analyseur d'eau</SectionTitle>
      <ChipSelect options={ANALYZER_LABELS} value={analyzer} onChange={setAnalyzer} />
      <Text style={styles.hint}>
        {analyzer === 'bandelette'
          ? "L'analyse photo de bandelette sera proposée en priorité. Vérifiez toujours avec l'échelle du flacon."
          : 'Avec un ' +
            ANALYZER_LABELS[analyzer].toLowerCase() +
            ", saisissez vos mesures dans « Saisie manuelle » : c'est la lecture la plus fiable pour le plan d'action."}
      </Text>

      <Button
        title="Enregistrer ma piscine"
        onPress={save}
        disabled={volumeM3 <= 0}
        style={{ marginTop: spacing.l }}
      />
      {volumeM3 <= 0 && (
        <Text style={styles.hint}>Indiquez les dimensions ou directement le volume en m³.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
  },
  intro: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  dimsRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  dimField: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.s,
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
  volumeInput: {
    borderColor: colors.primary,
    fontWeight: '700',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.s,
  },
});
