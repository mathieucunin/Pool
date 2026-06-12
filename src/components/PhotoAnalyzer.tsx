import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui';
import { colors, spacing } from '@/theme';

/**
 * Écran de capture générique : caméra + import galerie, puis délègue
 * l'analyse de la photo au parent via `onPhoto`.
 */
export function PhotoAnalyzer({
  instruction,
  overlay,
  analyzing,
  onPhoto,
}: {
  instruction: string;
  /** Superposition de cadrage (guide bandelette, etc.) */
  overlay?: React.ReactNode;
  analyzing: boolean;
  onPhoto: (uri: string) => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);

  const takePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) onPhoto(photo.uri);
    } catch {
      Alert.alert('Erreur', "Impossible de prendre la photo. Réessayez.");
    } finally {
      setCapturing(false);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) onPhoto(result.assets[0].uri);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          L'accès à l'appareil photo est nécessaire pour analyser votre piscine.
        </Text>
        <Button title="Autoriser la caméra" onPress={requestPermission} />
        <View style={{ height: spacing.s }} />
        <Button title="Choisir une photo" variant="secondary" onPress={pickFromGallery} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        {overlay}
        {analyzing && (
          <View style={styles.analyzingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.analyzingText}>Analyse en cours…</Text>
          </View>
        )}
      </View>
      <View style={styles.controls}>
        <Text style={styles.instruction}>{instruction}</Text>
        <Button title="📸  Prendre la photo" onPress={takePhoto} loading={capturing || analyzing} />
        <View style={{ height: spacing.s }} />
        <Button title="Importer depuis la galerie" variant="secondary" onPress={pickFromGallery} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cameraWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.l,
    backgroundColor: colors.background,
  },
  permissionText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  controls: {
    padding: spacing.m,
  },
  instruction: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
  },
  analyzingText: {
    color: '#fff',
    fontWeight: '600',
  },
});
