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

export default function DoctorReferralsScreen() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await api.get('/referrals');
      setReferrals(res.data || []);
    } catch (err) {
      console.error('Doctor referrals error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/referrals/${id}/status`, { status });
      Alert.alert('Success', `Referral marked as ${status}.`);
      fetchReferrals();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update referral.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Case Referrals</Text>
        <Text style={styles.sub}>Specialist collaboration & incoming transfer cases</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReferrals(); }} tintColor={colors.accentPrimary} />
        }
      >
        {loading ? (
          <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 40 }} />
        ) : referrals.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="git-branch-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Referrals Yet</Text>
            <Text style={styles.emptySub}>Referred cases from peer specialists will appear here.</Text>
          </View>
        ) : (
          referrals.map((r) => (
            <View key={r._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{r.patientId?.name?.charAt(0) || 'P'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{r.patientId?.name || 'Patient'}</Text>
                  <Text style={styles.fromDoc}>
                    Referred by: Dr. {r.fromDoctorId?.name} ({r.fromDoctorId?.specialty})
                  </Text>
                </View>
                <View style={[styles.priorityBadge, r.priority === 'critical' ? styles.priorityCritical : styles.priorityNormal]}>
                  <Text style={[styles.priorityText, r.priority === 'critical' ? { color: colors.danger } : { color: colors.warning }]}>
                    {r.priority}
                  </Text>
                </View>
              </View>

              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Clinical Reason:</Text>
                <Text style={styles.reasonText}>{r.reason}</Text>
              </View>

              {r.notes ? (
                <Text style={styles.notesText}>Notes: {r.notes}</Text>
              ) : null}

              <View style={styles.footerRow}>
                <Text style={styles.dateText}>
                  📅 {new Date(r.createdAt).toLocaleDateString()}
                </Text>
                {r.status === 'pending' ? (
                  <View style={styles.btnGroup}>
                    <TouchableOpacity
                      style={[styles.btnSmall, { backgroundColor: colors.successLight }]}
                      onPress={() => handleUpdateStatus(r._id, 'accepted')}
                    >
                      <Text style={{ color: colors.success, fontSize: 11, fontWeight: '700' }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnSmall, { backgroundColor: colors.dangerLight }]}
                      onPress={() => handleUpdateStatus(r._id, 'declined')}
                    >
                      <Text style={{ color: colors.danger, fontSize: 11, fontWeight: '700' }}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{r.status}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fromDoc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityCritical: {
    backgroundColor: colors.dangerLight,
  },
  priorityNormal: {
    backgroundColor: colors.warningLight,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  reasonBox: {
    backgroundColor: colors.bgSecondary,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  reasonText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  notesText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 8,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  btnSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPill: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
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
    marginTop: 4,
    textAlign: 'center',
  },
});
