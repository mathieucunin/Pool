import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/theme';

export default function RootLayout() {
  const seedIfNeeded = useAppStore((s) => s.seedIfNeeded);

  useEffect(() => {
    // Hydratation AsyncStorage puis création des routines/stock par défaut au premier lancement
    const unsub = useAppStore.persist.onFinishHydration(() => seedIfNeeded());
    if (useAppStore.persist.hasHydrated()) seedIfNeeded();
    return unsub;
  }, [seedIfNeeded]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="analyse/eau" options={{ title: "Couleur de l'eau" }} />
        <Stack.Screen name="analyse/bandelette" options={{ title: 'Bandelette de test' }} />
        <Stack.Screen name="routine/nouvelle" options={{ title: 'Nouvelle routine', presentation: 'modal' }} />
        <Stack.Screen name="boutique" options={{ title: 'Boutique' }} />
      </Stack>
    </>
  );
}
