import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
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
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '0.75rem' }}>
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
        <h1>Welcome Back</h1>
        <p className="subtitle">Sign in to your MedZoo account</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-icon-wrapper">
              <Mail />
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-icon-wrapper">
              <Lock />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input password-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
