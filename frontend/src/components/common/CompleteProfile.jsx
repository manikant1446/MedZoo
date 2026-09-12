import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  LogOut,
  Building,
  Award,
  Clock,
  MapPin,
  HeartPulse
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const SPECIALTY_OPTIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Orthopedic Surgeon',
  'Pediatrician',
  'Gynecologist & Obstetrician',
  'ENT Specialist',
  'Ophthalmologist',
  'Psychiatrist',
  'Pulmonologist',
  'Gastroenterologist',
  'Endocrinologist',
  'Dentist',
  'Urologist',
  'Oncologist',
  'Other'
];

export default function CompleteProfile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    password: '',
    confirmPassword: '',
    role: user?.role === 'doctor' ? 'doctor' : 'patient',
    specialty: user?.specialty || '',
    customSpecialty: '',
    hospital: user?.hospital || '',
    qualifications: user?.qualifications || '',
    locality: user?.locality || '',
    address: user?.address || '',
    experience: user?.experience || '',
    age: user?.age || '',
    gender: user?.gender || '',
    bloodGroup: user?.bloodGroup || ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // If user already has a phone and profile is complete, redirect to dashboard
  useEffect(() => {
    if (user?.phone && !user?.isProfileIncomplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handlePhoneChange = (e) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm({ ...form, phone: clean });
    if (error) setError('');
  };

  const validateStep1 = () => {
    if (!form.name.trim()) {
      setError('Please provide your full name.');
      return false;
    }

    if (!form.phone || form.phone.length !== 10 || !/^[6-9]\d{9}$/.test(form.phone)) {
      setError('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
      return false;
    }

    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return false;
    }

    return true;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.role === 'patient') {
      if (form.age && (Number(form.age) < 1 || Number(form.age) > 125)) {
        setError('Please enter a valid age between 1 and 125.');
        return;
      }
    } else {
      const finalSpecialty = form.specialty === 'Other' ? form.customSpecialty.trim() : form.specialty;
      if (!finalSpecialty) {
        setError('Please select or specify your medical specialty.');
        return;
      }
      if (!form.hospital.trim()) {
        setError('Please enter your hospital or clinic affiliation name.');
        return;
      }
    }

    const finalSpecialty = form.role === 'doctor'
      ? (form.specialty === 'Other' ? form.customSpecialty.trim() : form.specialty)
      : '';

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/complete-profile`, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
        specialty: finalSpecialty,
        hospital: form.hospital.trim(),
        qualifications: form.qualifications.trim(),
        locality: form.locality.trim(),
        address: form.address.trim(),
        experience: Number(form.experience) || 0,
        age: form.age ? Number(form.age) : null,
        gender: form.gender.trim(),
        bloodGroup: form.bloodGroup.trim()
      });

      updateUser({ ...res.data, isProfileIncomplete: false });
      setSuccess('Account set up successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="auth-page animate-in" style={{ minHeight: 'calc(100vh - 70px)', padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: step === 2 ? '560px' : '520px', width: '100%', padding: '2rem', boxShadow: 'var(--shadow-lg)', transition: 'all 0.3s ease' }}>
        
        {/* Header with Google user avatar & info */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', position: 'relative', marginBottom: '0.75rem' }}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Google DP"
                style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-primary)', boxShadow: 'var(--shadow-glow)' }}
              />
            ) : (
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'var(--gradient-primary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'white',
                fontSize: '1.8rem', fontWeight: 800
              }}>
                {user?.name ? user.name[0].toUpperCase() : 'G'}
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              background: '#4285F4', borderRadius: '50%', padding: '4px',
              border: '2px solid var(--bg-card)', display: 'flex'
            }}>
              <Shield size={13} color="white" />
            </div>
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            {step === 1
              ? 'Welcome to MedZoo!'
              : (form.role === 'doctor' ? 'Doctor Professional Details' : 'Personal & Address Details')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Signed in with <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {step === 1
              ? 'Complete your account credentials to continue'
              : (form.role === 'doctor'
                  ? 'Add your medical qualifications and clinic affiliation'
                  : 'Add your personal information and residential address')}
          </p>
        </div>

        {/* Step indicator for both Patient and Doctor */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            color: step === 1 ? 'var(--accent-primary)' : 'var(--accent-success)',
            fontWeight: 600, fontSize: '0.8rem'
          }}>
            <span style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: step === 1 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              border: step === 1 ? '2px solid var(--accent-primary)' : '2px solid var(--accent-success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem'
            }}>
              {step === 2 ? '✓' : '1'}
            </span>
            Account Setup
          </div>
          <div style={{ width: '28px', height: '2px', background: step === 2 ? 'var(--accent-success)' : 'var(--border)' }}></div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            color: step === 2 ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '0.8rem'
          }}>
            <span style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: step === 2 ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-hover)',
              border: step === 2 ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem'
            }}>
              2
            </span>
            {form.role === 'doctor' ? 'Clinic Details' : 'Personal & Address'}
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem', marginBottom: '1.25rem',
            border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16,185,129,0.1)', color: '#10b981',
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem', marginBottom: '1.25rem',
            border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <CheckCircle size={18} /> {success}
          </div>
        )}

        {/* STEP 1: Basic Information (Without 91 box, with confirmPassword) */}
        {step === 1 && (
          <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Account Role Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                I am joining MedZoo as:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => { setForm({ ...form, role: 'patient' }); setStep(1); }}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: form.role === 'patient' ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                    background: form.role === 'patient' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-card)',
                    color: form.role === 'patient' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <User size={18} /> Patient
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'doctor' })}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: form.role === 'doctor' ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                    background: form.role === 'doctor' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-card)',
                    color: form.role === 'doctor' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <Stethoscope size={18} /> Doctor
                </button>
              </div>
            </div>

            {/* 1. Full Name */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <User size={15} /> Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                required
              />
            </div>

            {/* 2. Mobile Number (Clean input without +91 box) */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <Phone size={15} /> Mobile Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={form.phone}
                onChange={handlePhoneChange}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                required
              />
            </div>

            {/* 3. Create Password */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <Lock size={15} /> Create Password <span style={{ color: '#ef4444' }}>*</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Min 6 characters)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-input"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create password"
                  minLength={6}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* 4. Confirm Password */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <Lock size={15} /> Confirm Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-input"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  minLength={6}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && form.confirmPassword && (
                <div style={{
                  fontSize: '0.75rem',
                  marginTop: '0.35rem',
                  color: form.password === form.confirmPassword ? '#10b981' : '#ef4444'
                }}>
                  {form.password === form.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </div>
              )}
            </div>

            {/* Continue to Step 2 */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem' }}
            >
              {form.role === 'doctor' ? 'Continue to Doctor Details' : 'Continue to Personal Details'} <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: DOCTOR DETAILS (Specialty, Qualifications, Hospital, Locality, Address, Experience) */}
        {step === 2 && form.role === 'doctor' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Specialty Dropdown */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Specialty <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                className="form-select"
                name="specialty"
                value={form.specialty}
                onChange={handleChange}
                required
              >
                <option value="">Select your medical specialty</option>
                {SPECIALTY_OPTIONS.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Custom specialty if 'Other' */}
            {form.specialty === 'Other' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Specify Specialty <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  name="customSpecialty"
                  placeholder="e.g. Pediatric Surgeon, Immunologist"
                  value={form.customSpecialty}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {/* Qualifications & Experience */}
            <div className="grid grid-2" style={{ gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Qualifications <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="qualifications"
                  className="form-input"
                  value={form.qualifications}
                  onChange={handleChange}
                  placeholder="e.g. MBBS, MD, MS"
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  name="experience"
                  className="form-input"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="e.g. 10"
                />
              </div>
            </div>

            {/* Hospital / Clinic Affiliation */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Hospital / Clinic Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="hospital"
                className="form-input"
                value={form.hospital}
                onChange={handleChange}
                placeholder="e.g. Apollo Hospital / City Clinic"
                required
              />
            </div>

            {/* Locality & Address */}
            <div className="grid grid-2" style={{ gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Locality / City</label>
                <input
                  type="text"
                  name="locality"
                  className="form-input"
                  value={form.locality}
                  onChange={handleChange}
                  placeholder="e.g. Indiranagar, Bengaluru"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Clinic Address</label>
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="e.g. 100 Feet Road"
                />
              </div>
            </div>

            {/* Action Buttons: Back + Submit */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary"
                style={{ gap: '0.4rem', padding: '0.85rem 1.25rem' }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', padding: '0.85rem' }}
                disabled={loading}
              >
                {loading ? 'Saving Profile...' : 'Complete Doctor Registration'}
                <ArrowRight size={16} />
              </button>
            </div>

          </form>
        )}

        {/* STEP 2: PATIENT DETAILS (Age, Gender, Blood Group, Locality, Address) */}
        {step === 2 && form.role === 'patient' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Row: Age & Gender */}
            <div className="grid grid-2" style={{ gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  <User size={15} /> Age (Years)
                </label>
                <input
                  type="number"
                  name="age"
                  className="form-input"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="e.g. 28"
                  min="1"
                  max="125"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  <User size={15} /> Gender
                </label>
                <select
                  className="form-select"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Blood Group */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                <HeartPulse size={15} /> Blood Group
              </label>
              <select
                className="form-select"
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
              >
                <option value="">Select Blood Group</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            {/* Locality & Address */}
            <div className="grid grid-2" style={{ gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  <MapPin size={15} /> Locality / City
                </label>
                <input
                  type="text"
                  name="locality"
                  className="form-input"
                  value={form.locality}
                  onChange={handleChange}
                  placeholder="e.g. Whitefield, Bengaluru"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  <MapPin size={15} /> Full Address
                </label>
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Flat/House No, Building, Street"
                />
              </div>
            </div>

            {/* Action Buttons: Back + Submit */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary"
                style={{ gap: '0.4rem', padding: '0.85rem 1.25rem' }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', padding: '0.85rem' }}
                disabled={loading}
              >
                {loading ? 'Saving Profile...' : 'Complete Patient Registration'}
                <ArrowRight size={16} />
              </button>
            </div>

          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex',
              alignItems: 'center', gap: '0.4rem'
            }}
          >
            <LogOut size={14} /> Sign out and use a different account
          </button>
        </div>

      </div>
    </div>
  );
}
