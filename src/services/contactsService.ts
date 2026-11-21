import { Platform } from 'react-native';
import * as Contacts from 'expo-contacts';
import { BirthdayContact, RawDeviceContact, SyncResult } from '../types/birthday';
import { parseFlexibleBirthday } from '../utils/vcardParser';

/**
 * Syncs contacts from iOS / Android native address book using expo-contacts.
 * Automatically imports contacts with birthdays, and collects contacts without birthdays
 * so the user can easily assign a birthday to any phone contact.
 */
export async function syncDeviceContacts(
  existingContacts: BirthdayContact[]
): Promise<{ contacts: BirthdayContact[]; result: SyncResult }> {
  if (Platform.OS === 'web') {
    // Check if the Contact Picker API is supported (Chrome on Android, etc.)
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    if (!nav?.contacts?.select) {
      throw new Error(
        'Direct OS Address Book access is native to iOS & Android. On Windows Desktop / Web, use Google Contacts, Outlook Sync, or vCard (.vcf) Import below!'
      );
    }
  }

  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access device contacts was denied.');
  }

  const { data } = await Contacts.getContactsAsync({
    fields: [
      Contacts.Fields.Name,
      Contacts.Fields.FirstName,
      Contacts.Fields.LastName,
      Contacts.Fields.Birthday,
      Contacts.Fields.PhoneNumbers,
      Contacts.Fields.Emails,
      Contacts.Fields.Image,
    ],
  });

  const updatedList = [...existingContacts];
  let imported = 0;
  let updated = 0;
  let skippedWithoutBirthday = 0;
  const contactsMissingBirthday: RawDeviceContact[] = [];

  for (const person of data) {
    const fullName =
      person.name ||
      [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
    if (!fullName) continue;

    const primaryPhone = person.phoneNumbers?.[0]?.number;
    const primaryEmail = person.emails?.[0]?.email;
    const photoUri = person.image?.uri;

    if (!person.birthday || person.birthday.month === undefined || person.birthday.day === undefined) {
      skippedWithoutBirthday++;
      contactsMissingBirthday.push({
        id: person.id,
        name: fullName,
        phone: primaryPhone,
        email: primaryEmail,
        photoUri,
        source: 'device',
      });
      continue;
    }

    // Note: expo-contacts birthday.month is 0-indexed (0 = January, 11 = December)
    const birthMonth = person.birthday.month + 1;
    const birthDay = person.birthday.day;
    const birthYear =
      person.birthday.year && person.birthday.year > 1900 ? person.birthday.year : undefined;

    const existingIdx = updatedList.findIndex(
      (c) =>
        (c.externalId && c.externalId === person.id) ||
        c.name.toLowerCase() === fullName.toLowerCase()
    );

    if (existingIdx >= 0) {
      updatedList[existingIdx] = {
        ...updatedList[existingIdx],
        birthMonth,
        birthDay,
        birthYear: birthYear ?? updatedList[existingIdx].birthYear,
        phone: primaryPhone || updatedList[existingIdx].phone,
        email: primaryEmail || updatedList[existingIdx].email,
        photoUri: photoUri || updatedList[existingIdx].photoUri,
        externalId: person.id,
      };
      updated++;
    } else {
      updatedList.push({
        id: `device-${person.id}`,
        externalId: person.id,
        name: fullName,
        birthMonth,
        birthDay,
        birthYear,
        phone: primaryPhone,
        email: primaryEmail,
        photoUri,
        tag: 'friend',
        source: 'device',
        reminderDaysBefore: [0, 1, 7],
        createdAt: new Date().toISOString(),
      });
      imported++;
    }
  }

  return {
    contacts: updatedList,
    result: {
      imported,
      updated,
      skippedWithoutBirthday,
      contactsMissingBirthday,
    },
  };
}

/**
 * Syncs contacts from Google Contacts (Google People API) using an OAuth 2.0 Access Token.
 * Scope required: https://www.googleapis.com/auth/contacts.readonly
 */
