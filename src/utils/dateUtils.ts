import { BirthdayContact, ComputedBirthday } from '../types/birthday';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getNextBirthdayDate(birthMonth: number, birthDay: number, fromDate: Date = new Date()): Date {
  const today = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  let targetYear = today.getFullYear();

  const getValidDateForYear = (year: number): Date => {
    if (birthMonth === 2 && birthDay === 29 && !isLeapYear(year)) {
      return new Date(year, 1, 28);
    }
    return new Date(year, birthMonth - 1, birthDay);
  };

  let candidate = getValidDateForYear(targetYear);
  if (candidate.getTime() < today.getTime()) {
    targetYear += 1;
    candidate = getValidDateForYear(targetYear);
  }
  return candidate;
}

export function getDaysUntil(nextDate: Date, fromDate: Date = new Date()): number {
  const today = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const target = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function getZodiacInfo(month: number, day: number): { sign: string; emoji: string } {
  const zodiacs = [
    { sign: 'Capricorn', emoji: '♑', endMonth: 1, endDay: 19 },
    { sign: 'Aquarius', emoji: '♒', endMonth: 2, endDay: 18 },
    { sign: 'Pisces', emoji: '♓', endMonth: 3, endDay: 20 },
    { sign: 'Aries', emoji: '♈', endMonth: 4, endDay: 19 },
    { sign: 'Taurus', emoji: '♉', endMonth: 5, endDay: 20 },
    { sign: 'Gemini', emoji: '♊', endMonth: 6, endDay: 20 },
    { sign: 'Cancer', emoji: '♋', endMonth: 7, endDay: 22 },
    { sign: 'Leo', emoji: '♌', endMonth: 8, endDay: 22 },
    { sign: 'Virgo', emoji: '♍', endMonth: 9, endDay: 22 },
    { sign: 'Libra', emoji: '♎', endMonth: 10, endDay: 22 },
    { sign: 'Scorpio', emoji: '♏', endMonth: 11, endDay: 21 },
    { sign: 'Sagittarius', emoji: '♐', endMonth: 12, endDay: 21 },
    { sign: 'Capricorn', emoji: '♑', endMonth: 12, endDay: 31 },
  ];

  for (const z of zodiacs) {
    if (month === z.endMonth && day <= z.endDay) {
      return { sign: z.sign, emoji: z.emoji };
    }
    if (month < z.endMonth) {
      return { sign: z.sign, emoji: z.emoji };
    }
  }
  return { sign: 'Capricorn', emoji: '♑' };
}

export function computeBirthdayDetails(contact: BirthdayContact, now: Date = new Date()): ComputedBirthday {
  const nextBirthdayDate = getNextBirthdayDate(contact.birthMonth, contact.birthDay, now);
  const daysUntil = getDaysUntil(nextBirthdayDate, now);
  const turningAge = contact.birthYear ? nextBirthdayDate.getFullYear() - contact.birthYear : undefined;
  const zodiac = getZodiacInfo(contact.birthMonth, contact.birthDay);
  const monthName = SHORT_MONTH_NAMES[contact.birthMonth - 1] || 'Jan';
  const formattedDate = contact.birthYear
    ? `${monthName} ${contact.birthDay}, ${contact.birthYear}`
    : `${monthName} ${contact.birthDay}`;

  return {
    ...contact,
    daysUntil,
    nextBirthdayDate,
    turningAge,
    zodiacSign: zodiac.sign,
    zodiacEmoji: zodiac.emoji,
    formattedDate,
  };
}

export function getCountdownLabel(daysUntil: number): string {
  if (daysUntil === 0) return '🎉 Today!';
  if (daysUntil === 1) return '🎂 Tomorrow';
  if (daysUntil <= 7) return `In ${daysUntil} days`;
  if (daysUntil <= 30) return `In ${daysUntil} days`;
  return `${daysUntil}d away`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
