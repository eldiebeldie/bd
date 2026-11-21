export type ContactSource = 'manual' | 'device' | 'google' | 'outlook' | 'vcard';

export type RelationshipTag = 'family' | 'friend' | 'work' | 'partner' | 'other';

export interface BirthdayContact {
  id: string;
  name: string;
  /** 1-12 */
  birthMonth: number;
  /** 1-31 */
  birthDay: number;
  /** Optional 4-digit year, e.g. 1992 */
  birthYear?: number;
  phone?: string;
  email?: string;
  photoUri?: string;
  tag: RelationshipTag;
  source: ContactSource;
  externalId?: string;
  giftIdeas?: string;
  notes?: string;
  /** Days before birthday to remind (e.g., [0, 1, 7]) */
  reminderDaysBefore: number[];
  createdAt: string;
}

export interface ComputedBirthday extends BirthdayContact {
  daysUntil: number;
  nextBirthdayDate: Date;
  turningAge?: number;
  zodiacSign: string;
  zodiacEmoji: string;
  formattedDate: string;
}

export interface SyncResult {
  imported: number;
  updated: number;
  skippedWithoutBirthday: number;
  contactsMissingBirthday?: RawDeviceContact[];
}

export interface RawDeviceContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  photoUri?: string;
  source: ContactSource;
}
