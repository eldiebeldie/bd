import { BirthdayContact, SyncResult } from '../types/birthday';

/**
 * Parses a date string from vCard BDAY or CSV birthday columns:
 * Supports formats:
 * - YYYY-MM-DD (1990-05-14)
 * - YYYYMMDD (19900514)
 * - --MM-DD (--05-14)
 * - --MMDD (--0514)
 * - MM/DD/YYYY or MM/DD
 */
export function parseFlexibleBirthday(raw: string): { month: number; day: number; year?: number } | null {
  const cleaned = raw.trim().replace(/T.*$/, '');
  if (!cleaned) return null;

  // Format: YYYY-MM-DD
  let match = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { month, day, year: year > 1900 && year < 2100 ? year : undefined };
    }
  }

  // Format: YYYYMMDD
  match = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { month, day, year: year > 1900 && year < 2100 ? year : undefined };
    }
  }

  // Format: --MM-DD or --MMDD (vCard 4.0 yearless birthday)
  match = cleaned.match(/^--(\d{2})-?(\d{2})$/);
  if (match) {
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { month, day };
    }
  }

  // Format: MM/DD/YYYY or MM/DD
  match = cleaned.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
  if (match) {
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const year = match[3] ? parseInt(match[3], 10) : undefined;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { month, day, year: year && year > 1900 && year < 2100 ? year : undefined };
    }
  }

  return null;
}

/**
 * Parses vCard (.vcf) text containing one or multiple BEGIN:VCARD ... END:VCARD blocks
 */
export function parseVCardContent(
  vcfText: string,
  existingContacts: BirthdayContact[]
): { contacts: BirthdayContact[]; result: SyncResult } {
  const cards = vcfText.split(/BEGIN:VCARD/i).slice(1);
  const updatedList = [...existingContacts];
  let imported = 0;
  let updated = 0;
  let skippedWithoutBirthday = 0;

  for (const card of cards) {
    const lines = card.split(/\r?\n/);
    let fn = '';
    let bdayRaw = '';
    let email = '';
    let phone = '';
    let note = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (/^FN[;:]/i.test(line)) {
        fn = line.replace(/^FN[^:]*:/i, '').trim();
      } else if (/^BDAY[;:]/i.test(line)) {
        bdayRaw = line.replace(/^BDAY[^:]*:/i, '').trim();
      } else if (/^EMAIL[;:]/i.test(line) && !email) {
        email = line.replace(/^EMAIL[^:]*:/i, '').trim();
      } else if (/^TEL[;:]/i.test(line) && !phone) {
        phone = line.replace(/^TEL[^:]*:/i, '').trim();
      } else if (/^NOTE[;:]/i.test(line)) {
        note = line.replace(/^NOTE[^:]*:/i, '').trim();
      }
    }

    if (!fn) continue;
    const parsedBday = parseFlexibleBirthday(bdayRaw);
    if (!parsedBday) {
      skippedWithoutBirthday++;
      continue;
    }

    const existingIndex = updatedList.findIndex(
      (c) => c.name.toLowerCase() === fn.toLowerCase() || (email && c.email?.toLowerCase() === email.toLowerCase())
    );

    if (existingIndex >= 0) {
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        birthMonth: parsedBday.month,
        birthDay: parsedBday.day,
        birthYear: parsedBday.year ?? updatedList[existingIndex].birthYear,
        phone: phone || updatedList[existingIndex].phone,
        email: email || updatedList[existingIndex].email,
        notes: note || updatedList[existingIndex].notes,
      };
      updated++;
    } else {
      updatedList.push({
        id: `vcard-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: fn,
        birthMonth: parsedBday.month,
        birthDay: parsedBday.day,
        birthYear: parsedBday.year,
        phone: phone || undefined,
        email: email || undefined,
        notes: note || undefined,
        tag: 'friend',
        source: 'vcard',
        reminderDaysBefore: [0, 1, 7],
        createdAt: new Date().toISOString(),
      });
      imported++;
    }
  }

  return {
    contacts: updatedList,
    result: { imported, updated, skippedWithoutBirthday },
  };
}

/**
 * Exports all BirthdayContacts to standard vCard 3.0 (.vcf) text
 */
export function exportToVCard(contacts: BirthdayContact[]): string {
  return contacts
    .map((c) => {
      const mm = String(c.birthMonth).padStart(2, '0');
      const dd = String(c.birthDay).padStart(2, '0');
      const bday = c.birthYear ? `${c.birthYear}-${mm}-${dd}` : `--${mm}-${dd}`;
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${c.name}`,
        `BDAY:${bday}`,
      ];
      if (c.phone) lines.push(`TEL;TYPE=CELL:${c.phone}`);
      if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${c.email}`);
      if (c.giftIdeas || c.notes) {
        const combinedNote = [c.giftIdeas ? `Gift Ideas: ${c.giftIdeas}` : '', c.notes || '']
          .filter(Boolean)
          .join(' | ');
        lines.push(`NOTE:${combinedNote}`);
      }
      lines.push('END:VCARD');
      return lines.join('\r\n');
    })
    .join('\r\n');
}
