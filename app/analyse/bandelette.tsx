import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ActionPlanView } from '@/components/ActionPlanView';
import { PhotoAnalyzer } from '@/components/PhotoAnalyzer';
import { StripGuideOverlay } from '@/components/StripGuideOverlay';
import { Badge, Button, Card, SectionTitle } from '@/components/ui';
import { analyzeStrip, StripResult } from '@/lib/stripAnalysis';
import { buildActionPlan, Measurements } from '@/lib/treatment';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

/** Convertit les pads lus en mesures pour le moteur de traitement. */
function toMeasurements(result: StripResult): Measurements {
  const m: Measurements = {};
  for (const pad of result.pads) {
    if (pad.parameter.key === 'hardness') m.hardness = pad.value;
    else if (pad.parameter.key === 'chlorine') m.chlorine = pad.value;
    else if (pad.parameter.key === 'ph') m.ph = pad.value;
    else if (pad.parameter.key === 'alkalinity') m.alkalinity = pad.value;
    else if (pad.parameter.key === 'cya') m.cya = pad.value;
  }
  return m;
}

export default function AnalyseBandelette() {
  const router = useRouter();
  const addAnalysis = useAppStore((s) => s.addAnalysis);
  const pool = useAppStore((s) => s.pool);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<StripResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePhoto = async (uri: string) => {
    setAnalyzing(true);
    setError(null);
    try {
      setResult(await analyzeStrip(uri));
    } catch {
      setError("L'analyse a échoué. Vérifiez la photo et réessayez.");
    } finally {
      setAnalyzing(false);
    }
  };

  const save = () => {
    if (!result) return;
    const severity = result.issues === 0 ? 'ok' : result.issues <= 2 ? 'warning' : 'danger';
    addAnalysis({
      type: 'bandelette',
      summary:
        result.issues === 0
          ? 'Bandelette : tous les paramètres OK'
          : `Bandelette : ${result.issues} paramètre(s) à corriger`,
      severity,
      details: result.pads.map(
        (p) =>
          `${p.parameter.name} : ${p.valueLabel}${p.parameter.unit ? ` ${p.parameter.unit}` : ''} (${p.status})`
      ),
    });
    router.back();
  };

  const plan = result ? buildActionPlan(toMeasurements(result), pool) : null;

  if (result) {
    return (
      <ScrollView contentContainerStyle={styles.resultContainer}>
        <Card>
          <Text style={styles.title}>
            {result.issues === 0
              ? '✅ Tous les paramètres sont dans la plage idéale'
              : `⚠️ ${result.issues} paramètre(s) hors plage idéale`}
          </Text>
        </Card>

        {result.pads.map((pad) => (
          <Card key={pad.parameter.key} style={{ marginTop: spacing.s }}>
            <View style={styles.padRow}>
              <View style={[styles.swatch, { backgroundColor: pad.swatch }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.padName}>{pad.parameter.name}</Text>
                <Text style={styles.muted}>
                  Idéal : {pad.parameter.ideal[0]} – {pad.parameter.ideal[1]}{' '}
                  {pad.parameter.unit}
                </Text>
              </View>
              <View style={styles.valueBlock}>
                <Text style={styles.value}>
                  {pad.valueLabel}
                  {pad.parameter.unit ? ` ${pad.parameter.unit}` : ''}
                </Text>
                <Badge
                  label={pad.status === 'ok' ? 'OK' : pad.status === 'bas' ? 'Trop bas' : 'Trop haut'}
                  tone={pad.status === 'ok' ? 'ok' : 'warning'}
                />
              </View>
            </View>
            {/* Sans profil piscine, on garde le conseil générique ; sinon le plan ci-dessous fait foi */}
            {pad.advice && !pool && <Text style={styles.advice}>💡 {pad.advice}</Text>}
          </Card>
        ))}

        {plan && (
          <>
            <SectionTitle>Plan d'action</SectionTitle>
            <ActionPlanView plan={plan} />
          </>
        )}

        <Text style={styles.disclaimer}>
          ⚠️ Lecture estimée à partir des couleurs de la photo. L'éclairage et la marque de
          bandelette influencent le résultat : comparez avec l'échelle imprimée sur votre flacon.
        </Text>

        <Button title="Enregistrer l'analyse" onPress={save} style={{ marginTop: spacing.m }} />
        <View style={{ height: spacing.s }} />
        <Button title="Reprendre une photo" variant="secondary" onPress={() => setResult(null)} />
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {error && <Text style={styles.error}>{error}</Text>}
      <PhotoAnalyzer
        instruction="Tenez la bandelette verticalement, chaque pastille alignée dans son cadre (Dureté en haut). Lumière naturelle, sans ombre."
        overlay={<StripGuideOverlay />}
        analyzing={analyzing}
        onPhoto={handlePhoto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  resultContainer: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  padRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  padName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  valueBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  advice: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.s,
    lineHeight: 18,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.m,
    lineHeight: 18,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
    padding: spacing.s,
    backgroundColor: colors.dangerLight,
  },
});
