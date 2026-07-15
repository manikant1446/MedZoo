import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, ArrowRight, Eye, EyeOff, AtSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Detect if typed value looks like phone or email
  const isPhone = /^[0-9]/.test(identifier);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-in">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="loginGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#818cf8"/>
                <stop offset="50%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#4f46e5"/>
              </linearGradient>
            </defs>
            <path d="M18 4h12v14h14v12H30v14H18V30H4V18h14V4z" fill="none" stroke="url(#loginGrad)" strokeWidth="2.5" strokeLinejoin="round"/>
            <polyline points="6,24 16,24 19,16 22,32 25,12 28,30 31,24 42,24" fill="none" stroke="url(#loginGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ textAlign: 'center', display: 'block', width: '100%', marginBottom: '1.5rem' }}>Welcome Back</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div className="input-icon-wrapper">
              {isPhone ? <Phone size={18} /> : <AtSign size={18} />}
              <input
                type="text"
                className="form-input"
                placeholder="Email address or mobile number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.4rem' }}>
            <div className="input-icon-wrapper">
              <Lock />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input password-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem', marginBottom: '1.25rem' }}>
          <Link to="/forgot-password" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none' }}>
            Forgotten password?
          </Link>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.25rem 0' }} />

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Link to="/register" className="btn btn-secondary" style={{
            borderColor: 'var(--accent-primary)',
            color: 'var(--accent-primary)',
            background: 'transparent',
            padding: '0.6rem 2rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            textDecoration: 'none',
            borderRadius: 'var(--radius-md)',
            display: 'inline-block',
            textAlign: 'center'
          }}>
            Create new account
          </Link>
        </div>
      </div>
    </div>
  );
}
