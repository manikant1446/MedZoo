import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Shield, Award, Key, MapPin, Building, Calendar, Star, Upload, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Premium built-in SVG avatars representing different roles
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
  const [form, setForm] = useState({
    name: user?.name || '',
    avatar: user?.avatar || '',
    address: user?.address || '',
    locality: user?.locality || '',
    experience: user?.experience || 0,
    hospital: user?.hospital || ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: val });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSaving(true);

    try {
      const res = await axios.put(`${API_BASE_URL}/auth/profile`, form);
      updateUser(res.data);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="page animate-in" style={{ maxWidth: '900px' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={24} color="var(--accent-primary)" /> Profile Settings
        </h1>
        <p>Manage your account credentials, clinic address details, and avatar</p>
      </div>

      {success && (
        <div style={{
          background: 'rgba(16,185,129,0.1)', color: '#10b981',
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
          fontSize: '0.9rem', marginBottom: '1.5rem',
          border: '1px solid rgba(16,185,129,0.2)',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', color: '#ef4444',
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
          fontSize: '0.9rem', marginBottom: '1.5rem',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="grid grid-3">
        {/* Left Side: Avatar Display & Selectors */}
        <div className="card" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '1.25rem' }}>
            {form.avatar ? (
              <img src={form.avatar} alt="Profile DP" style={{
                width: '100%', height: '100%', borderRadius: 'var(--radius-lg)',
                objectFit: 'cover', border: '3px solid var(--accent-primary)',
                boxShadow: 'var(--shadow-glow)'
              }} />
            ) : (
              <div style={{
                width: '100%', height: '100%', borderRadius: 'var(--radius-lg)',
                background: 'var(--gradient-primary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '2.5rem', fontWeight: 800, color: 'white',
                border: '3px solid var(--border)'
              }}>
                {initials}
              </div>
            )}
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>{user?.name}</h3>
          <span className="badge badge-primary" style={{ textTransform: 'capitalize', marginBottom: '1.5rem' }}>{user?.role}</span>

          {/* Local File Upload */}
          <div style={{ width: '100%', marginBottom: '1.5rem' }}>
            <label className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <Upload size={14} /> Upload Custom Photo
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Max size 200KB (PNG/JPG)</p>
          </div>

          {/* Preset Avatar Selection */}
          <div style={{ width: '100%' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', marginBottom: '0.5rem' }}>
              Or choose medical avatar:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
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
                    width: '100%',
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

        {/* Right Side: Editable Details Form */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Personal Details</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qualifications and role parameters are cryptographically verified and locked</p>
            </div>

            {/* Locked Field: Email & Role */}
            <div className="grid grid-2" style={{ marginBottom: '0.5rem' }}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={14} /> Email Address <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Locked)</span>
                </label>
                <input type="text" className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Shield size={14} /> Platform Role <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Locked)</span>
                </label>
                <input type="text" className="form-input" value={user?.role?.toUpperCase() || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
            </div>

            {/* Editable Field: Full Name */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={14} /> Full Name
              </label>
              <input type="text" className="form-input" name="name" value={form.name} onChange={handleChange} required />
            </div>

            {/* Role-Specific Editable / Locked Fields */}
            {user?.role === 'doctor' && (
              <>
                <div className="grid grid-2" style={{ marginBottom: '0.5rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Award size={14} /> Qualifications <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Locked)</span>
                    </label>
                    <input type="text" className="form-input" value={user?.qualifications || 'MBBS'} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Award size={14} /> Medical Specialty <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Locked)</span>
                    </label>
                    <input type="text" className="form-input" value={user?.specialty || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  </div>
                </div>

                <div className="grid grid-2" style={{ marginBottom: '0.5rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Star size={14} /> Experience (Years)
                    </label>
                    <input type="number" className="form-input" name="experience" min="0" value={form.experience} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building size={14} /> Hospital / Clinic Affiliation
                    </label>
                    <input type="text" className="form-input" name="hospital" value={form.hospital} onChange={handleChange} placeholder="City General Hospital" />
                  </div>
                </div>
              </>
            )}

            {/* Editable Fields: Clinic Address & Locality */}
            <div className="grid grid-2" style={{ marginBottom: '0.5rem' }}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} /> Locality / Sector
                </label>
                <input type="text" className="form-input" name="locality" value={form.locality} onChange={handleChange} placeholder="e.g. Indiranagar" />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} /> Full Clinic/Residence Address
                </label>
                <input type="text" className="form-input" name="address" value={form.address} onChange={handleChange} placeholder="e.g. Flat 101, Parkside Enclave" />
              </div>
            </div>

            {/* Cryptographic info displaying read-only */}
            <div style={{
              background: 'rgba(99,115,146,0.06)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '1rem',
              fontSize: '0.85rem', color: 'var(--text-secondary)',
              marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                <Key size={14} color="var(--accent-primary)" /> Cryptographic Decentralized Identity (DID)
              </div>
              <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem', opacity: 0.85 }}>
                {user?.did || 'Generating DID...'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Wallet Address: {user?.walletAddress ? `${user.walletAddress.slice(0, 10)}...${user.walletAddress.slice(-8)}` : 'N/A'}</span>
                <span>Role Rank: Verified Node</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
              {saving ? 'Saving changes...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
