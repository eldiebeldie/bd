import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { BirthdayContact, ContactSource, RelationshipTag } from '../types/birthday';
import { SHORT_MONTH_NAMES } from '../utils/dateUtils';

interface AddEditModalProps {
  visible: boolean;
  initialContact?: Partial<BirthdayContact> | null;
  onClose: () => void;
  onSave: (contactData: Omit<BirthdayContact, 'id' | 'createdAt'>, existingId?: string) => void;
}

const TAGS: { value: RelationshipTag; label: string }[] = [
  { value: 'family', label: '👨‍👩‍👧 Family' },
  { value: 'friend', label: '🎉 Friend' },
  { value: 'partner', label: '❤️ Partner' },
  { value: 'work', label: '💼 Work' },
  { value: 'other', label: '✨ Other' },
];

export const AddEditModal: React.FC<AddEditModalProps> = ({
  visible,
  initialContact,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthDay, setBirthDay] = useState('15');
  const [birthYear, setBirthYear] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tag, setTag] = useState<RelationshipTag>('friend');
  const [source, setSource] = useState<ContactSource>('manual');
  const [giftIdeas, setGiftIdeas] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialContact) {
      setName(initialContact.name || '');
      setBirthMonth(initialContact.birthMonth || new Date().getMonth() + 1);
      setBirthDay(String(initialContact.birthDay || 1));
      setBirthYear(initialContact.birthYear ? String(initialContact.birthYear) : '');
      setPhone(initialContact.phone || '');
      setEmail(initialContact.email || '');
      setTag(initialContact.tag || 'friend');
      setSource(initialContact.source || 'manual');
      setGiftIdeas(initialContact.giftIdeas || '');
      setNotes(initialContact.notes || '');
      setError('');
    } else {
      const now = new Date();
      setName('');
      setBirthMonth(now.getMonth() + 1);
      setBirthDay(String(now.getDate()));
      setBirthYear('');
      setPhone('');
      setEmail('');
      setTag('friend');
      setSource('manual');
      setGiftIdeas('');
      setNotes('');
      setError('');
    }
  }, [initialContact, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a name.');
      return;
    }
    const dayNum = parseInt(birthDay, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      setError('Please enter a valid day (1 - 31).');
      return;
    }
    let yearNum: number | undefined;
    if (birthYear.trim()) {
      const parsedYear = parseInt(birthYear.trim(), 10);
      if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > new Date().getFullYear()) {
        setError('Please enter a valid 4-digit birth year (or leave blank).');
        return;
      }
      yearNum = parsedYear;
    }

    onSave(
      {
        name: name.trim(),
        birthMonth,
        birthDay: dayNum,
        birthYear: yearNum,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        tag,
        source,
        externalId: initialContact?.externalId,
        giftIdeas: giftIdeas.trim() || undefined,
        notes: notes.trim() || undefined,
        reminderDaysBefore: initialContact?.reminderDaysBefore || [0, 1, 7],
      },
      initialContact?.id
    );
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {initialContact?.id ? 'Edit Birthday' : 'Add Birthday'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Maya Lin"
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Birth Month *</Text>
            <View style={styles.monthGrid}>
              {SHORT_MONTH_NAMES.map((m, idx) => {
                const monthNumber = idx + 1;
                const active = birthMonth === monthNumber;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.monthChip, active && styles.monthChipActive]}
                    onPress={() => setBirthMonth(monthNumber)}
                  >
                    <Text style={[styles.monthChipText, active && styles.monthChipTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Day (1-31) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="15"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={birthDay}
                  onChangeText={setBirthDay}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Birth Year (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1995"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={birthYear}
                  onChangeText={setBirthYear}
                />
              </View>
            </View>

            <Text style={styles.label}>Relationship Tag</Text>
            <View style={styles.tagRow}>
              {TAGS.map((t) => {
                const active = tag === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.tagChip, active && styles.tagChipActive]}
                    onPress={() => setTag(t.value)}
                  >
                    <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1 555-0199"
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#64748B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <Text style={styles.label}>🎁 Gift Ideas</Text>
            <TextInput
              style={styles.input}
              placeholder="Books, coffee maker, concert tickets..."
              placeholderTextColor="#64748B"
              value={giftIdeas}
              onChangeText={setGiftIdeas}
            />

            <Text style={styles.label}>📝 Notes</Text>
            <TextInput
              style={[styles.input, { minHeight: 64 }]}
              placeholder="Favorite cake flavor, restaurant preferences..."
              placeholderTextColor="#64748B"
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Birthday</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '92%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  errorText: {
    color: '#F87171',
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  monthChip: {
    width: '23%',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  monthChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#6366F1',
  },
  monthChipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  monthChipTextActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tagChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#6366F1',
  },
  tagChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tagChipTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#334155',
  },
  cancelBtnText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
