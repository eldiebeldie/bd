import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  BirthdayContact,
  ComputedBirthday,
  RawDeviceContact,
  RelationshipTag,
} from './src/types/birthday';
import { computeBirthdayDetails } from './src/utils/dateUtils';
import { loadBirthdays, saveBirthdays } from './src/services/storageService';
import {
  scheduleAllBirthdayNotifications,
  sendTestReminder,
} from './src/services/notificationService';
import { BirthdayCard } from './src/components/BirthdayCard';
import { AddEditModal } from './src/components/AddEditModal';
import { ContactsSyncModal } from './src/components/ContactsSyncModal';

type FilterTab = 'all' | 'soon' | RelationshipTag;

export default function App() {
  const [contacts, setContacts] = useState<BirthdayContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [addEditVisible, setAddEditVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Partial<BirthdayContact> | null>(null);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const loaded = await loadBirthdays();
      setContacts(loaded);
    })();
  }, []);

  const persistAndSetContacts = async (updated: BirthdayContact[]) => {
    setContacts(updated);
    await saveBirthdays(updated);
  };

  const computedList: ComputedBirthday[] = useMemo(() => {
    const now = new Date();
    return contacts
      .map((c) => computeBirthdayDetails(c, now))
      .sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name));
  }, [contacts]);

  const filteredList = useMemo(() => {
    return computedList.filter((item) => {
      if (activeFilter === 'soon' && item.daysUntil > 30) return false;
      if (
        activeFilter !== 'all' &&
        activeFilter !== 'soon' &&
        item.tag !== activeFilter
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchEmail = item.email?.toLowerCase().includes(q);
        const matchGift = item.giftIdeas?.toLowerCase().includes(q);
        const matchDate = item.formattedDate.toLowerCase().includes(q);
        return Boolean(matchName || matchEmail || matchGift || matchDate);
      }
      return true;
    });
  }, [computedList, activeFilter, searchQuery]);

  const stats = useMemo(() => {
    const todayCount = computedList.filter((c) => c.daysUntil === 0).length;
    const weekCount = computedList.filter((c) => c.daysUntil > 0 && c.daysUntil <= 7).length;
    const monthCount = computedList.filter((c) => c.daysUntil <= 30).length;
    return {
      todayCount,
      weekCount,
      monthCount,
      totalCount: computedList.length,
    };
  }, [computedList]);

  const handleSaveBirthday = async (
    data: Omit<BirthdayContact, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const updated = contacts.map((c) =>
        c.id === existingId ? { ...c, ...data } : c
      );
      await persistAndSetContacts(updated);
      showBanner(`Updated ${data.name}'s birthday.`);
    } else {
      const newContact: BirthdayContact = {
        ...data,
        id: `bday-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [...contacts, newContact];
      await persistAndSetContacts(updated);
      showBanner(`Added ${data.name}'s birthday!`);
    }
  };

  const handleDeleteBirthday = async (id: string) => {
    const target = contacts.find((c) => c.id === id);
    if (Platform.OS === 'web') {
      const updated = contacts.filter((c) => c.id !== id);
      await persistAndSetContacts(updated);
      if (target) showBanner(`Removed ${target.name}.`);
      return;
    }

    Alert.alert(
      'Delete Birthday',
      `Remove ${target?.name || 'this birthday'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = contacts.filter((c) => c.id !== id);
            await persistAndSetContacts(updated);
          },
        },
      ]
    );
  };

  const handleEnableReminders = async () => {
    try {
      const { scheduledCount } = await scheduleAllBirthdayNotifications(contacts);
      await sendTestReminder(computedList[0]?.name || 'your contacts');
      showBanner(
        Platform.OS === 'web'
          ? '🔔 Desktop notifications enabled! Sent a test notification.'
          : `🔔 Scheduled ${scheduledCount} birthday reminders on your device!`
      );
    } catch (err: any) {
      showBanner(`⚠️ ${err?.message || 'Could not enable notifications.'}`);
    }
  };

  const handleAssignMissingBirthday = (raw: RawDeviceContact) => {
    setEditingContact({
      name: raw.name,
      phone: raw.phone,
      email: raw.email,
      photoUri: raw.photoUri,
      source: raw.source,
      externalId: raw.id,
      tag: 'friend',
    });
    setAddEditVisible(true);
  };

  const showBanner = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => {
      setBannerMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const FILTERS: { id: FilterTab; label: string }[] = [
    { id: 'all', label: `All (${computedList.length})` },
    { id: 'soon', label: `Next 30 Days (${stats.monthCount})` },
    { id: 'family', label: '👨‍👩‍👧 Family' },
    { id: 'friend', label: '🎉 Friends' },
    { id: 'partner', label: '❤️ Partner' },
    { id: 'work', label: '💼 Work' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>🎂</Text>
            </View>
            <View>
              <Text style={styles.appTitle}>BD • Birthday Manager</Text>
              <Text style={styles.appSubtitle}>
                iOS • Android • Windows Desktop & Email Contacts Sync
              </Text>
            </View>
          </View>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.syncBtn}
              onPress={() => setSyncModalVisible(true)}
            >
              <Text style={styles.syncBtnText}>🔄 Sync Contacts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.remindBtn}
              onPress={handleEnableReminders}
            >
              <Text style={styles.remindBtnText}>🔔 Reminders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                setEditingContact(null);
                setAddEditVisible(true);
              }}
            >
              <Text style={styles.addBtnText}>+ Add Birthday</Text>
            </TouchableOpacity>
          </View>
        </View>

        {bannerMessage && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{bannerMessage}</Text>
          </View>
        )}

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* KPI Summary Row */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, stats.todayCount > 0 && styles.kpiCardHighlight]}>
              <Text style={styles.kpiValue}>{stats.todayCount}</Text>
              <Text style={styles.kpiLabel}>🎉 Today</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{stats.weekCount}</Text>
              <Text style={styles.kpiLabel}>📅 Next 7 Days</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{stats.monthCount}</Text>
              <Text style={styles.kpiLabel}>🗓️ Next 30 Days</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{stats.totalCount}</Text>
              <Text style={styles.kpiLabel}>👥 Total Tracked</Text>
            </View>
          </View>

          {/* Search & Filter Controls */}
          <View style={styles.controlsBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search by name, month, gift idea, or email..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {FILTERS.map((f) => {
                const active = activeFilter === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setActiveFilter(f.id)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Birthday List */}
          {filteredList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎈</Text>
              <Text style={styles.emptyTitle}>No birthdays match this filter</Text>
              <Text style={styles.emptyDesc}>
                Add a birthday manually or sync your contacts from iOS, Android, Google Contacts,
                Outlook, or vCard (.vcf).
              </Text>
              <View style={styles.emptyActions}>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => {
                    setEditingContact(null);
                    setAddEditVisible(true);
                  }}
                >
                  <Text style={styles.addBtnText}>+ Add Birthday</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.syncBtn}
                  onPress={() => setSyncModalVisible(true)}
                >
                  <Text style={styles.syncBtnText}>🔄 Sync Contacts</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            filteredList.map((item) => (
              <BirthdayCard
                key={item.id}
                item={item}
                onEdit={(contact) => {
                  setEditingContact(contact);
                  setAddEditVisible(true);
                }}
                onDelete={handleDeleteBirthday}
              />
            ))
          )}
        </ScrollView>

        {/* Modals */}
        <AddEditModal
          visible={addEditVisible}
          initialContact={editingContact}
          onClose={() => setAddEditVisible(false)}
          onSave={handleSaveBirthday}
        />

        <ContactsSyncModal
          visible={syncModalVisible}
          existingContacts={contacts}
          onClose={() => setSyncModalVisible(false)}
          onContactsUpdated={persistAndSetContacts}
          onAssignMissingBirthday={handleAssignMissingBirthday}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 16,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 22,
  },
  appTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  appSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  syncBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
  },
  syncBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  remindBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
  },
  remindBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  banner: {
    backgroundColor: 'rgba(79, 70, 229, 0.22)',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  bannerText: {
    color: '#E0E7FF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 48,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiCardHighlight: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  kpiValue: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
  },
  kpiLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  controlsBox: {
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#F8FAFC',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#6366F1',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 12,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyDesc: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 20,
    marginBottom: 18,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
