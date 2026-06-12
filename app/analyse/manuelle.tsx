import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ActionPlanView } from '@/components/ActionPlanView';
import { Button, SectionTitle } from '@/components/ui';
import { ActionPlan, buildActionPlan, Measurements, idealRanges } from '@/lib/treatment';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

interface Field {
  key: keyof Measurements;
  label: string;
  placeholder: string;
}

function parseNum(text: string): number | undefined {
  if (!text.trim()) return undefined;
  const value = parseFloat(text.replace(',', '.'));
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

export default function SaisieManuelle() {
  const router = useRouter();
  const pool = useAppStore((s) => s.pool);
  const addAnalysis = useAppStore((s) => s.addAnalysis);
  const [values, setValues] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState<ActionPlan | null>(null);

  const sanitizer = pool?.sanitizer ?? 'chlore';
  const ranges = idealRanges(sanitizer);

  const fields: Field[] = [
    { key: 'ph', label: `pH (idéal ${ranges.ph[0]} – ${ranges.ph[1]})`, placeholder: '7,4' },
    ...(sanitizer === 'brome'
      ? [{ key: 'bromine', label: 'Brome (ppm, idéal 2 – 4)', placeholder: '3' } as Field]
      : sanitizer !== 'oxygene'
        ? [{ key: 'chlorine', label: 'Chlore libre (ppm, idéal 1 – 3)', placeholder: '1,5' } as Field]
        : []),
    { key: 'alkalinity', label: 'Alcalinité TAC (ppm, idéal 80 – 120)', placeholder: '100' },
    { key: 'hardness', label: 'Dureté TH (ppm, idéal 150 – 400)', placeholder: '250' },
    ...(sanitizer === 'chlore' || sanitizer === 'sel'
      ? [{ key: 'cya', label: 'Stabilisant CYA (ppm, idéal 30 – 50)', placeholder: '40' } as Field]
      : []),
    ...(sanitizer === 'sel'
      ? [{ key: 'salt', label: 'Sel (g/L, souvent 4 – 5)', placeholder: '4' } as Field]
      : []),
  ];

  const measurements: Measurements = {};
  for (const f of fields) {
    const v = parseNum(values[f.key] ?? '');
    if (v !== undefined) measurements[f.key] = v;
  }
  const hasValues = Object.keys(measurements).length > 0;

  const generate = () => setPlan(buildActionPlan(measurements, pool));

  const save = () => {
    if (!plan) return;
    addAnalysis({
      type: 'manuelle',
      summary:
        plan.steps.length === 0
          ? 'Mesures manuelles : eau équilibrée'
          : `Mesures manuelles : ${plan.steps.length} action(s) à mener`,
      severity: plan.status,
      details: fields
        .filter((f) => measurements[f.key] !== undefined)
        .map((f) => `${f.label.split(' (')[0]} : ${values[f.key]}`),
    });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!pool && (
        <Text style={styles.warning}>
          ⚠️ <Link href="/piscine" style={styles.link}>Configurez votre piscine</Link> pour obtenir
          des dosages calculés sur votre volume d'eau.
        </Text>
      )}
      <Text style={styles.intro}>
        Reportez les valeurs lues sur votre {pool ? 'analyseur' : 'photomètre, trousse à gouttes ou sonde'}.
        Laissez vide ce que vous n'avez pas mesuré.
      </Text>

      {fields.map((f) => (
        <View key={f.key}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            style={styles.input}
            value={values[f.key] ?? ''}
            onChangeText={(t) => {
              setValues((prev) => ({ ...prev, [f.key]: t }));
              setPlan(null);
            }}
            keyboardType="decimal-pad"
            placeholder={f.placeholder}
            placeholderTextColor={colors.textMuted}
          />
        </View>
      ))}

      <Button
        title="Générer le plan d'action"
        onPress={generate}
        disabled={!hasValues}
        style={{ marginTop: spacing.m }}
      />

      {plan && (
        <>
          <SectionTitle>Plan d'action</SectionTitle>
          <ActionPlanView plan={plan} />
          <Button title="Enregistrer l'analyse" onPress={save} style={{ marginTop: spacing.m }} />
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
  warning: {
    color: colors.warning,
    backgroundColor: colors.warningLight,
    borderRadius: radius.s,
    padding: spacing.s,
    fontSize: 13,
    marginBottom: spacing.s,
  },
  link: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  intro: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.s,
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
});
