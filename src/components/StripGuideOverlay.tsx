import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PAD_CENTERS, STRIP_PARAMETERS } from '@/lib/stripAnalysis';

/**
 * Guide de cadrage superposé à la caméra : un rectangle par pastille de la
 * bandelette, aligné sur les zones réellement analysées (PAD_CENTERS).
 */
export function StripGuideOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PAD_CENTERS.map((cy, i) => (
        <View key={i} style={[styles.padGuide, { top: `${(cy - 0.045) * 100}%` as const }]}>
          <Text style={styles.padLabel}>{STRIP_PARAMETERS[i].name}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  padGuide: {
    position: 'absolute',
    left: '44%',
    width: '12%',
    height: '9%',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 6,
    justifyContent: 'center',
  },
  padLabel: {
    position: 'absolute',
    left: '120%',
    width: 150,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
});
