import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { colors } from '../../theme/colors';

const QUICK_ACTIONS = [
  { tab: 'AppointmentsTab', icon: 'calendar-outline', label: 'Appointments', color: colors.accentPrimary },
  { tab: 'ConsultationsTab', icon: 'create-outline', label: 'New Consult', color: colors.accentSecondary },
  { tab: 'ReferralsTab', icon: 'git-branch-outline', label: 'Referrals', color: colors.warning },
  { tab: 'ProfileTab', icon: 'person-circle-outline', label: 'My Profile', color: colors.success },
];

export default function DoctorHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [analyticsRes, apptRes] = await Promise.all([
        api.get('/consultations/analytics').catch(() => ({ data: null })),
        api.get('/appointments/doctor').catch(() => ({ data: [] })),
      ]);
      setAnalytics(analyticsRes.data);
      setRecentAppointments((apptRes.data || []).slice(0, 4));
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

  const totalPatients = analytics?.totalPatients || 0;
  const totalConsultations = analytics?.totalConsultations || 0;
  const treatedCount =
    analytics?.statusBreakdown?.find((s) => s._id === 'treated')?.count || 0;
  const successRate =
    totalConsultations > 0
      ? Math.round((treatedCount / totalConsultations) * 100)
      : 100;

  const pendingCount = recentAppointments.filter((a) => a.status === 'pending').length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchData(); }}
          tintColor={colors.accentPrimary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* ── Doctor Header ── */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeRow}>
              <View style={styles.doctorBadge}>
                <Ionicons name="medkit" size={11} color="#fff" />
                <Text style={styles.doctorBadgeText}>Doctor Panel</Text>
              </View>
              {user?.rating > 0 && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={11} color="#fbbf24" />
                  <Text style={styles.ratingText}>
                    {user.rating.toFixed(1)} ({user?.ratingsCount || 0})
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.greetingText}>{greeting()},</Text>
            <Text style={styles.doctorName}>Dr. {user?.name}</Text>
            <Text style={styles.specialtyText}>
              {user?.specialty || 'General Physician'} •{' '}
              {user?.hospital || 'Clinical Practice'}
            </Text>
          </View>
          <View style={styles.docAvatar}>
            <Text style={styles.docAvatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'D'}
            </Text>
          </View>
        </View>

        {/* Pending alert */}
        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => navigation.navigate('AppointmentsTab')}
          >
            <Ionicons name="notifications" size={14} color={colors.warning} />
            <Text style={styles.alertText}>
              {pendingCount} appointment{pendingCount > 1 ? 's' : ''} awaiting your approval
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.warning} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Quick Actions ── */}
      <View style={styles.quickGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.tab}
            style={styles.quickBtn}
            onPress={() => navigation.navigate(action.tab)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIcon, { backgroundColor: `${action.color}20` }]}>
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={styles.quickLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Stats ── */}
      <Text style={styles.sectionTitle}>Practice Overview</Text>
      {loading ? (
        <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 24 }} />
      ) : (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                <Ionicons name="people" size={20} color={colors.accentPrimary} />
              </View>
              <Text style={styles.statValue}>{totalPatients}</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>

            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="checkmark-done" size={20} color={colors.success} />
              </View>
              <Text style={styles.statValue}>{treatedCount}</Text>
              <Text style={styles.statLabel}>Treated</Text>
            </View>

            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(6,182,212,0.12)' }]}>
                <Ionicons name="trending-up" size={20} color={colors.accentSecondary} />
              </View>
              <Text style={styles.statValue}>{successRate}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
          </View>

          {/* Category Breakdown */}
          {analytics?.categoryBreakdown?.length > 0 && (
            <View style={styles.categoryCard}>
              <Text style={styles.categoryTitle}>Top Specialties Treated</Text>
              {analytics.categoryBreakdown.slice(0, 5).map((cat, idx) => {
                const pct =
                  totalConsultations > 0
                    ? Math.round((cat.count / totalConsultations) * 100)
                    : 0;
                return (
                  <View key={cat._id || idx} style={styles.catRow}>
                    <Text style={styles.catName}>{cat._id || 'General'}</Text>
                    <View style={styles.catBarBg}>
                      <View style={[styles.catBarFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.catCount}>{cat.count}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Recent Appointments */}
          {recentAppointments.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Recent Appointments</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AppointmentsTab')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              {recentAppointments.map((apt) => {
                const isPending = apt.status === 'pending';
                const isCritical = apt.status === 'critical' || apt.isEmergency;
                const statusColor = isCritical
                  ? colors.danger
                  : isPending
                  ? colors.warning
                  : apt.status === 'confirmed'
                  ? colors.success
                  : colors.textMuted;
                return (
                  <View
                    key={apt._id}
                    style={[styles.apptCard, isCritical && styles.criticalBorder]}
                  >
                    <View style={styles.apptAvatar}>
                      <Text style={styles.apptAvatarText}>
                        {apt.patientId?.name?.charAt(0) || 'P'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.apptPatient}>
                        {apt.patientId?.name || 'Patient'}
                      </Text>
                      <Text style={styles.apptMeta}>
                        {new Date(apt.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        • {apt.timeSlot}
                      </Text>
                    </View>
                    <Text style={[styles.apptStatus, { color: statusColor }]}>
                      {(apt.status || 'pending').toUpperCase()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 16, paddingBottom: 36 },

  // Header
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  doctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  doctorBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251,191,36,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: { color: '#fbbf24', fontSize: 11, fontWeight: '700' },
  greetingText: { fontSize: 13, color: colors.textSecondary },
  doctorName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  specialtyText: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  docAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  docAvatarText: { fontSize: 20, fontWeight: '800', color: colors.accentPrimary },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  alertText: { flex: 1, fontSize: 12, color: colors.warning, fontWeight: '600' },

  // Quick Actions
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },

  // Section title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: { fontSize: 12, color: colors.accentSecondary, fontWeight: '600' },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
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
    marginBottom: 8,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2, textAlign: 'center' },

  // Category Card
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  catName: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', width: 90 },
  catBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.bgSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  catBarFill: {
    height: 6,
    backgroundColor: colors.accentPrimary,
    borderRadius: 3,
    minWidth: 4,
  },
  catCount: { fontSize: 12, fontWeight: '700', color: colors.textMuted, width: 28, textAlign: 'right' },

  // Recent appointments
  recentSection: { marginBottom: 10 },
  apptCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  criticalBorder: { borderColor: colors.danger },
  apptAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(6,182,212,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptAvatarText: { fontSize: 15, fontWeight: '800', color: colors.accentSecondary },
  apptPatient: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  apptMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  apptStatus: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
