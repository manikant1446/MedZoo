import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { colors } from '../../theme/colors';

const STATUS_CONFIG = {
  treated: { label: 'Treated', color: colors.success, bg: colors.successLight },
  completed: { label: 'Completed', color: colors.info, bg: colors.infoLight },
  pending: { label: 'Pending', color: colors.warning, bg: colors.warningLight },
  cancelled: { label: 'Cancelled', color: colors.danger, bg: colors.dangerLight },
};

export default function PatientHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [consultRes, apptRes] = await Promise.all([
        api.get('/consultations/patient').catch(() => ({ data: [] })),
        api.get('/appointments/patient').catch(() => ({ data: [] })),
      ]);
      setConsultations(consultRes.data || []);
      setAppointments(apptRes.data || []);
    } catch (err) {
      // Graceful fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const treatedCount = consultations.filter(
    (c) => c.status === 'treated' || c.status === 'completed'
  ).length;

  const upcomingAppointments = appointments
    .filter((a) => a.status === 'pending' || a.status === 'confirmed')
    .slice(0, 3);

  const recentConsultations = consultations.slice(0, 4);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'Patient';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
        <Text style={styles.loadingText}>Loading your health summary...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accentPrimary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* ── Welcome Banner ── */}
      <View style={styles.welcomeBanner}>
        <View style={styles.welcomeRow}>
          <View style={styles.welcomeLeft}>
            <View style={styles.patientPill}>
              <Ionicons name="pulse" size={11} color={colors.accentSecondary} />
              <Text style={styles.patientPillText}>Patient Portal</Text>
            </View>
            <Text style={styles.greetingText}>{greeting()},</Text>
            <Text style={styles.nameText}>{firstName} 👋</Text>
            <Text style={styles.phoneSubText}>
              <Ionicons name="call" size={11} color={colors.textMuted} /> +91{' '}
              {user?.phone || 'Not linked'}
            </Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Health Stats ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
            <Ionicons name="document-text" size={20} color={colors.accentPrimary} />
          </View>
          <Text style={styles.statValue}>{consultations.length}</Text>
          <Text style={styles.statLabel}>Total Records</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-done-circle" size={20} color={colors.success} />
          </View>
          <Text style={styles.statValue}>{treatedCount}</Text>
          <Text style={styles.statLabel}>Treated</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(6,182,212,0.15)' }]}>
            <Ionicons name="calendar" size={20} color={colors.accentSecondary} />
          </View>
          <Text style={styles.statValue}>{appointments.length}</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>
      </View>

      {/* ── Find Doctors CTA ── */}
      <TouchableOpacity
        style={styles.ctaCard}
        onPress={() => navigation.navigate('DiscoverTab')}
        activeOpacity={0.85}
      >
        <View style={styles.ctaLeft}>
          <View style={styles.ctaIconBg}>
            <Ionicons name="search" size={22} color="#fff" />
          </View>
          <View>
            <Text style={styles.ctaTitle}>Find & Book Doctors</Text>
            <Text style={styles.ctaSub}>
              Discover doctors trusted by your contacts
            </Text>
          </View>
        </View>
        <Ionicons name="arrow-forward-circle" size={26} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>

      {/* ── Upcoming Appointments ── */}
      {upcomingAppointments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AppointmentsTab')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {upcomingAppointments.map((apt) => {
            const sc = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
            return (
              <View key={apt._id} style={styles.apptCard}>
                <View style={styles.apptLeft}>
                  <View style={styles.apptAvatar}>
                    <Text style={styles.apptAvatarText}>
                      {apt.doctorId?.name?.charAt(0) || 'D'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.apptDoctor}>
                      Dr. {apt.doctorId?.name || 'Specialist'}
                    </Text>
                    <Text style={styles.apptMeta}>
                      {apt.doctorId?.specialty || 'General'} •{' '}
                      {new Date(apt.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                    <Text style={styles.apptTime}>⏰ {apt.timeSlot}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: sc.color }]}>
                    {sc.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Recent Consultations ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Consultations</Text>
          <Text style={styles.sectionCount}>{consultations.length} records</Text>
        </View>

        {recentConsultations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="folder-open-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No consultations yet</Text>
            <Text style={styles.emptySub}>
              Book an appointment with a verified doctor to get started.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('DiscoverTab')}
            >
              <Text style={styles.emptyBtnText}>Explore Doctors</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentConsultations.map((c) => {
            const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
            return (
              <View key={c._id} style={styles.consultCard}>
                <View style={styles.consultTop}>
                  <View style={styles.consultAvatar}>
                    <Text style={styles.consultAvatarText}>
                      {c.doctorId?.name?.charAt(0) || 'D'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.consultDoctor}>
                      Dr. {c.doctorId?.name || 'Specialist'}
                    </Text>
                    <Text style={styles.consultMeta}>
                      {c.category} •{' '}
                      {new Date(c.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: sc.color }]}>
                      {sc.label}
                    </Text>
                  </View>
                </View>

                {c.diagnosis ? (
                  <View style={styles.diagBox}>
                    <Text style={styles.diagLabel}>DIAGNOSIS</Text>
                    <Text style={styles.diagText}>{c.diagnosis}</Text>
                  </View>
                ) : null}

                {c.notes ? (
                  <Text style={styles.notesText}>📝 {c.notes}</Text>
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 16, paddingBottom: 36 },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { color: colors.textMuted, fontSize: 13 },

  // Welcome Banner
  welcomeBanner: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeLeft: { flex: 1 },
  patientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6,182,212,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  patientPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentSecondary,
    letterSpacing: 0.5,
  },
  greetingText: { fontSize: 13, color: colors.textSecondary },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  phoneSubText: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.35)',
    marginLeft: 12,
  },
  avatarInitial: { fontSize: 20, fontWeight: '800', color: '#fff' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2, textAlign: 'center' },

  // CTA Card
  ctaCard: {
    backgroundColor: colors.accentPrimary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
    shadowColor: colors.accentPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ctaSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Section
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sectionLink: { fontSize: 12, color: colors.accentSecondary, fontWeight: '600' },
  sectionCount: { fontSize: 12, color: colors.textMuted },

  // Appointment Card
  apptCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  apptLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  apptAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(6,182,212,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptAvatarText: { fontSize: 17, fontWeight: '800', color: colors.accentSecondary },
  apptDoctor: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  apptMeta: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  apptTime: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  // Status Badge
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  // Consultation Card
  consultCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  consultTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  consultAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consultAvatarText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  consultDoctor: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  consultMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  diagBox: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  diagLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  diagText: { fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  notesText: { fontSize: 11, color: colors.textSecondary, marginTop: 8 },

  // Empty State
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  emptyBtn: {
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
