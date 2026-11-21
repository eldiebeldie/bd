import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { ComputedBirthday, ContactSource, RelationshipTag } from '../types/birthday';
import { getCountdownLabel, getInitials } from '../utils/dateUtils';

interface BirthdayCardProps {
  item: ComputedBirthday;
  onEdit: (item: ComputedBirthday) => void;
  onDelete: (id: string) => void;
}

const SOURCE_LABELS: Record<ContactSource, { label: string; color: string }> = {
  device: { label: '📱 Phone', color: '#38BDF8' },
  google: { label: 'G Google', color: '#F87171' },
  outlook: { label: '📧 Outlook', color: '#60A5FA' },
  vcard: { label: '📇 vCard', color: '#A78BFA' },
  manual: { label: '✏️ Manual', color: '#94A3B8' },
};

const TAG_COLORS: Record<RelationshipTag, { bg: string; text: string; label: string }> = {
  family: { bg: 'rgba(244, 63, 94, 0.16)', text: '#FDA4AF', label: 'Family' },
  friend: { bg: 'rgba(59, 130, 246, 0.16)', text: '#93C5FD', label: 'Friend' },
  work: { bg: 'rgba(16, 185, 129, 0.16)', text: '#6EE7B7', label: 'Work' },
  partner: { bg: 'rgba(236, 72, 153, 0.2)', text: '#F9A8D4', label: 'Partner' },
  other: { bg: 'rgba(148, 163, 184, 0.16)', text: '#CBD5E1', label: 'Other' },
};

export const BirthdayCard: React.FC<BirthdayCardProps> = ({ item, onEdit, onDelete }) => {
  const isToday = item.daysUntil === 0;
  const isSoon = item.daysUntil > 0 && item.daysUntil <= 7;
  const tagStyle = TAG_COLORS[item.tag] || TAG_COLORS.other;
  const sourceInfo = SOURCE_LABELS[item.source] || SOURCE_LABELS.manual;

  const handleSendWhatsAppOrSms = () => {
    const greeting = encodeURIComponent(
      `Happy Birthday ${item.name.split(' ')[0]}! 🎉🎂 Wishing you an amazing year ahead!`
    );
    if (item.phone) {
      const cleanPhone = item.phone.replace(/[^\d+]/g, '');
      const url =
        Platform.OS === 'web'
          ? `https://wa.me/${cleanPhone.replace(/^\+/, '')}?text=${greeting}`
          : `sms:${cleanPhone}?body=${greeting}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Unable to open messaging app', `Phone: ${item.phone}`);
      });
    } else {
      Alert.alert('No Phone Number', `Add a phone number for ${item.name} to send SMS/WhatsApp wishes.`);
    }
  };

  const handleSendEmail = () => {
    if (!item.email) {
      Alert.alert('No Email Address', `Add an email address for ${item.name} to send an email greeting.`);
      return;
    }
    const subject = encodeURIComponent(`Happy Birthday, ${item.name.split(' ')[0]}! 🎂🎉`);
    const body = encodeURIComponent(
      `Hi ${item.name.split(' ')[0]},\n\nWishing you a very Happy Birthday and a wonderful year ahead!\n\nBest,`
    );
    Linking.openURL(`mailto:${item.email}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert('Unable to open email client', `Email: ${item.email}`);
    });
  };

  return (
    <View
      style={[
        styles.card,
        isToday && styles.cardToday,
        isSoon && styles.cardSoon,
      ]}
    >
      <View style={styles.topRow}>
        {/* Avatar Initials */}
        <View
          style={[
            styles.avatar,
            isToday ? styles.avatarToday : isSoon ? styles.avatarSoon : null,
          ]}
        >
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>

        {/* Name & Date details */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.tagBadge, { backgroundColor: tagStyle.bg }]}>
              <Text style={[styles.tagText, { color: tagStyle.text }]}>{tagStyle.label}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.dateText}>📅 {item.formattedDate}</Text>
            {item.turningAge !== undefined && (
              <Text style={styles.ageText}>• Turns {item.turningAge}</Text>
            )}
            <Text style={styles.zodiacText}>
              • {item.zodiacEmoji} {item.zodiacSign}
            </Text>
          </View>

          <View style={styles.sourceRow}>
            <Text style={[styles.sourceBadge, { color: sourceInfo.color }]}>
              {sourceInfo.label}
            </Text>
            {item.phone ? <Text style={styles.contactDetail}>📞 {item.phone}</Text> : null}
            {item.email ? (
              <Text style={styles.contactDetail} numberOfLines={1}>
                ✉️ {item.email}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Countdown Badge */}
        <View
          style={[
            styles.countdownBadge,
            isToday
              ? styles.countdownToday
              : isSoon
              ? styles.countdownSoon
              : styles.countdownNormal,
          ]}
        >
          <Text
            style={[
              styles.countdownText,
              isToday
                ? styles.countdownTextToday
                : isSoon
                ? styles.countdownTextSoon
                : null,
            ]}
          >
            {getCountdownLabel(item.daysUntil)}
          </Text>
        </View>
      </View>

      {/* Gift Ideas & Notes */}
      {(item.giftIdeas || item.notes) && (
        <View style={styles.giftBox}>
          {item.giftIdeas ? (
            <Text style={styles.giftText} numberOfLines={2}>
              🎁 <Text style={styles.giftLabel}>Gift ideas:</Text> {item.giftIdeas}
            </Text>
          ) : null}
          {item.notes ? (
            <Text style={styles.noteText} numberOfLines={1}>
              📝 {item.notes}
            </Text>
          ) : null}
        </View>
      )}

      {/* Quick Actions Footer */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionPrimary]}
          onPress={handleSendWhatsAppOrSms}
        >
          <Text style={styles.actionPrimaryText}>
            {Platform.OS === 'web' ? '💬 WhatsApp' : '💬 Send SMS'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleSendEmail}
        >
          <Text style={styles.actionBtnText}>✉️ Email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onEdit(item)}
        >
          <Text style={styles.actionBtnText}>✏️ Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionDelete]}
          onPress={() => onDelete(item.id)}
        >
          <Text style={styles.actionDeleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardToday: {
    borderColor: '#F59E0B',
    backgroundColor: '#1E2638',
    borderWidth: 1.5,
  },
  cardSoon: {
    borderColor: '#6366F1',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarToday: {
    backgroundColor: '#F59E0B',
  },
  avatarSoon: {
    backgroundColor: '#6366F1',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  dateText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '500',
  },
  ageText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  zodiacText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  sourceBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  contactDetail: {
    color: '#94A3B8',
    fontSize: 12,
  },
  countdownBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownToday: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  countdownSoon: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  countdownNormal: {
    backgroundColor: '#0F172A',
  },
  countdownText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  countdownTextToday: {
    color: '#FBBF24',
  },
  countdownTextSoon: {
    color: '#A5B4FC',
  },
  giftBox: {
    marginTop: 12,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  giftLabel: {
    fontWeight: '700',
    color: '#E2E8F0',
  },
  giftText: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  noteText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  actionPrimary: {
    backgroundColor: '#4F46E5',
  },
  actionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },
  actionDelete: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  actionDeleteText: {
    color: '#F87171',
    fontSize: 12,
  },
});
