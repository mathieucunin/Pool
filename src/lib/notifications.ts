import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('entretien', {
      name: 'Rappels d’entretien',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const request = await Notifications.requestPermissionsAsync();
  return request.granted;
}

/**
 * Programme un rappel local à 9h le jour de l'échéance.
 * Renvoie l'identifiant de notification, ou null si l'échéance est passée
 * ou la permission refusée.
 */
export async function scheduleRoutineReminder(
  routineName: string,
  dueAt: number
): Promise<string | null> {
  const granted = await ensureNotificationPermissions();
  if (!granted) return null;
  const date = new Date(dueAt);
  date.setHours(9, 0, 0, 0);
  if (date.getTime() <= Date.now()) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Entretien piscine 🏊',
      body: `C'est le moment : ${routineName}`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: 'entretien',
    },
  });
}

export async function cancelReminder(notificationId: string | null | undefined): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // déjà délivrée ou annulée : rien à faire
  }
}
