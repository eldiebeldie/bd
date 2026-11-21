import AsyncStorage from '@react-native-async-storage/async-storage';
import { BirthdayContact } from '../types/birthday';

const STORAGE_KEY = '@bd_birthdays_v1';

function createDefaultSampleBirthdays(): BirthdayContact[] {
  const now = new Date();

  const addDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return { month: d.getMonth() + 1, day: d.getDate() };
  };

  const today = addDays(0);
  const tomorrow = addDays(1);
  const inFiveDays = addDays(5);
  const inEighteenDays = addDays(18);
  const inFortyDays = addDays(40);

  return [
    {
      id: 'sample-1',
      name: 'Maya Lin',
      birthMonth: today.month,
      birthDay: today.day,
      birthYear: 1995,
      phone: '+1 555-0192',
      email: 'maya.lin@example.com',
      tag: 'family',
      source: 'device',
      giftIdeas: 'Noise-cancelling headphones or specialty matcha set',
      notes: 'Loves surprise brunch!',
      reminderDaysBefore: [0, 1, 7],
      createdAt: now.toISOString(),
    },
    {
      id: 'sample-2',
      name: 'Daniel Cohen',
      birthMonth: tomorrow.month,
      birthDay: tomorrow.day,
      birthYear: 1991,
      phone: '+1 555-0148',
      email: 'daniel.c@example.com',
      tag: 'friend',
      source: 'google',
      giftIdeas: 'Mechanical keyboard keycaps, espresso beans',
      reminderDaysBefore: [0, 1, 7],
      createdAt: now.toISOString(),
    },
    {
      id: 'sample-3',
      name: 'Sarah Jenkins',
      birthMonth: inFiveDays.month,
      birthDay: inFiveDays.day,
      birthYear: 1988,
      phone: '+1 555-0173',
      email: 'sarah.j@workplace.com',
      tag: 'work',
      source: 'outlook',
      giftIdeas: 'Kindle gift card or succulent plant',
      reminderDaysBefore: [0, 3],
      createdAt: now.toISOString(),
    },
    {
      id: 'sample-4',
      name: 'Alex Rivera',
      birthMonth: inEighteenDays.month,
      birthDay: inEighteenDays.day,
      birthYear: 1998,
      phone: '+1 555-0115',
      email: 'alex.rivera@example.com',
      tag: 'friend',
      source: 'device',
      giftIdeas: 'Vinyl record or concert tickets',
      reminderDaysBefore: [0, 1, 7],
      createdAt: now.toISOString(),
    },
    {
      id: 'sample-5',
      name: 'Noa Levi',
      birthMonth: inFortyDays.month,
      birthDay: inFortyDays.day,
      birthYear: 1993,
      phone: '+1 555-0166',
      email: 'noa.levi@example.com',
      tag: 'partner',
      source: 'manual',
      giftIdeas: 'Weekend getaway, gold necklace',
      reminderDaysBefore: [0, 1, 7, 14],
      createdAt: now.toISOString(),
    },
  ];
}

export async function loadBirthdays(): Promise<BirthdayContact[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = createDefaultSampleBirthdays();
      await saveBirthdays(defaults);
      return defaults;
    }
    return JSON.parse(raw) as BirthdayContact[];
  } catch (err) {
    console.warn('Failed to load birthdays from storage, using defaults:', err);
    return createDefaultSampleBirthdays();
  }
}

export async function saveBirthdays(contacts: BirthdayContact[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch (err) {
    console.error('Failed to save birthdays:', err);
  }
}
