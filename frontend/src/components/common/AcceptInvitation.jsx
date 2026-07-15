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
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setAccepting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/invite/accept`, {
        token,
        name,
        password
      });
      // Store token and user to auto login
      localStorage.setItem('medzoo_token', res.data.token);
      localStorage.setItem('medzoo_user', JSON.stringify(res.data));
      window.location.href = '/dashboard'; // force fresh load
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

  if (error) {
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
        <h1>Join the Team</h1>
        <p className="subtitle">
          You are invited to join MedZoo as a <strong>{invitation?.role?.toUpperCase()}</strong> collaborator.
        </p>

        <div style={{
          background: 'rgba(99, 102, 241, 0.05)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-muted)' }}>Registered Phone:</p>
          <p style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📱 {invitation?.phone}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

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

          <button type="submit" className="btn btn-primary btn-lg" disabled={accepting}>
            {accepting ? 'Completing onboarding...' : 'Accept & Register'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
