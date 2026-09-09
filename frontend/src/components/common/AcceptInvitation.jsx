import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Phone, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accepting, setAccepting] = useState(false);
  const { login } = useAuth(); // or directly sets user using accepted result

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/invite/${token}`);
        setInvitation(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired invitation token');
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    
    if (!invitation?.isExistingUser) {
      if (!name.trim()) return setError('Please enter your full name');
      if (password !== confirmPassword) {
        return setError('Passwords do not match');
      }
      if (password.length < 6) {
        return setError('Password must be at least 6 characters');
      }
    }

    setAccepting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/invite/accept`, {
        token,
        name: invitation?.isExistingUser ? undefined : name,
        password: invitation?.isExistingUser ? undefined : password
      });
      // Store token and user to auto login
      localStorage.setItem('medzoo_token', res.data.token);
      localStorage.setItem('medzoo_user', JSON.stringify(res.data));
      window.location.href = '/appointments'; // direct to appointment manager
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container animate-in">
        <div className="auth-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Verifying invitation link...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="auth-container animate-in">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h1>Invalid Invitation</h1>
          <p className="subtitle" style={{ color: '#ef4444', marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container animate-in">
      <div className="auth-card">
        <h1>Team Invitation</h1>
        <p className="subtitle">
          {invitation?.doctorName ? (
            <>You are invited by <strong>Dr. {invitation.doctorName}</strong> to join the clinic team to handle & manage appointments.</>
          ) : (
            <>You are invited to join MedZoo as a <strong>{invitation?.role?.toUpperCase()}</strong> collaborator to manage appointments.</>
          )}
        </p>

        <div style={{
          background: invitation?.isExistingUser ? 'rgba(16, 185, 129, 0.08)' : 'rgba(99, 102, 241, 0.05)',
          border: `1px solid ${invitation?.isExistingUser ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.15)'}`,
          padding: '0.9rem 1.1rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          {invitation?.isExistingUser ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700, marginBottom: '0.35rem' }}>
                <CheckCircle size={18} /> Existing Account Recognized!
              </div>
              <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)' }}>
                Account Name: <strong>{invitation?.existingUserName}</strong>
              </p>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Phone: <strong>{invitation?.phone}</strong> • No new account needed.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-muted)' }}>Registered Phone Number:</p>
              <p style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📱 {invitation?.phone}
              </p>
            </div>
          )}
        </div>

        {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

        {invitation?.isExistingUser ? (
          <div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Accepting this invitation will connect you with <strong>Dr. {invitation?.doctorName || 'the doctor'}</strong> so you can view all appointments, confirm schedules, handle emergencies, and manage patient visits.
            </p>
            <button 
              type="button" 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleSubmit} 
              disabled={accepting}
            >
              {accepting ? 'Connecting to clinic...' : 'Accept & Start Managing Appointments'}
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-icon-wrapper">
                <User size={18} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Create Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} />
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} />
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={accepting} style={{ width: '100%', justifyContent: 'center' }}>
              {accepting ? 'Completing onboarding...' : 'Accept & Register'}
              <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
