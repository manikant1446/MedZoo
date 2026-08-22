import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { colors } from '../../theme/colors';

export default function PatientAppointmentsScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Rating Modal
  const [ratingApt, setRatingApt] = useState(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/patient');
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/appointments/${id}/status`, { status: 'cancelled' });
              Alert.alert('Success', 'Appointment has been cancelled.');
              fetchAppointments();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Could not cancel appointment.');
            }
          }
        }
      ]
    );
  };

  const handleSubmitRating = async () => {
    if (!ratingApt) return;
    setSubmittingRating(true);
    try {
      await api.post(`/appointments/${ratingApt._id}/rate`, { rating: selectedRating });
      Alert.alert('Thank You!', 'Your rating for Dr. ' + ratingApt.doctorId?.name + ' has been saved.');
      setRatingApt(null);
      fetchAppointments();
    } catch (err) {
      Alert.alert('Rating Error', err.response?.data?.message || 'Could not submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'completed': return colors.info;
      case 'critical': return colors.danger;
      case 'cancelled': return colors.danger;
      default: return colors.warning;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAppointments(); }} tintColor={colors.accentPrimary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Appointments</Text>
          <Text style={styles.subtitle}>Scheduled consultations and medical visits</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 40 }} />
        ) : appointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Appointments Booked</Text>
            <Text style={styles.emptySub}>Search for specialists and book your consultation in seconds.</Text>
            <TouchableOpacity
              style={styles.bookCta}
              onPress={() => navigation.navigate('DiscoverTab')}
            >
              <Text style={styles.bookCtaText}>Find Doctors</Text>
            </TouchableOpacity>
          </View>
        ) : (
          appointments.map((apt) => {
            const statusColor = getStatusColor(apt.status);
            const isCompleted = apt.status === 'completed';
            const isPendingOrConfirmed = ['pending', 'confirmed'].includes(apt.status);

            return (
              <View key={apt._id} style={styles.aptCard}>
                <View style={styles.aptCardHeader}>
                  <View style={styles.docAvatar}>
                    <Text style={styles.docAvatarText}>
                      {apt.doctorId?.name?.charAt(0) || 'D'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docName}>Dr. {apt.doctorId?.name}</Text>
                    <Text style={styles.docSpec}>{apt.doctorId?.specialty} • {apt.doctorId?.hospital || 'Clinic'}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{apt.status}</Text>
                  </View>
                </View>

                {/* Date & Time Slot */}
                <View style={styles.detailsBox}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar" size={14} color={colors.accentSecondary} />
                    <Text style={styles.detailText}>
                      {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time" size={14} color={colors.accentSecondary} />
                    <Text style={styles.detailText}>{apt.timeSlot}</Text>
                  </View>
                </View>

                {apt.reason ? (
                  <Text style={styles.reasonText}>
                    <Text style={{ fontWeight: '700', color: colors.textSecondary }}>Reason: </Text>
                    {apt.reason}
                  </Text>
                ) : null}

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                  {isPendingOrConfirmed && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelAppointment(apt._id)}
                    >
                      <Ionicons name="close-circle-outline" size={14} color={colors.danger} />
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  )}

                  {isCompleted && !apt.rating && (
                    <TouchableOpacity
                      style={styles.rateBtn}
                      onPress={() => { setRatingApt(apt); setSelectedRating(5); }}
                    >
                      <Ionicons name="star" size={14} color="#fbbf24" />
                      <Text style={styles.rateBtnText}>Rate Doctor</Text>
                    </TouchableOpacity>
                  )}

                  {apt.rating > 0 && (
                    <View style={styles.ratedBox}>
                      <Ionicons name="star" size={13} color="#fbbf24" />
                      <Text style={styles.ratedText}>Rated: {apt.rating}/5</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Rating Modal */}
      {ratingApt && (
        <Modal visible={!!ratingApt} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.rateModalContent}>
              <Text style={styles.rateModalTitle}>Rate Your Consultation</Text>
              <Text style={styles.rateModalSub}>
                How was your experience with Dr. {ratingApt.doctorId?.name}?
              </Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setSelectedRating(star)}
                    style={{ padding: 6 }}
                  >
                    <Ionicons
                      name={star <= selectedRating ? 'star' : 'star-outline'}
                      size={36}
                      color="#fbbf24"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.rateModalBtns}>
                <TouchableOpacity
                  style={styles.rateSubmitBtn}
                  onPress={handleSubmitRating}
                  disabled={submittingRating}
                >
                  {submittingRating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.rateSubmitText}>Submit Rating</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rateCancelBtn}
                  onPress={() => setRatingApt(null)}
                >
                  <Text style={styles.rateCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  aptCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  docAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docAvatarText: {
    fontSize: 16,
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
    color: colors.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  detailsBox: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: colors.bgSecondary,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  reasonText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.dangerLight,
  },
  cancelBtnText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '700',
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  rateBtnText: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: '700',
  },
  ratedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratedText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  bookCta: {
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookCtaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  rateModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rateModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rateModalSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  rateModalBtns: {
    width: '100%',
    gap: 8,
  },
  rateSubmitBtn: {
    backgroundColor: colors.accentPrimary,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateSubmitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  rateCancelBtn: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateCancelText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
