import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ActionPlanView } from '@/components/ActionPlanView';
import { PhotoAnalyzer } from '@/components/PhotoAnalyzer';
import { Badge, Button, Card } from '@/components/ui';
import { buildActionPlan } from '@/lib/treatment';
import { analyzeWater, WaterResult } from '@/lib/waterAnalysis';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

export default function AnalyseEau() {
  const router = useRouter();
  const addAnalysis = useAppStore((s) => s.addAnalysis);
  const pool = useAppStore((s) => s.pool);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<WaterResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePhoto = async (uri: string) => {
    setAnalyzing(true);
    setError(null);
    try {
      setResult(await analyzeWater(uri));
    } catch {
      setError("L'analyse a échoué. Vérifiez la photo et réessayez.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Avec un profil piscine, le moteur de traitement fournit un plan priorisé
  // et dosé ; sinon on retombe sur les actions génériques du diagnostic.
  const plan = result && result.status !== 'claire' ? buildActionPlan({}, pool, result.status) : null;

  const save = () => {
    if (!result) return;
    addAnalysis({
      type: 'eau',
      summary: result.title,
      severity: result.severity,
      details: plan && pool ? plan.steps.map((s, i) => `${i + 1}. ${s.title}`) : result.actions,
    });
    router.back();
  };

  if (result) {
    return (
      <ScrollView contentContainerStyle={styles.resultContainer}>
        <Card>
          <View style={styles.headerRow}>
            <View style={[styles.swatch, { backgroundColor: result.swatch }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{result.title}</Text>
              <Badge
                label={
                  result.severity === 'ok'
                    ? 'Tout va bien'
                    : result.severity === 'warning'
                      ? 'À surveiller'
                      : 'Action requise'
                }
                tone={result.severity}
              />
            </View>
          </View>
          <Text style={styles.description}>{result.description}</Text>
        </Card>

        {plan && pool ? (
          <View style={{ marginTop: spacing.m }}>
            <ActionPlanView plan={plan} />
          </View>
        ) : (
          <Card style={{ marginTop: spacing.m }}>
            <Text style={styles.subtitle}>Actions recommandées</Text>
            {result.actions.map((action, i) => (
              <Text key={i} style={styles.action}>
                {i + 1}. {action}
              </Text>
            ))}
            {!pool && (
              <Button
                title="⚙️ Configurer ma piscine pour des dosages précis"
                variant="secondary"
                onPress={() => router.push('/piscine')}
                style={{ marginTop: spacing.s }}
              />
            )}
          </Card>
        )}

        <Text style={styles.disclaimer}>
          ⚠️ Estimation basée sur la couleur de la photo : la lumière et les reflets peuvent fausser
          le résultat. Confirmez avec une bandelette de test.
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
        instruction="Cadrez uniquement la surface de l'eau, sans margelle ni reflet direct du soleil."
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginBottom: spacing.s,
  },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.s,
  },
  action: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
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
