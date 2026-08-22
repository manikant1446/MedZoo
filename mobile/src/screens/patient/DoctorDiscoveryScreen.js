import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { syncDeviceContacts, getRecommendedDoctors } from '../../services/contactService';
import { colors } from '../../theme/colors';

const SPECIALTIES = ['All', 'Cardiology', 'Neurology', 'Dermatology', 'General', 'Orthopedics'];

export default function DoctorDiscoveryScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [hasContactsSynced, setHasContactsSynced] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Booking Modal
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
    loadData();
  }, [search, selectedSpecialty]);

  const loadData = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedSpecialty !== 'All') params.specialty = selectedSpecialty;

      const [docsRes, recData] = await Promise.all([
        api.get('/doctors', { params }),
        getRecommendedDoctors()
      ]);

      setDoctors(docsRes.data || []);
      setRecommendations(recData.recommendations || []);
      setHasContactsSynced(recData.hasContactsSynced || false);
    } catch (err) {
      console.error('Error loading doctors:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSyncContacts = async () => {
    setSyncing(true);
    const result = await syncDeviceContacts();
    setSyncing(false);

    if (result.success) {
      Alert.alert(
        'Contacts Synced! 🎉',
        `Scanned your address book and matched ${result.contactsCount} contacts on MedZoo. Verified treatment recommendations are now active!`
      );
      loadData();
    } else {
      Alert.alert('Sync Failed', result.error || 'Could not sync contacts.');
    }
  };

  // Fetch slots for booking
  const openBookingModal = (doc) => {
    setBookingDoctor(doc);
    // default to tomorrow or today in YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    setSelectedSlot('');
    setReason('');
    fetchSlots(doc._id, dateStr);
  };

  const fetchSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    setSlotsLoading(true);
    try {
      const res = await api.get(`/appointments/slots/${doctorId}/${date}`);
      setSlots(res.data || []);
    } catch (err) {
      console.error('Slots error:', err);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      Alert.alert('Slot Required', 'Please select a consultation time slot.');
      return;
    }

    setBookingInProgress(true);
    try {
      await api.post('/appointments', {
        doctorId: bookingDoctor._id,
        date: selectedDate,
        timeSlot: selectedSlot,
        reason: reason.trim()
      });

      Alert.alert(
        'Appointment Booked! 📅',
        `Your appointment with Dr. ${bookingDoctor.name} on ${selectedDate} at ${selectedSlot} has been scheduled.`,
        [
          {
            text: 'View Appointments',
            onPress: () => {
              setBookingDoctor(null);
              navigation.navigate('AppointmentsTab');
            }
          },
          {
            text: 'OK',
            onPress: () => setBookingDoctor(null)
          }
        ]
      );
    } catch (err) {
      Alert.alert('Booking Error', err.response?.data?.message || 'Failed to book slot.');
    } finally {
      setBookingInProgress(false);
    }
  };

  const renderRecommendedDoctor = ({ item }) => {
    const doc = item.doctor;
    return (
      <View style={styles.recCard}>
        <View style={styles.recHeaderRow}>
          <View style={styles.avatarPill}>
            <Text style={styles.avatarText}>{doc.name?.charAt(0) || 'D'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.docName}>Dr. {doc.name}</Text>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            </View>
            <Text style={styles.docSpec}>{doc.specialty} • {doc.hospital || 'Private Clinic'}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#fbbf24" />
            <Text style={styles.ratingText}>{doc.rating ? doc.rating.toFixed(1) : '5.0'}</Text>
          </View>
        </View>

        {/* Algorithm Trust Proof Evidence */}
        <View style={styles.trustProofBox}>
          <View style={styles.trustProofTitleRow}>
            <Ionicons name="people" size={14} color={colors.success} />
            <Text style={styles.trustProofTitle}>
              {item.trustedContactsCount} of your contacts treated here:
            </Text>
          </View>
          {item.treatedContacts.map((c, idx) => (
            <View key={idx} style={styles.contactItemRow}>
              <Ionicons name="shield-checkmark" size={13} color={colors.accentSecondary} />
              <Text style={styles.contactProofText}>
                <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{c.contactName}</Text> was treated for{' '}
                <Text style={{ color: colors.accentSecondary }}>{c.category}</Text>
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => openBookingModal(doc)}
        >
          <Ionicons name="calendar-outline" size={16} color="#fff" />
          <Text style={styles.bookBtnText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRegularDoctor = ({ item }) => (
    <View style={styles.docCard}>
      <View style={styles.docCardTop}>
        <View style={styles.avatarPill}>
          <Text style={styles.avatarText}>{item.name?.charAt(0) || 'D'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.docName}>Dr. {item.name}</Text>
          <Text style={styles.docSpec}>{item.specialty} • {item.hospital || 'General Practice'}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>🎓 {item.qualifications || 'MBBS'}</Text>
            {item.experience > 0 && (
              <Text style={styles.metaItem}>💼 {item.experience} yrs</Text>
            )}
            <Text style={styles.metaItem}>⭐ {item.rating ? item.rating.toFixed(1) : '5.0'}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.bookBtnSecondary}
        onPress={() => openBookingModal(item)}
      >
        <Ionicons name="calendar-outline" size={15} color={colors.accentPrimary} />
        <Text style={styles.bookBtnSecondaryText}>Book Appointment</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors, specialty, clinic..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Specialty Filter Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialtyScroll}>
          {SPECIALTIES.map((spec) => (
            <TouchableOpacity
              key={spec}
              style={[
                styles.specChip,
                selectedSpecialty === spec && styles.specChipActive
              ]}
              onPress={() => setSelectedSpecialty(spec)}
            >
              <Text
                style={[
                  styles.specChipText,
                  selectedSpecialty === spec && styles.specChipTextActive
                ]}
              >
                {spec}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.accentPrimary} />
        }
      >
        {/* Contact Sync Algorithm Banner */}
        <View style={styles.syncBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={styles.syncIconBox}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.accentSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.syncTitle}>
                {hasContactsSynced ? 'Contacts Network Active' : 'Find Doctors via Your Contacts'}
              </Text>
              <Text style={styles.syncSub}>
                {hasContactsSynced
                  ? 'Doctors who successfully treated your phone contacts are highlighted below.'
                  : 'Sync contacts to see which specialists have treated your friends & family.'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.syncBtn}
            onPress={handleSyncContacts}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.syncBtnText}>
                {hasContactsSynced ? 'Re-Sync' : 'Sync Now'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* SECTION 1: Algorithm Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={18} color="#fbbf24" />
              <Text style={styles.sectionTitle}>Recommended For You</Text>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{recommendations.length}</Text>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>
              Based on verified treatments from your synced phonebook
            </Text>

            {recommendations.map((item, index) => (
              <View key={`rec-${item.doctor?._id || index}`} style={{ marginBottom: 12 }}>
                {renderRecommendedDoctor({ item })}
              </View>
            ))}
          </View>
        )}

        {/* SECTION 2: All Doctors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medkit-outline" size={18} color={colors.accentPrimary} />
            <Text style={styles.sectionTitle}>
              {selectedSpecialty === 'All' ? 'All Specialists' : `${selectedSpecialty} Doctors`}
            </Text>
            <Text style={styles.docCountText}>({doctors.length})</Text>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 30 }} color={colors.accentPrimary} />
          ) : doctors.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No doctors found matching criteria.</Text>
            </View>
          ) : (
            doctors.map((item) => (
              <View key={item._id} style={{ marginBottom: 10 }}>
                {renderRegularDoctor({ item })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Booking Modal */}
      {bookingDoctor && (
        <Modal
          visible={!!bookingDoctor}
          transparent
          animationType="slide"
          onRequestClose={() => setBookingDoctor(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Book Appointment</Text>
                  <Text style={styles.modalDoc}>Dr. {bookingDoctor.name} ({bookingDoctor.specialty})</Text>
                </View>
                <TouchableOpacity onPress={() => setBookingDoctor(null)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {/* Date Picker Buttons */}
                <Text style={styles.modalLabel}>Select Consultation Date</Text>
                <View style={styles.datePickerRow}>
                  {[0, 1, 2, 3, 4].map((offset) => {
                    const d = new Date();
                    d.setDate(d.getDate() + offset);
                    const iso = d.toISOString().split('T')[0];
                    const dayLabel = offset === 0 ? 'Today' : offset === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' });
                    const isSelected = selectedDate === iso;

                    return (
                      <TouchableOpacity
                        key={iso}
                        style={[styles.dateChip, isSelected && styles.dateChipActive]}
                        onPress={() => {
                          setSelectedDate(iso);
                          fetchSlots(bookingDoctor._id, iso);
                        }}
                      >
                        <Text style={[styles.dateDayText, isSelected && styles.dateDayTextActive]}>{dayLabel}</Text>
                        <Text style={[styles.dateNumText, isSelected && styles.dateNumTextActive]}>{d.getDate()}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Slots */}
                <Text style={[styles.modalLabel, { marginTop: 14 }]}>Select 30-Min Time Slot</Text>
                {slotsLoading ? (
                  <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 16 }} />
                ) : slots.length === 0 ? (
                  <Text style={{ color: colors.textMuted, fontSize: 13, marginVertical: 8 }}>
                    No slots available for this date.
                  </Text>
                ) : (
                  <View style={styles.slotGrid}>
                    {slots.map((s) => (
                      <TouchableOpacity
                        key={s.time}
                        disabled={!s.available}
                        style={[
                          styles.slotChip,
                          !s.available && styles.slotDisabled,
                          selectedSlot === s.time && styles.slotActive
                        ]}
                        onPress={() => setSelectedSlot(s.time)}
                      >
                        <Text
                          style={[
                            styles.slotText,
                            !s.available && styles.slotTextDisabled,
                            selectedSlot === s.time && styles.slotTextActive
                          ]}
                        >
                          {s.time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Reason */}
                <Text style={[styles.modalLabel, { marginTop: 14 }]}>Reason / Symptoms</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="e.g. Chest pain, routine checkup, follow-up..."
                  placeholderTextColor={colors.textMuted}
                  value={reason}
                  onChangeText={setReason}
                />
              </ScrollView>

              {/* Confirm */}
              <TouchableOpacity
                style={[styles.confirmBtn, (!selectedSlot || bookingInProgress) && styles.btnDisabled]}
                disabled={!selectedSlot || bookingInProgress}
                onPress={handleConfirmBooking}
              >
                {bookingInProgress ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    Confirm Booking {selectedSlot ? `(${selectedSlot})` : ''}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  searchContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  specialtyScroll: {
    marginTop: 10,
  },
  specChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.bgSecondary,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specChipActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  specChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  specChipTextActive: {
    color: '#fff',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  syncIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  syncSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: colors.accentSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  badgeCount: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeCountText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
  },
  docCountText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  recCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarPill: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  docSpec: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
  },
  trustProofBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  trustProofTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  trustProofTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  contactProofText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bookBtn: {
    backgroundColor: colors.accentPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  docCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docCardTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  metaItem: {
    fontSize: 11,
    color: colors.textMuted,
  },
  bookBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  bookBtnSecondaryText: {
    color: colors.accentPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalDoc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateChipActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  dateDayText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  dateDayTextActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  dateNumText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  dateNumTextActive: {
    color: '#fff',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotDisabled: {
    opacity: 0.35,
  },
  slotActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  slotText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  slotTextDisabled: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  slotTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  reasonInput: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmBtn: {
    backgroundColor: colors.accentPrimary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
