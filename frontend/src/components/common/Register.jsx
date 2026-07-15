import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Mail, Lock, User as UserIcon, HeartPulse, Stethoscope, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    name: '', phone: '', password: '', role: 'patient',
    specialty: '', hospital: '', qualifications: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Strict phone number check
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(form.phone.trim())) {
      setError('Please enter a valid phone number containing only digits (10-15 digits).');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-in">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="subtitle">Join MedZoo — your smart healthcare companion</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="role-selector">
            <div className={`role-option ${form.role === 'patient' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, role: 'patient' })}>
              <HeartPulse size={24} color={form.role === 'patient' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
              <br /><span>Patient</span>
            </div>
            <div className={`role-option ${form.role === 'doctor' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, role: 'doctor' })}>
              <Stethoscope size={24} color={form.role === 'doctor' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
              <br /><span>Doctor</span>
            </div>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <div className="input-icon-wrapper">
              <UserIcon />
              <input type="text" className="form-input" name="name" placeholder="John Doe"
                value={form.name} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Phone Number <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></label>
            <div className="input-icon-wrapper">
              <Phone />
              <input type="tel" className="form-input" name="phone" placeholder="9876543210"
                value={form.phone} onChange={handleChange} required
                pattern="[0-9+\s\-().]{7,15}" title="Enter a valid phone number" />
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              You can add your email later from Profile settings
            </p>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-icon-wrapper">
              <Lock />
              <input type={showPassword ? 'text' : 'password'} className="form-input password-input" name="password" placeholder="Min 6 characters"
                value={form.password} onChange={handleChange} required minLength={6} />
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

          {form.role === 'doctor' && (
            <>
              <div className="form-group">
                <label>Specialty</label>
                <select className="form-select" name="specialty" value={form.specialty} onChange={handleChange} required>
                  <option value="">Select specialty</option>
                  <option>Cardiology</option><option>Dermatology</option>
                  <option>Neurology</option><option>Orthopedics</option>
                  <option>Pediatrics</option><option>General</option>
                  <option>Oncology</option><option>Psychiatry</option>
                </select>
              </div>
              <div className="form-group">
                <label>Hospital / Clinic</label>
                <input type="text" className="form-input" name="hospital" placeholder="Hospital name"
                  value={form.hospital} onChange={handleChange} />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
