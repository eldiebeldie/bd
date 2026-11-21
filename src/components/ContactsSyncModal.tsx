import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BirthdayContact, RawDeviceContact, SyncResult } from '../types/birthday';
import {
  syncDeviceContacts,
  syncGoogleContacts,
  syncOutlookContacts,
} from '../services/contactsService';
import { exportToVCard, parseVCardContent } from '../utils/vcardParser';

interface ContactsSyncModalProps {
  visible: boolean;
  existingContacts: BirthdayContact[];
  onClose: () => void;
  onContactsUpdated: (contacts: BirthdayContact[]) => void;
  onAssignMissingBirthday: (rawContact: RawDeviceContact) => void;
}

const SAMPLE_VCARD = `BEGIN:VCARD
VERSION:3.0
FN:Liam O'Connor
BDAY:1994-11-28
TEL;TYPE=CELL:+1 555-0188
EMAIL:liam.oconnor@gmail.com
NOTE:Loves Irish whiskey and sci-fi novels
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Elena Rostova
BDAY:1996-12-04
TEL;TYPE=CELL:+1 555-0134
EMAIL:elena.r@outlook.com
NOTE:Watercolor painting kit
END:VCARD`;

export const ContactsSyncModal: React.FC<ContactsSyncModalProps> = ({
  visible,
  existingContacts,
  onClose,
  onContactsUpdated,
  onAssignMissingBirthday,
}) => {
  const [activeTab, setActiveTab] = useState<'device' | 'vcard' | 'cloud'>('device');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [missingBdayList, setMissingBdayList] = useState<RawDeviceContact[]>([]);

  // vCard state
  const [vcardInput, setVcardInput] = useState('');
  const [exportedVcard, setExportedVcard] = useState('');

  // Cloud OAuth token state
  const [googleToken, setGoogleToken] = useState('');
  const [outlookToken, setOutlookToken] = useState('');

  const applySyncOutcome = (contacts: BirthdayContact[], result: SyncResult, sourceName: string) => {
    onContactsUpdated(contacts);
    setStatusMessage(
      `✅ ${sourceName}: Imported ${result.imported} new, updated ${result.updated} existing (${result.skippedWithoutBirthday} had no birthday set).`
    );
    if (result.contactsMissingBirthday?.length) {
      setMissingBdayList(result.contactsMissingBirthday);
    }
  };

  const handleDeviceSync = async () => {
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const { contacts, result } = await syncDeviceContacts(existingContacts);
      applySyncOutcome(contacts, result, 'Phone Contacts');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not sync device contacts.');
    } finally {
      setLoading(false);
    }
  };

  const handleVCardImport = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    if (!vcardInput.trim()) {
      setErrorMessage('Paste vCard (.vcf) content below or tap "Load Sample vCard" first.');
      return;
    }
    const { contacts, result } = parseVCardContent(vcardInput, existingContacts);
    applySyncOutcome(contacts, result, 'vCard (.vcf) Import');
    setVcardInput('');
  };

  const handleExportVCard = () => {
    const vcf = exportToVCard(existingContacts);
    setExportedVcard(vcf);
    setStatusMessage(`📤 Generated vCard (.vcf) export for ${existingContacts.length} birthdays.`);
  };

  const handleGoogleSync = async () => {
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const { contacts, result } = await syncGoogleContacts(googleToken, existingContacts);
      applySyncOutcome(contacts, result, 'Google Contacts');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sync Google Contacts.');
    } finally {
      setLoading(false);
    }
  };

  const handleOutlookSync = async () => {
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const { contacts, result } = await syncOutlookContacts(outlookToken, existingContacts);
      applySyncOutcome(contacts, result, 'Outlook Contacts');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sync Microsoft Outlook Contacts.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🔄 Contacts & Birthday Sync Hub</Text>
              <Text style={styles.subtitle}>
                Sync with iOS, Android, Google Contacts, Outlook, or vCard (.vcf)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'device' && styles.tabActive]}
              onPress={() => setActiveTab('device')}
            >
              <Text style={[styles.tabText, activeTab === 'device' && styles.tabTextActive]}>
                📱 iOS & Android
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'vcard' && styles.tabActive]}
              onPress={() => setActiveTab('vcard')}
            >
              <Text style={[styles.tabText, activeTab === 'vcard' && styles.tabTextActive]}>
                📇 vCard (.vcf)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'cloud' && styles.tabActive]}
              onPress={() => setActiveTab('cloud')}
            >
              <Text style={[styles.tabText, activeTab === 'cloud' && styles.tabTextActive]}>
                ☁️ Google / Outlook
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {statusMessage && <Text style={styles.successBox}>{statusMessage}</Text>}
            {errorMessage && <Text style={styles.errorBox}>⚠️ {errorMessage}</Text>}

            {/* TAB 1: Native iOS & Android Device Contacts */}
            {activeTab === 'device' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📱 Native iOS & Android Address Book</Text>
                <Text style={styles.sectionDesc}>
                  On iPhone and Android (via Expo Go or native build), BD reads your phone contacts
                  using <Text style={styles.codeInline}>expo-contacts</Text> and automatically
                  imports everyone with a birthday saved in their contact card.
                </Text>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleDeviceSync}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      🔄 Sync iOS / Android Phone Contacts Now
                    </Text>
                  )}
                </TouchableOpacity>

                {Platform.OS === 'web' && (
                  <View style={styles.tipBox}>
                    <Text style={styles.tipText}>
                      💡 You are currently running on Desktop/Web. To test phone contact sync on
                      your iPhone or Android, run <Text style={styles.codeInline}>npm start</Text>{' '}
                      and scan the QR code with Expo Go! On Desktop, use the{' '}
                      <Text style={styles.codeInline}>📇 vCard (.vcf)</Text> or{' '}
                      <Text style={styles.codeInline}>☁️ Google / Outlook</Text> tabs above.
                    </Text>
                  </View>
                )}

                {missingBdayList.length > 0 && (
                  <View style={styles.missingSection}>
                    <Text style={styles.missingTitle}>
                      Contacts without a birthday set ({missingBdayList.length})
                    </Text>
                    <Text style={styles.sectionDesc}>
                      Tap any contact below to quickly add their birthday:
                    </Text>
                    {missingBdayList.slice(0, 15).map((raw) => (
                      <View key={raw.id} style={styles.missingRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.missingName}>{raw.name}</Text>
                          <Text style={styles.missingMeta}>
                            {[raw.phone, raw.email].filter(Boolean).join(' • ') || 'No phone/email'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.assignBtn}
                          onPress={() => {
                            onClose();
                            onAssignMissingBirthday(raw);
                          }}
                        >
                          <Text style={styles.assignBtnText}>+ Set Birthday</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* TAB 2: vCard (.vcf) Import / Export (Works on Desktop + Mobile) */}
            {activeTab === 'vcard' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📇 Import / Export vCard (.vcf) Contacts
                </Text>
                <Text style={styles.sectionDesc}>
                  Works everywhere (Windows Desktop, iOS, Android). Export your contacts as a{' '}
                  <Text style={styles.codeInline}>.vcf</Text> (vCard) from Google Contacts, Apple
                  iCloud, or Outlook and paste them below to import all birthdays instantly.
                </Text>

                <View style={styles.btnGroup}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => setVcardInput(SAMPLE_VCARD)}
                  >
                    <Text style={styles.secondaryBtnText}>✨ Load Sample vCard</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={handleExportVCard}
                  >
                    <Text style={styles.secondaryBtnText}>📤 Export All to vCard</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.textArea}
                  placeholder="Paste BEGIN:VCARD ... END:VCARD text here..."
                  placeholderTextColor="#64748B"
                  multiline
                  value={vcardInput}
                  onChangeText={setVcardInput}
                />

                <TouchableOpacity style={styles.primaryBtn} onPress={handleVCardImport}>
                  <Text style={styles.primaryBtnText}>📥 Import Birthdays from vCard</Text>
                </TouchableOpacity>

                {exportedVcard ? (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.label}>Exported vCard (.vcf) Output:</Text>
                    <TextInput
                      style={[styles.textArea, { minHeight: 110 }]}
                      multiline
                      editable={false}
                      value={exportedVcard}
                    />
                  </View>
                ) : null}
              </View>
            )}

            {/* TAB 3: Google Contacts & Microsoft Outlook API Sync */}
            {activeTab === 'cloud' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>☁️ Google Contacts (People API)</Text>
                <Text style={styles.sectionDesc}>
                  Sync directly with Google Contacts using an OAuth 2.0 Bearer token with{' '}
                  <Text style={styles.codeInline}>contacts.readonly</Text> scope.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Paste Google OAuth Access Token (ya29....)"
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
                  value={googleToken}
                  onChangeText={setGoogleToken}
                />
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleGoogleSync}
                  disabled={loading}
                >
                  <Text style={styles.primaryBtnText}>G Sync Google Contacts</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>📧 Microsoft Outlook / 365 (Graph API)</Text>
                <Text style={styles.sectionDesc}>
                  Sync directly with Outlook / Microsoft 365 using a Microsoft Graph token with{' '}
                  <Text style={styles.codeInline}>Contacts.Read</Text> permission.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Paste Microsoft Graph Access Token"
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
                  value={outlookToken}
                  onChangeText={setOutlookToken}
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: '#0284C7' }]}
                  onPress={handleOutlookSync}
                  disabled={loading}
                >
                  <Text style={styles.primaryBtnText}>📧 Sync Outlook Contacts</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
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
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#0F172A',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366F1',
    backgroundColor: '#1E293B',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#F8FAFC',
  },
  body: {
    padding: 20,
  },
  section: {
    gap: 12,
    paddingBottom: 20,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
  },
  codeInline: {
    color: '#A5B4FC',
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 13,
    minHeight: 130,
    textAlignVertical: 'top',
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: '#10B981',
    borderWidth: 1,
    color: '#6EE7B7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderColor: '#EF4444',
    borderWidth: 1,
    color: '#FCA5A5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    fontSize: 13,
  },
  tipBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tipText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  missingSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
    gap: 8,
  },
  missingTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  missingName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  missingMeta: {
    color: '#94A3B8',
    fontSize: 12,
  },
  assignBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  assignBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 10,
  },
});
