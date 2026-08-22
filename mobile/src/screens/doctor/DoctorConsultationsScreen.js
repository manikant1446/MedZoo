import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { colors } from '../../theme/colors';

const CATEGORIES = ['Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'General', 'Pediatrics'];

export default function DoctorConsultationsScreen() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Consultation Modal
  const [showModal, setShowModal] = useState(false);
  const [patientPhone, setPatientPhone] = useState('');
  const [patientName, setPatientName] = useState('');
  const [category, setCategory] = useState('General');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const res = await api.get('/consultations/doctor');
      setConsultations(res.data || []);
    } catch (err) {
      console.error('Doctor consultations error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateConsultation = async () => {
    if (!patientPhone.trim()) {
      Alert.alert('Required Field', 'Patient mobile phone number is required.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/consultations', {
        patientPhone: patientPhone.trim(),
        patientName: patientName.trim() || undefined,
        category,
        diagnosis: diagnosis.trim(),
        notes: notes.trim(),
        status: 'treated'
      });

      Alert.alert('Consultation Saved! 🩺', 'Patient record created and marked as treated. This will now show in their contacts\' recommendation feed.');
      setShowModal(false);
      setPatientPhone('');
      setPatientName('');
      setDiagnosis('');
      setNotes('');
      fetchConsultations();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save consultation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header + Add Button */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.pageTitle}>Consultation Records</Text>
          <Text style={styles.pageSubtitle}>{consultations.length} total patient consultations</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchConsultations(); }} tintColor={colors.accentPrimary} />
        }
      >
        {loading ? (
          <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 40 }} />
        ) : consultations.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Consultations Recorded</Text>
            <Text style={styles.emptySub}>Tap "New" above to create your first consultation record.</Text>
          </View>
        ) : (
          consultations.map((c) => (
            <View key={c._id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.patientAvatar}>
                  <Text style={styles.avatarText}>{c.patientId?.name?.charAt(0) || 'P'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{c.patientId?.name || `Patient (${c.patientPhone})`}</Text>
                  <Text style={styles.patientPhone}>📞 {c.patientPhone || c.patientId?.phone}</Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{c.category}</Text>
                </View>
              </View>

              {c.diagnosis ? (
                <View style={styles.diagBox}>
                  <Text style={styles.diagLabel}>Diagnosis:</Text>
                  <Text style={styles.diagText}>{c.diagnosis}</Text>
                </View>
              ) : null}

              {c.notes ? (
                <Text style={styles.notesText}>📝 {c.notes}</Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>
                  📅 {new Date(c.date).toLocaleDateString()}
                </Text>
                <View style={styles.treatedPill}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={styles.treatedPillText}>Treated</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* New Consultation Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Consultation</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Patient Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit number (e.g. 9111111001)"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={patientPhone}
                onChangeText={setPatientPhone}
              />

              <Text style={styles.inputLabel}>Patient Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Auto-registers patient if new"
                placeholderTextColor={colors.textMuted}
                value={patientName}
                onChangeText={setPatientName}
              />

              <Text style={styles.inputLabel}>Specialty / Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, category === cat && styles.catChipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Diagnosis / Treatment Provided</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mild hypertension, prescribed beta blockers"
                placeholderTextColor={colors.textMuted}
                value={diagnosis}
                onChangeText={setDiagnosis}
              />

              <Text style={styles.inputLabel}>Consultation Notes</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Follow-up advice or patient remarks..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity
                style={[styles.submitBtn, saving && styles.btnDisabled]}
                onPress={handleCreateConsultation}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Save & Register Treatment</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  patientAvatar: {
    width: 38,
    height: 38,
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
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  patientPhone: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  categoryBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: colors.accentSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  diagBox: {
    backgroundColor: colors.bgSecondary,
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  diagLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  diagText: {
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
  cardFooter: {
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
  treatedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  treatedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
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
    maxHeight: '90%',
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 5,
  },
  input: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: colors.textPrimary,
    fontSize: 13,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.bgSecondary,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  catChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: colors.accentPrimary,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
