import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { colors } from '../../theme/colors';

export default function DoctorAppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'critical'

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/doctor');
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Doctor appointments error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      Alert.alert('Updated', `Appointment status set to ${status}`);
      fetchAppointments();
    } catch (err) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Could not update status.');
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'pending') return apt.status === 'pending';
    if (filter === 'critical') return apt.status === 'critical' || apt.isEmergency;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {['all', 'pending', 'critical'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, filter === tab && styles.tabBtnActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
              {tab.toUpperCase()} ({appointments.filter(a => tab === 'all' ? true : tab === 'pending' ? a.status === 'pending' : a.status === 'critical' || a.isEmergency).length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAppointments(); }} tintColor={colors.accentPrimary} />
        }
      >
        {loading ? (
          <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 40 }} />
        ) : filteredAppointments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No appointments in this category.</Text>
          </View>
        ) : (
          filteredAppointments.map((apt) => {
            const isCritical = apt.status === 'critical' || apt.isEmergency;
            return (
              <View
                key={apt._id}
                style={[
                  styles.card,
                  isCritical && styles.criticalCard
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.patientAvatar}>
                    <Text style={styles.avatarText}>{apt.patientId?.name?.charAt(0) || 'P'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{apt.patientId?.name || 'Unknown Patient'}</Text>
                    <Text style={styles.patientPhone}>📞 {apt.patientId?.phone || apt.patientId?.email || 'N/A'}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: apt.status === 'confirmed' ? colors.successLight : colors.warningLight }]}>
                    <Text style={[styles.statusPillText, { color: apt.status === 'confirmed' ? colors.success : colors.warning }]}>
                      {apt.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.timeBox}>
                  <Text style={styles.timeText}>
                    📅 {new Date(apt.date).toLocaleDateString()} • ⏰ {apt.timeSlot}
                  </Text>
                </View>

                {apt.reason ? (
                  <Text style={styles.reasonText}>
                    <Text style={{ fontWeight: '700', color: colors.textSecondary }}>Reason: </Text>
                    {apt.reason}
                  </Text>
                ) : null}

                {/* Status Action Buttons */}
                <View style={styles.btnRow}>
                  {apt.status === 'pending' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.successLight }]}
                        onPress={() => handleUpdateStatus(apt._id, 'confirmed')}
                      >
                        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                        <Text style={[styles.actionBtnText, { color: colors.success }]}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
                        onPress={() => handleUpdateStatus(apt._id, 'cancelled')}
                      >
                        <Ionicons name="close-circle" size={14} color={colors.danger} />
                        <Text style={[styles.actionBtnText, { color: colors.danger }]}>Decline</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {apt.status === 'confirmed' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
                        onPress={() => handleUpdateStatus(apt._id, 'critical')}
                      >
                        <Ionicons name="alert-circle" size={14} color={colors.danger} />
                        <Text style={[styles.actionBtnText, { color: colors.danger }]}>Mark Critical</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.infoLight }]}
                        onPress={() => handleUpdateStatus(apt._id, 'completed')}
                      >
                        <Ionicons name="checkmark-done" size={14} color={colors.info} />
                        <Text style={[styles.actionBtnText, { color: colors.info }]}>Complete</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {apt.status === 'critical' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.infoLight, flex: 1 }]}
                      onPress={() => handleUpdateStatus(apt._id, 'completed')}
                    >
                      <Ionicons name="checkmark-done" size={14} color={colors.info} />
                      <Text style={[styles.actionBtnText, { color: colors.info }]}>Mark Completed</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.bgSecondary,
  },
  tabBtnActive: {
    backgroundColor: colors.accentPrimary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  criticalCard: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.accentSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  patientPhone: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  timeBox: {
    backgroundColor: colors.bgSecondary,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  reasonText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
});
