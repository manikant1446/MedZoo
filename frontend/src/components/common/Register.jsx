import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  Lock,
  User as UserIcon,
  HeartPulse,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Building,
  Award,
  MapPin,
  Clock,
  FileBadge,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GoogleAuthButton from './GoogleAuthButton';

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

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    // Doctor specific fields (Step 2)
    specialty: '',
    customSpecialty: '',
    qualifications: '',
    hospital: '',
    locality: '',
    address: '',
    experience: '',
    registrationNo: '',
    consultationFee: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handlePhoneChange = (e) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm({ ...form, phone: clean });
    if (error) setError('');
  };

  // Validate Step 1 credentials
  const validateStep1 = () => {
    if (!form.name.trim()) {
      setError('Please enter your full name.');
      return false;
    }

    const cleanEmail = form.email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid Email address.');
      return false;
    }

    const cleanPhone = form.phone.trim().replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
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

  // Move from Step 1 to Step 2 (Doctor only)
  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  };

  // Submit complete registration (Patient on Step 1, Doctor on Step 2)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.role === 'patient') {
      if (!validateStep1()) return;
    } else {
      // Validate Doctor Step 2 fields
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

    const cleanPhone = form.phone.trim().replace(/[^0-9]/g, '').slice(-10);
    const cleanEmail = form.email.trim().toLowerCase();
    const finalSpecialty = form.role === 'doctor'
      ? (form.specialty === 'Other' ? form.customSpecialty.trim() : form.specialty)
      : '';

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        password: form.password,
        role: form.role,
        specialty: finalSpecialty,
        hospital: form.hospital.trim(),
        qualifications: form.qualifications.trim(),
        locality: form.locality.trim(),
        address: form.address.trim(),
        experience: Number(form.experience) || 0
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-in">
      <div className="auth-card" style={{ maxWidth: step === 2 ? '560px' : '480px', transition: 'all 0.3s ease' }}>
        
        {/* Step Indicator Header for Doctor */}
        {form.role === 'doctor' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              color: step === 1 ? 'var(--accent-primary)' : 'var(--accent-success)',
              fontWeight: 600, fontSize: '0.8rem'
            }}>
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: step === 1 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                border: step === 1 ? '2px solid var(--accent-primary)' : '2px solid var(--accent-success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem'
              }}>
                {step === 2 ? '✓' : '1'}
              </span>
              Account Details
            </div>
            <div style={{ width: '30px', height: '2px', background: step === 2 ? 'var(--accent-success)' : 'var(--border)' }}></div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              color: step === 2 ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.8rem'
            }}>
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: step === 2 ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-hover)',
                border: step === 2 ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem'
              }}>
                2
              </span>
              Doctor Details
            </div>
          </div>
        )}

        <h1>{step === 1 ? 'Create Account' : 'Doctor Details'}</h1>
        <p className="subtitle">
          {step === 1
            ? 'Join MedZoo — smart healthcare collaboration'
            : 'Provide your clinical qualifications and hospital affiliation'}
        </p>

        {error && <div className="error-message">{error}</div>}

        {/* STEP 1: ACCOUNT CREDENTIALS (ONLY Full Name, Email, Phone, Password, Confirm Password) */}
        {step === 1 && (
          <>
            <GoogleAuthButton role={form.role} onError={(msg) => setError(msg)} />

            <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              <span style={{ padding: '0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>or register with email & phone</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            </div>

            <form onSubmit={form.role === 'doctor' ? handleNextStep : handleSubmit}>
              {/* Role Toggle */}
              <div className="role-selector">
                <div
                  className={`role-option ${form.role === 'patient' ? 'active' : ''}`}
                  onClick={() => { setForm({ ...form, role: 'patient' }); setStep(1); }}
                >
                  <HeartPulse size={24} color={form.role === 'patient' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                  <br /><span>Patient</span>
                </div>
                <div
                  className={`role-option ${form.role === 'doctor' ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, role: 'doctor' })}
                >
                  <Stethoscope size={24} color={form.role === 'doctor' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                  <br /><span>Doctor</span>
                </div>
              </div>

              {/* 1. Full Name */}
              <div className="form-group">
                <label>Full Name <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></label>
                <div className="input-icon-wrapper">
                  <UserIcon />
                  <input
                    type="text"
                    className="form-input"
                    name="name"
                    placeholder="e.g. Dr. Aryan Sharma"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* 2. Email Address */}
              <div className="form-group">
                <label>Email <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></label>
                <div className="input-icon-wrapper">
                  <Mail />
                  <input
                    type="email"
                    className="form-input"
                    name="email"
                    placeholder="example@gmail.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* 3. Phone Number */}
              <div className="form-group">
                <label>Phone Number <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></label>
                <div className="input-icon-wrapper">
                  <Phone />
                  <input
                    type="tel"
                    className="form-input"
                    name="phone"
                    placeholder="Enter 10-digit mobile number"
                    value={form.phone}
                    onChange={handlePhoneChange}
                    required
                    maxLength={10}
                  />
                </div>
              </div>

              {/* 4. Password */}
              <div className="form-group">
                <label>Password <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></label>
                <div className="input-icon-wrapper">
                  <Lock />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input password-input"
                    name="password"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 5. Confirm Password (Requested Feature) */}
              <div className="form-group">
                <label>Confirm Password <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></label>
                <div className="input-icon-wrapper">
                  <Lock />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input password-input"
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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

              {/* Submit / Next Step button */}
              {form.role === 'doctor' ? (
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                  Continue to Doctor Details <ArrowRight size={18} />
                </button>
              ) : (
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                  <ArrowRight size={18} />
                </button>
              )}
            </form>
          </>
        )}

        {/* STEP 2: DOCTOR DETAILS (Specialty, Qualifications, Hospital, Locality, Address, Experience) */}
        {step === 2 && form.role === 'doctor' && (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Specialty Dropdown */}
              <div className="form-group" style={{ margin: 0 }}>
                <label>Specialty <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></label>
                <div className="input-icon-wrapper">
                  <Stethoscope />
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
              </div>

              {/* Custom specialty if 'Other' selected */}
              {form.specialty === 'Other' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Specify Specialty <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    name="customSpecialty"
                    placeholder="e.g. Rheumatologist, Nephrologist"
                    value={form.customSpecialty}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              {/* Qualifications & Experience */}
              <div className="grid grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Qualifications <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></label>
                  <div className="input-icon-wrapper">
                    <Award />
                    <input
                      type="text"
                      className="form-input"
                      name="qualifications"
                      placeholder="e.g. MBBS, MD, MS"
                      value={form.qualifications}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Experience (Years)</label>
                  <div className="input-icon-wrapper">
                    <Clock />
                    <input
                      type="number"
                      min="0"
                      max="60"
                      className="form-input"
                      name="experience"
                      placeholder="e.g. 8"
                      value={form.experience}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Hospital / Clinic Name */}
              <div className="form-group" style={{ margin: 0 }}>
                <label>Hospital / Clinic Name <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></label>
                <div className="input-icon-wrapper">
                  <Building />
                  <input
                    type="text"
                    className="form-input"
                    name="hospital"
                    placeholder="e.g. Apollo Hospital / City Care Clinic"
                    value={form.hospital}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Hospital Locality & City */}
              <div className="form-group" style={{ margin: 0 }}>
                <label>Hospital / Clinic Locality &amp; City</label>
                <div className="input-icon-wrapper">
                  <MapPin />
                  <input
                    type="text"
                    className="form-input"
                    name="locality"
                    placeholder="e.g. Indiranagar, Bengaluru / Sector 62, Noida"
                    value={form.locality}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Full Clinic Address */}
              <div className="form-group" style={{ margin: 0 }}>
                <label>Full Clinic Address</label>
                <div className="input-icon-wrapper">
                  <MapPin />
                  <input
                    type="text"
                    className="form-input"
                    name="address"
                    placeholder="e.g. Suite 201, 100 Feet Rd, Opp. Metro Station"
                    value={form.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Action Buttons: Back + Submit */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                  style={{ gap: '0.4rem', padding: '0.8rem 1.25rem' }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', padding: '0.8rem' }}
                  disabled={loading}
                >
                  {loading ? 'Registering Doctor...' : 'Complete Registration'}
                  <ArrowRight size={18} />
                </button>
              </div>

            </div>
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: '1.25rem' }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