export async function syncGoogleContacts(
  accessToken: string,
  existingContacts: BirthdayContact[]
): Promise<{ contacts: BirthdayContact[]; result: SyncResult }> {
  const token = accessToken.trim();
  if (!token) {
    throw new Error('Please provide a valid Google OAuth Access Token.');
  }

  const response = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,birthdays,emailAddresses,phoneNumbers,photos&pageSize=1000',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Contacts API error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  const connections = json.connections || [];

  const updatedList = [...existingContacts];
  let imported = 0;
  let updated = 0;
  let skippedWithoutBirthday = 0;
  const contactsMissingBirthday: RawDeviceContact[] = [];

  for (const conn of connections) {
    const nameObj = conn.names?.[0];
    const fullName = nameObj?.displayName;
    if (!fullName) continue;

    const email = conn.emailAddresses?.[0]?.value;
    const phone = conn.phoneNumbers?.[0]?.value;
    const photoUri = conn.photos?.[0]?.url;
    const bdayDate = conn.birthdays?.[0]?.date;

    if (!bdayDate || !bdayDate.month || !bdayDate.day) {
      skippedWithoutBirthday++;
      contactsMissingBirthday.push({
        id: conn.resourceName || `g-${fullName}`,
        name: fullName,
        email,
        phone,
        photoUri,
        source: 'google',
      });
      continue;
    }

    const birthMonth = Number(bdayDate.month);
    const birthDay = Number(bdayDate.day);
    const birthYear = bdayDate.year ? Number(bdayDate.year) : undefined;

    const existingIdx = updatedList.findIndex(
      (c) =>
        (c.externalId && c.externalId === conn.resourceName) ||
        c.name.toLowerCase() === fullName.toLowerCase() ||
        (email && c.email?.toLowerCase() === email.toLowerCase())
    );

    if (existingIdx >= 0) {
      updatedList[existingIdx] = {
        ...updatedList[existingIdx],
        birthMonth,
        birthDay,
        birthYear: birthYear ?? updatedList[existingIdx].birthYear,
        phone: phone || updatedList[existingIdx].phone,
        email: email || updatedList[existingIdx].email,
        photoUri: photoUri || updatedList[existingIdx].photoUri,
        externalId: conn.resourceName,
      };
      updated++;
    } else {
      updatedList.push({
        id: `google-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        externalId: conn.resourceName,
        name: fullName,
        birthMonth,
        birthDay,
        birthYear,
        phone,
        email,
        photoUri,
        tag: 'friend',
        source: 'google',
        reminderDaysBefore: [0, 1, 7],
        createdAt: new Date().toISOString(),
      });
      imported++;
    }
  }

  return {
    contacts: updatedList,
    result: {
      imported,
      updated,
      skippedWithoutBirthday,
      contactsMissingBirthday,
    },
  };
}

/**
 * Syncs contacts from Microsoft Outlook / Microsoft 365 using Microsoft Graph API.
 * Scope required: Contacts.Read
 */
export async function syncOutlookContacts(
  accessToken: string,
  existingContacts: BirthdayContact[]
): Promise<{ contacts: BirthdayContact[]; result: SyncResult }> {
  const token = accessToken.trim();
  if (!token) {
    throw new Error('Please provide a valid Microsoft Graph OAuth Access Token.');
  }

  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me/contacts?$select=id,displayName,birthday,emailAddresses,mobilePhone,businessPhones&$top=999',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Microsoft Graph API error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  const items = json.value || [];

  const updatedList = [...existingContacts];
  let imported = 0;
  let updated = 0;
  let skippedWithoutBirthday = 0;
  const contactsMissingBirthday: RawDeviceContact[] = [];

  for (const item of items) {
    const fullName = item.displayName;
    if (!fullName) continue;

    const email = item.emailAddresses?.[0]?.address;
    const phone = item.mobilePhone || item.businessPhones?.[0];
    const parsedBday = item.birthday ? parseFlexibleBirthday(item.birthday) : null;

    if (!parsedBday) {
      skippedWithoutBirthday++;
      contactsMissingBirthday.push({
        id: item.id || `ms-${fullName}`,
        name: fullName,
        email,
        phone,
        source: 'outlook',
      });
      continue;
    }

    const existingIdx = updatedList.findIndex(
      (c) =>
        (c.externalId && c.externalId === item.id) ||
        c.name.toLowerCase() === fullName.toLowerCase() ||
        (email && c.email?.toLowerCase() === email.toLowerCase())
    );

    if (existingIdx >= 0) {
      updatedList[existingIdx] = {
        ...updatedList[existingIdx],
        birthMonth: parsedBday.month,
        birthDay: parsedBday.day,
        birthYear: parsedBday.year ?? updatedList[existingIdx].birthYear,
        phone: phone || updatedList[existingIdx].phone,
        email: email || updatedList[existingIdx].email,
        externalId: item.id,
      };
      updated++;
    } else {
      updatedList.push({
        id: `outlook-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        externalId: item.id,
        name: fullName,
        birthMonth: parsedBday.month,
        birthDay: parsedBday.day,
        birthYear: parsedBday.year,
        phone,
        email,
        tag: 'work',
        source: 'outlook',
        reminderDaysBefore: [0, 1, 7],
        createdAt: new Date().toISOString(),
      });
      imported++;
    }
  }

  return {
    contacts: updatedList,
    result: {
      imported,
      updated,
      skippedWithoutBirthday,
      contactsMissingBirthday,
    },
  };
}
