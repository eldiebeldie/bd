import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { BirthdayContact } from '../types/birthday';
import { computeBirthdayDetails } from '../utils/dateUtils';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'granted') return true;
      const perm = await window.Notification.requestPermission();
      return perm === 'granted';
    }
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function scheduleAllBirthdayNotifications(
  contacts: BirthdayContact[]
): Promise<{ scheduledCount: number }> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    return { scheduledCount: 0 };
  }

  if (Platform.OS === 'web') {
    // On Desktop (Electron / Web), fire an immediate desktop notification for anyone whose birthday is Today or Tomorrow
    let count = 0;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      for (const c of contacts) {
        const computed = computeBirthdayDetails(c);
        if (computed.daysUntil === 0) {
          new window.Notification(`🎉 Today is ${c.name}'s Birthday!`, {
            body: computed.turningAge
              ? `${c.name} turns ${computed.turningAge} today! Don't forget to send your wishes.`
              : `Don't forget to wish ${c.name} a Happy Birthday today!`,
          });
          count++;
        }
      }
    }
    return { scheduledCount: count };
  }

  // On iOS & Android: clear previous scheduled notifications and schedule fresh reminders
  await Notifications.cancelAllScheduledNotificationsAsync();
  let scheduledCount = 0;
  const now = new Date();

  for (const contact of contacts) {
    const computed = computeBirthdayDetails(contact, now);
    const daysOffsets = contact.reminderDaysBefore?.length ? contact.reminderDaysBefore : [0, 1, 7];

    for (const daysBefore of daysOffsets) {
      const triggerDate = new Date(computed.nextBirthdayDate);
      triggerDate.setDate(triggerDate.getDate() - daysBefore);
      triggerDate.setHours(9, 0, 0, 0);

      if (triggerDate.getTime() <= now.getTime()) {
        continue;
      }

      const title =
        daysBefore === 0
          ? `🎉 Today is ${contact.name}'s Birthday!`
          : daysBefore === 1
          ? `🎂 Tomorrow is ${contact.name}'s Birthday!`
          : `📅 ${contact.name}'s Birthday is in ${daysBefore} days`;

      const body =
        daysBefore === 0 && computed.turningAge
          ? `${contact.name} is turning ${computed.turningAge} today! Tap to send wishes.`
          : contact.giftIdeas
          ? `Gift idea: ${contact.giftIdeas}`
          : `Tap to open BD and send a message.`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { contactId: contact.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
      scheduledCount++;
    }
  }

  return { scheduledCount };
}

export async function sendTestReminder(contactName: string = 'Maya Lin'): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    throw new Error('Notification permissions were not granted.');
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      new window.Notification(`🎂 Birthday Reminder Test`, {
        body: `Reminders are active! You'll be notified when ${contactName}'s birthday approaches.`,
      });
    }
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎂 Birthday Reminder Test',
      body: `Reminders are active! You'll be notified when ${contactName}'s birthday approaches.`,
    },
    trigger: null,
  });
}
