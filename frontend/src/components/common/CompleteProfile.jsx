import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, Phone, Lock, Eye, EyeOff, Shield, Stethoscope, ArrowRight, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function CompleteProfile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    password: '',
    confirmPassword: '',
    role: user?.role === 'doctor' ? 'doctor' : 'patient',
    specialty: user?.specialty || '',
    hospital: user?.hospital || '',
    qualifications: user?.qualifications || ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // If user already has a phone, they don't need onboarding
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    if (!form.phone || form.phone.length !== 10 || !/^[6-9]\d{9}$/.test(form.phone)) {
      setError('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
      return;
    }

    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please verify your new password.');
      return;
    }

    if (form.role === 'doctor' && !form.specialty.trim()) {
      setError('Doctors must enter their medical specialty.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/complete-profile`, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
        specialty: form.specialty.trim(),
        hospital: form.hospital.trim(),
        qualifications: form.qualifications.trim()
      });

      // Update auth context state with complete user data
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
      <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
        
        {/* Header with Google user preview */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', position: 'relative', marginBottom: '0.75rem' }}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Google DP"
                style={{ width: '76px', height: '76px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-primary)', boxShadow: 'var(--shadow-glow)' }}
              />
            ) : (
              <div style={{
                width: '76px', height: '76px', borderRadius: '50%',
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
              <Shield size={14} color="white" />
            </div>
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Welcome to MedZoo!
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Signed in with <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Just a few more details to set up your secure medical account.
          </p>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          {/* Account Role Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              I am joining MedZoo as:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'patient' })}
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

          {/* Full Name */}
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

          {/* Phone Number */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Phone size={15} /> Mobile Number <span style={{ color: '#ef4444' }}>*</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(10 digits, used for SMS &amp; Sign in)</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 600
              }}>
                +91
              </span>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={form.phone}
                onChange={handlePhoneChange}
                placeholder="9876543210"
                maxLength={10}
                required
                style={{ flex: 1 }}
              />
            </div>
          </div>

          {/* Doctor-specific fields if doctor chosen */}
          {form.role === 'doctor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.9rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Specialty <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="specialty"
                  className="form-input"
                  value={form.specialty}
                  onChange={handleChange}
                  placeholder="e.g. Cardiologist, General Physician, Pediatrician"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Qualifications</label>
                  <input
                    type="text"
                    name="qualifications"
                    className="form-input"
                    value={form.qualifications}
                    onChange={handleChange}
                    placeholder="MBBS, MD"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Hospital / Clinic</label>
                  <input
                    type="text"
                    name="hospital"
                    className="form-input"
                    value={form.hospital}
                    onChange={handleChange}
                    placeholder="Apollo / City Clinic"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Create Password */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Lock size={15} /> Create Password <span style={{ color: '#ef4444' }}>*</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Min 6 characters)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a strong password"
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

          {/* Confirm Password */}
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
                placeholder="Re-type your password"
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
              <p style={{
                fontSize: '0.75rem',
                margin: '0.35rem 0 0 0',
                color: form.password === form.confirmPassword ? '#10b981' : '#ef4444'
              }}>
                {form.password === form.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Saving Profile...' : (
              <>Complete Account Setup <ArrowRight size={16} /></>
            )}
          </button>
        </form>

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
