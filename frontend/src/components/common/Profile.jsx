import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  User,
  Shield,
  ShieldCheck,
  Lock,
  Phone,
  Mail,
  MapPin,
  Building,
  Award,
  Star,
  Upload,
  CheckCircle,
  AlertCircle,
  Key,
  Eye,
  EyeOff,
  Stethoscope,
  ChevronRight,
  ExternalLink,
  Camera,
  Calendar,
  Sparkles
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Built-in SVG avatars representing different roles
const PRESET_AVATARS = [
  {
    name: 'Doctor (Male)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%234f46e5"/><circle cx="50" cy="40" r="22" fill="%23ffd5b4"/><path d="M50,18 C46,18 42,20 40,24 C41,27 45,29 50,29 C55,29 59,27 60,24 C58,20 54,18 50,18 Z" fill="%234b3621"/><path d="M50,45 C50,45 56,38 56,33 C56,32 50,30 50,30 C50,30 44,32 44,33 C44,38 50,45 50,45 Z" fill="%23ff8c69"/><rect x="42" y="32" width="16" height="5" rx="2" fill="%23ffffff"/><path d="M20,90 C20,70 30,62 42,62 L58,62 C70,62 80,70 80,90 Z" fill="%23eef2f6"/><path d="M42,62 L50,85 L58,62 Z" fill="%23ffd5b4"/><path d="M40,62 L50,90 L32,90 Z" fill="%236366f1"/><path d="M60,62 L50,90 L68,90 Z" fill="%236366f1"/><circle cx="50" cy="62" r="8" fill="none" stroke="%2394a3b8" stroke-width="2.5"/><path d="M42,62 L38,68 M58,62 L62,68" stroke="%2394a3b8" stroke-width="2.5"/></svg>'
  },
  {
    name: 'Doctor (Female)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%2306b6d4"/><circle cx="50" cy="40" r="22" fill="%23ffe4e6"/><path d="M26,30 C26,18 36,14 50,14 C64,14 74,18 74,30 C74,42 70,44 70,48 C50,44 50,44 30,48 C30,44 26,42 26,30 Z" fill="%231e293b"/><path d="M50,45 C50,45 56,38 56,33 C56,32 50,30 50,30 C50,30 44,32 44,33 C44,38 50,45 50,45 Z" fill="%23f43f5e"/><rect x="42" y="32" width="16" height="5" rx="2" fill="%23ffffff"/><path d="M20,90 C20,70 30,62 42,62 L58,62 C70,62 80,70 80,90 Z" fill="%23eef2f6"/><path d="M42,62 L50,85 L58,62 Z" fill="%23ffe4e6"/><path d="M40,62 L50,90 L32,90 Z" fill="%230891b2"/><path d="M60,62 L50,90 L68,90 Z" fill="%230891b2"/><circle cx="50" cy="62" r="8" fill="none" stroke="%2394a3b8" stroke-width="2.5"/><path d="M42,62 L38,68 M58,62 L62,68" stroke="%2394a3b8" stroke-width="2.5"/></svg>'
  },
  {
    name: 'Patient (Male)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%2310b981"/><circle cx="50" cy="40" r="22" fill="%23ffe4d6"/><path d="M50,16 C40,16 38,22 38,26 L62,26 C62,22 60,16 50,16 Z" fill="%23f59e0b"/><path d="M20,90 C20,72 32,64 50,64 C68,64 80,72 80,90 Z" fill="%233b82f6"/></svg>'
  },
  {
    name: 'Patient (Female)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23ec4899"/><circle cx="50" cy="40" r="22" fill="%23ffd5c4"/><path d="M28,26 C28,16 38,12 50,12 C62,12 72,16 72,26 C72,36 68,38 68,40 C50,38 50,38 32,40 C32,38 28,36 28,26 Z" fill="%237c2d12"/><path d="M20,90 C20,72 32,64 50,64 C68,64 80,72 80,90 Z" fill="%23f43f5e"/></svg>'
  }
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Active navigation tab: 'home' | 'personal' | 'security' | 'role'
  const [activeTab, setActiveTab] = useState('home');

  // Personal info form state
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    address: user?.address || '',
    locality: user?.locality || '',
    experience: user?.experience || 0,
    hospital: user?.hospital || '',
    specialty: user?.specialty || '',
    qualifications: user?.qualifications || ''
  });

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Personal info feedback
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        avatar: user.avatar || '',
        address: user.address || '',
        locality: user.locality || '',
        experience: user.experience || 0,
        hospital: user.hospital || '',
        specialty: user.specialty || '',
        qualifications: user.qualifications || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: val });
    if (error) setError('');
  };

  const handlePhoneChange = (e) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm({ ...form, phone: clean });
    if (error) setError('');
  };

  const selectPresetAvatar = (url) => {
    setForm({ ...form, avatar: url });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    if (file.size > 200 * 1024) {
      setError('Image file must be under 200 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setForm({ ...form, avatar: event.target.result });
      setError('');
    };
    reader.readAsDataURL(file);
  };

  // Submit personal details
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSuccess('');
    setError('');
    setSaving(true);

    try {
      const res = await axios.put(`${API_BASE_URL}/auth/profile`, {
        ...form,
        email: form.email || null,
        phone: form.phone || null
      });
      updateUser(res.data);
      setSuccess('Profile details saved successfully!');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Submit password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/auth/change-password`, {
        currentPassword: passwordForm.currentPassword || undefined,
        newPassword: passwordForm.newPassword
      });

      setPasswordSuccess(res.data?.message || 'Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  // Navigation tabs configuration inspired by Google Account
  const navTabs = [
    { id: 'home', label: 'Home', icon: Home, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    { id: 'personal', label: 'Personal info', icon: User, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    { id: 'security', label: 'Security & sign-in', icon: ShieldCheck, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
    { id: 'role', label: user?.role === 'doctor' ? 'Clinic & Medical' : 'Health & Account', icon: Stethoscope, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }
  ];

  return (
    <div className="page animate-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      
      {/* Top Banner & Account Hero */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.85rem' }}>
          {form.avatar ? (
            <img
              src={form.avatar}
              alt="Account Avatar"
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--accent-primary)',
                boxShadow: 'var(--shadow-glow)'
              }}
            />
          ) : (
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
              fontWeight: 800,
              color: 'white',
              border: '3px solid var(--border)'
            }}>
              {initials}
            </div>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            title="Change Avatar"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: 'var(--bg-card)',
              border: '2px solid var(--border)',
              borderRadius: '50%',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Camera size={14} />
          </button>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0', letterSpacing: '-0.02em' }}>
          {user?.name || 'MedZoo User'}
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
          {user?.email || user?.phone || 'No email connected'}
        </p>
        <span className="badge badge-primary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem' }}>
          {user?.role} ACCOUNT
        </span>
      </div>

      {/* Main Google Account Layout Grid: Sidebar Tabs + Content Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 260px) 1fr',
        gap: '2rem',
        alignItems: 'start'
      }}>

        {/* Left Sidebar Navigation (Google Account Style) */}
        <aside style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.75rem',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: '90px'
        }}>
          <div style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            fontWeight: 700,
            padding: '0.5rem 0.75rem 0.75rem'
          }}>
            Account Categories
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isActive ? 'var(--surface-hover)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? 'inset 3px 0 0 0 var(--accent-primary)' : 'none'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: tab.bg,
                    color: tab.color,
                    flexShrink: 0
                  }}>
                    <Icon size={16} />
                  </div>
                  <span style={{ flex: 1 }}>{tab.label}</span>
                  {isActive && <ChevronRight size={14} color="var(--accent-primary)" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Content Area */}
        <main style={{ minWidth: 0 }}>
          
          {/* TAB 1: HOME OVERVIEW */}
          {activeTab === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Quick Action Chips (Google Account Style) */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: 'var(--radius-full)', gap: '0.4rem', fontSize: '0.82rem' }}
                >
                  <Key size={14} color="#06b6d4" /> Change Password
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('personal')}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: 'var(--radius-full)', gap: '0.4rem', fontSize: '0.82rem' }}
                >
                  <Phone size={14} color="#10b981" /> Update Phone
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('personal')}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: 'var(--radius-full)', gap: '0.4rem', fontSize: '0.82rem' }}
                >
                  <Camera size={14} color="#3b82f6" /> Profile Photo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('role')}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: 'var(--radius-full)', gap: '0.4rem', fontSize: '0.82rem' }}
                >
                  <Stethoscope size={14} color="#f59e0b" /> Medical Details
                </button>
              </div>

              {/* Security Status Card */}
              <div className="card" style={{
                border: '1px solid rgba(6, 182, 212, 0.3)',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(17, 24, 39, 0.6))',
                cursor: 'pointer'
              }}
              onClick={() => setActiveTab('security')}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: 'rgba(6, 182, 212, 0.15)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: '#06b6d4',
                      flexShrink: 0
                    }}>
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                        Security &amp; Password Protection
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
                        Your medical account is protected. You can update your password or check linked Google sign-in.
                      </p>
                      <span style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        Manage security settings <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Info Summary Card */}
              <div className="card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('personal')}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: '#10b981',
                      flexShrink: 0
                    }}>
                      <User size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                        Personal Information
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Contact info, profile photo, and registered address.
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Name</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.name || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone (Editable)</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: user?.phone ? 'var(--text-primary)' : 'var(--accent-warning)' }}>
                      {user?.phone ? `+91 ${user.phone}` : 'Not added yet'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.email || 'None'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.locality || user?.address || 'Not specified'}</div>
                  </div>
                </div>
              </div>

              {/* Role / Healthcare Summary Card */}
              <div className="card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('role')}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: 'rgba(245, 158, 11, 0.15)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: '#f59e0b',
                      flexShrink: 0
                    }}>
                      <Stethoscope size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                        {user?.role === 'doctor' ? 'Clinic & Specialization' : 'Patient Healthcare Summary'}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {user?.role === 'doctor'
                          ? 'Manage your hospital affiliation, qualifications, and patient care details.'
                          : 'View your patient profile and medical appointment records.'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border)',
                  fontSize: '0.85rem'
                }}>
                  {user?.role === 'doctor' ? (
                    <>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Specialty: </span>
                        <strong>{user?.specialty || 'General'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Hospital: </span>
                        <strong>{user?.hospital || 'Private Clinic'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Experience: </span>
                        <strong>{user?.experience || 0} years</strong>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Platform Role: </span>
                      <strong>Registered Patient</strong>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PERSONAL INFO */}
          {activeTab === 'personal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {success && (
                <div style={{
                  background: 'rgba(16,185,129,0.1)', color: '#10b981',
                  padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem', border: '1px solid rgba(16,185,129,0.2)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <CheckCircle size={18} /> {success}
                </div>
              )}

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                  padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem', border: '1px solid rgba(239,68,68,0.2)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              {/* Photo & Avatar Customization */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Profile Picture
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  A picture helps identify you to doctors and clinic coordinators across MedZoo.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  <div style={{ width: '84px', height: '84px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid var(--border)' }}>
                    {form.avatar ? (
                      <img src={form.avatar} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.5rem' }}>
                        {initials}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', gap: '0.4rem', width: 'fit-content' }}>
                      <Upload size={14} /> Upload Custom Photo
                      <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Supports JPG, PNG or WebP under 200KB.
                    </span>
                  </div>
                </div>

                {/* Preset Avatars */}
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Or select a medical avatar:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '0.5rem', maxWidth: '300px' }}>
                    {PRESET_AVATARS.map((avatar) => (
                      <button
                        key={avatar.name}
                        type="button"
                        onClick={() => selectPresetAvatar(avatar.url)}
                        style={{
                          padding: 0,
                          border: form.avatar === avatar.url ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          background: 'transparent',
                          cursor: 'pointer',
                          aspectRatio: '1',
                          overflow: 'hidden',
                          transition: 'all 0.2s'
                        }}
                        title={avatar.name}
                      >
                        <img src={avatar.url} alt={avatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Basic Details Form */}
              <div className="card">
                <form onSubmit={handleSaveProfile}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Basic Info
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    Personal identification details and contact information.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Full Name */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <User size={14} /> Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="form-input"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Phone & Role */}
                    <div className="grid grid-2">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                          <Phone size={14} /> Phone Number <span style={{ color: 'var(--accent-primary)', fontSize: '0.72rem', fontWeight: 600 }}>(Editable)</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          className="form-input"
                          value={form.phone}
                          onChange={handlePhoneChange}
                          placeholder="Enter 10-digit mobile number"
                          maxLength={10}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                          <Shield size={14} /> Account Role <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>(System Assigned)</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={user?.role?.toUpperCase() || ''}
                          disabled
                          style={{ opacity: 0.6, cursor: 'not-allowed' }}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <Mail size={14} /> Email Address <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>(Used for login &amp; notifications)</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="form-input"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="youremail@example.com"
                      />
                    </div>

                    {/* Address & Locality */}
                    <div className="grid grid-2">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                          <MapPin size={14} /> Locality / Sector
                        </label>
                        <input
                          type="text"
                          name="locality"
                          className="form-input"
                          value={form.locality}
                          onChange={handleChange}
                          placeholder="e.g. Sector 18, Indiranagar"
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                          <MapPin size={14} /> Full Street Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          className="form-input"
                          value={form.address}
                          onChange={handleChange}
                          placeholder="e.g. Flat 302, Green Valley Apartments"
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                      <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: '150px' }}>
                        {saving ? 'Saving changes...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* TAB 3: SECURITY & SIGN-IN (FEATURE REQUESTED) */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Change Password Card */}
              <div className="card" style={{ border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                  <Key size={20} color="var(--accent-primary)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                    Change or Update Password
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  A strong password helps keep your medical files, patient notes, and login details secure.
                </p>

                {passwordSuccess && (
                  <div style={{
                    background: 'rgba(16,185,129,0.1)', color: '#10b981',
                    padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                    fontSize: '0.9rem', marginBottom: '1.25rem',
                    border: '1px solid rgba(16,185,129,0.2)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}>
                    <CheckCircle size={18} /> {passwordSuccess}
                  </div>
                )}

                {passwordError && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                    padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                    fontSize: '0.9rem', marginBottom: '1.25rem',
                    border: '1px solid rgba(239,68,68,0.2)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}>
                    <AlertCircle size={18} /> {passwordError}
                  </div>
                )}

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Current Password (Optional if user created via Google) */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                      <Lock size={14} /> Current Password
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        (Leave blank if setting password for the first time)
                      </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        className="form-input"
                        value={passwordForm.currentPassword}
                        onChange={(e) => {
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                          if (passwordError) setPasswordError('');
                        }}
                        placeholder="Enter current password if already set"
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{
                          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex'
                        }}
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password & Confirm */}
                  <div className="grid grid-2">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <Lock size={14} /> New Password <span style={{ color: '#ef4444' }}>*</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(Min 6 chars)</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          name="newPassword"
                          className="form-input"
                          value={passwordForm.newPassword}
                          onChange={(e) => {
                            setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                            if (passwordError) setPasswordError('');
                          }}
                          placeholder="Choose new password"
                          minLength={6}
                          required
                          style={{ paddingRight: '2.5rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          style={{
                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex'
                          }}
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <Lock size={14} /> Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          className="form-input"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => {
                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                            if (passwordError) setPasswordError('');
                          }}
                          placeholder="Re-type new password"
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
                    </div>
                  </div>

                  {passwordForm.newPassword && passwordForm.confirmPassword && (
                    <div style={{
                      fontSize: '0.78rem',
                      color: passwordForm.newPassword === passwordForm.confirmPassword ? '#10b981' : '#ef4444'
                    }}>
                      {passwordForm.newPassword === passwordForm.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </div>
                  )}

                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={passwordSaving}
                      style={{ minWidth: '160px' }}
                    >
                      {passwordSaving ? 'Updating password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Linked Sign-in Services */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  How you sign in to MedZoo
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Your connected authentication methods and account identity.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  {/* Google Account */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Google Sign-In</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {user?.email || 'Connected with Google'}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      color: '#10b981', background: 'rgba(16, 185, 129, 0.1)',
                      padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-full)'
                    }}>
                      Connected
                    </span>
                  </div>

                  {/* Phone Authentication */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.15)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
                      }}>
                        <Phone size={13} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Mobile Phone Login</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {user?.phone ? `+91 ${user.phone}` : 'No phone linked yet'}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      color: user?.phone ? '#10b981' : '#f59e0b',
                      background: user?.phone ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-full)'
                    }}>
                      {user?.phone ? 'Active' : 'Unset'}
                    </span>
                  </div>

                  {/* Gmail OTP Recovery */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.15)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#ef4444'
                      }}>
                        <Mail size={13} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Gmail OTP Recovery</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          OTPs sent via medzoo.healthcare@gmail.com
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      color: '#10b981', background: 'rgba(16, 185, 129, 0.1)',
                      padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-full)'
                    }}>
                      Enabled
                    </span>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 4: CLINIC & MEDICAL ROLE DETAILS */}
          {activeTab === 'role' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {user?.role === 'doctor' ? (
                <div className="card">
                  <form onSubmit={handleSaveProfile}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Doctor Professional Profile
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                      Patients see these details when discovering specialists and booking clinic appointments.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="grid grid-2">
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                            <Award size={14} /> Medical Specialty
                          </label>
                          <input
                            type="text"
                            name="specialty"
                            className="form-input"
                            value={form.specialty}
                            onChange={handleChange}
                            placeholder="e.g. Cardiologist, Neurologist, General"
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                            <Award size={14} /> Qualifications
                          </label>
                          <input
                            type="text"
                            name="qualifications"
                            className="form-input"
                            value={form.qualifications}
                            onChange={handleChange}
                            placeholder="e.g. MBBS, MD, MS"
                          />
                        </div>
                      </div>

                      <div className="grid grid-2">
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                            <Building size={14} /> Hospital / Clinic Affiliation
                          </label>
                          <input
                            type="text"
                            name="hospital"
                            className="form-input"
                            value={form.hospital}
                            onChange={handleChange}
                            placeholder="e.g. Apollo Hospital / City Care Clinic"
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                            <Star size={14} /> Clinical Experience (Years)
                          </label>
                          <input
                            type="number"
                            name="experience"
                            min="0"
                            className="form-input"
                            value={form.experience}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                          {saving ? 'Saving...' : 'Update Doctor Info'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.15)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
                    }}>
                      <User size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                        Patient Healthcare Account
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                        Access your health records, doctor referrals, and schedule appointments.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                    <div style={{
                      padding: '1rem', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-hover)', border: '1px solid var(--border)'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Specialist Directory</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Find Verified Doctors</div>
                      <button
                        type="button"
                        onClick={() => navigate('/discover')}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', justifyContent: 'center', gap: '0.35rem' }}
                      >
                        Search Doctors <ExternalLink size={12} />
                      </button>
                    </div>

                    <div style={{
                      padding: '1rem', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-hover)', border: '1px solid var(--border)'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Consultations</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>My Appointments</div>
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', justifyContent: 'center', gap: '0.35rem' }}
                      >
                        View Dashboard <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
