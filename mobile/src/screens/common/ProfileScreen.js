import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconBg}>
      <Ionicons name={icon} size={16} color={colors.accentSecondary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'Not set'}</Text>
    </View>
  </View>
);

export default function ProfileScreen() {
  const { user, role, logout, updateProfile } = useAuth();

  // Edit Profile Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hospital, setHospital] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [experience, setExperience] = useState('');

  const openEditModal = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setEmail(user?.email || '');
    setSpecialty(user?.specialty || '');
    setHospital(user?.hospital || '');
    setQualifications(user?.qualifications || '');
    setAddress(user?.address || '');
    setLocality(user?.locality || '');
    setExperience(user?.experience ? String(user.experience) : '');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Name cannot be empty.');
      return;
    }

    if (phone.trim()) {
      const cleanPhone = phone.trim().replace(/[^0-9]/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() ? phone.trim().replace(/[^0-9]/g, '').slice(-10) : undefined,
        email: email.trim() || undefined,
        specialty: role === 'doctor' ? specialty.trim() : undefined,
        hospital: role === 'doctor' ? hospital.trim() : undefined,
        qualifications: role === 'doctor' ? qualifications.trim() : undefined,
        experience: role === 'doctor' && experience ? Number(experience) : undefined,
        address: address.trim(),
        locality: locality.trim(),
      });

      Alert.alert('Profile Updated! 🎉', 'Your profile information has been saved successfully.');
      setIsEditing(false);
    } catch (err) {
      Alert.alert(
        'Update Failed',
        err.response?.data?.message || 'Could not update profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from MedZoo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Header ── */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor:
                  role === 'doctor'
                    ? 'rgba(99,102,241,0.15)'
                    : 'rgba(6,182,212,0.12)',
              },
            ]}
          >
            <Ionicons
              name={role === 'doctor' ? 'medkit' : 'person'}
              size={12}
              color={
                role === 'doctor' ? colors.accentPrimary : colors.accentSecondary
              }
            />
            <Text
              style={[
                styles.roleBadgeText,
                {
                  color:
                    role === 'doctor'
                      ? colors.accentPrimary
                      : colors.accentSecondary,
                },
              ]}
            >
              {role === 'doctor' ? 'DOCTOR' : 'PATIENT'}
            </Text>
          </View>

          {/* Edit Profile CTA Button */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={openEditModal}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ── Account Details ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Account Details</Text>
            <TouchableOpacity onPress={openEditModal}>
              <Text style={styles.cardActionLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <InfoRow
            icon="call-outline"
            label="Mobile Number"
            value={user?.phone ? `+91 ${user.phone}` : null}
          />
          <InfoRow icon="mail-outline" label="Email Address" value={user?.email} />
          {user?.address ? (
            <InfoRow icon="location-outline" label="Address" value={user.address} />
          ) : null}
          {user?.locality ? (
            <InfoRow icon="map-outline" label="City / Locality" value={user.locality} />
          ) : null}
        </View>

        {/* ── Doctor Specific Info ── */}
        {role === 'doctor' && (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Professional Details</Text>
                <TouchableOpacity onPress={openEditModal}>
                  <Text style={styles.cardActionLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <InfoRow
                icon="fitness-outline"
                label="Specialty"
                value={user?.specialty}
              />
              <InfoRow
                icon="business-outline"
                label="Hospital / Clinic"
                value={user?.hospital}
              />
              <InfoRow
                icon="ribbon-outline"
                label="Qualifications"
                value={user?.qualifications}
              />
              {user?.experience ? (
                <InfoRow
                  icon="time-outline"
                  label="Experience"
                  value={`${user.experience} years`}
                />
              ) : null}
            </View>

            {/* Doctor Rating Card */}
            <View style={styles.ratingCard}>
              <View style={styles.ratingLeft}>
                <Text style={styles.ratingValue}>
                  {user?.rating ? user.rating.toFixed(1) : '5.0'}
                </Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name="star"
                      size={14}
                      color={
                        s <= Math.round(user?.rating || 5)
                          ? '#fbbf24'
                          : colors.borderLight
                      }
                    />
                  ))}
                </View>
                <Text style={styles.ratingCount}>
                  {user?.ratingsCount || 0} patient ratings
                </Text>
              </View>
              <Ionicons name="star-half" size={40} color="rgba(251,191,36,0.2)" />
            </View>
          </>
        )}

        {/* ── App Info ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Information</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBg}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.accentSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0 (Production Build)</Text>
            </View>
          </View>
        </View>

        {/* ── Sign Out Button ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>MedZoo • Smart Healthcare Platform</Text>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditing(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <Text style={styles.modalSubtitle}>
                  Update your personal & contact details
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Mobile Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="10-digit phone number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email Address</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Doctor Specific Fields */}
              {role === 'doctor' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Specialty / Field</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. Cardiology, General, Pediatrics"
                      placeholderTextColor={colors.textMuted}
                      value={specialty}
                      onChangeText={setSpecialty}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Hospital / Clinic Name</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. City Hospital"
                      placeholderTextColor={colors.textMuted}
                      value={hospital}
                      onChangeText={setHospital}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Qualifications</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. MBBS, MD, MS"
                      placeholderTextColor={colors.textMuted}
                      value={qualifications}
                      onChangeText={setQualifications}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Years of Experience</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. 8"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={experience}
                      onChangeText={setExperience}
                    />
                  </View>
                </>
              )}

              {/* Address */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Clinic / Residential Address</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Street / Building"
                  placeholderTextColor={colors.textMuted}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              {/* Locality / City */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>City / Locality</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Mumbai, Delhi, Bengaluru"
                  placeholderTextColor={colors.textMuted}
                  value={locality}
                  onChangeText={setLocality}
                />
              </View>

              {/* Save & Cancel Buttons */}
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.btnDisabled]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 16, paddingBottom: 48 },

  // Header
  profileHeader: { alignItems: 'center', marginBottom: 20, paddingTop: 8 },
  avatarLarge: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2.5,
    borderColor: 'rgba(99,102,241,0.4)',
    shadowColor: colors.accentPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: '#fff' },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 8,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },

  // Edit Profile CTA
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 14,
    shadowColor: colors.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editProfileBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardActionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentSecondary,
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },

  // Rating Card
  ratingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingLeft: { gap: 4 },
  ratingValue: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 42,
  },
  starsRow: { flexDirection: 'row', gap: 2 },
  ratingCount: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  // Sign out
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.dangerLight,
    height: 48,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  logoutBtnText: { color: colors.danger, fontSize: 14, fontWeight: '700' },

  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
  },

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  modalSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  modalCloseBtn: { padding: 4 },

  formGroup: { marginBottom: 14 },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },

  modalBtnRow: { gap: 10, marginTop: 10 },
  saveBtn: {
    backgroundColor: colors.accentPrimary,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
});
