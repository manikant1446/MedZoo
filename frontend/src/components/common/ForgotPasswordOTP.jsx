import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, Key, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function ForgotPasswordOTP() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: request, 2: verify/reset, 3: success
  const [autoOtp, setAutoOtp] = useState(''); // helper to show simulated OTP
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { phone });
      setAutoOtp(res.data.otp); // show simulated OTP for easy testing
      setMessage('Simulated OTP code generated successfully!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request OTP. Make sure phone exists.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      // First verify the OTP
      await axios.post(`${API_BASE_URL}/auth/verify-otp`, { phone, otp });
      // Then trigger reset
      await axios.post(`${API_BASE_URL}/auth/reset-password`, { phone, otp, password: newPassword });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed. Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-in">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.1)',
            color: 'var(--accent-primary)',
            marginBottom: '0.75rem'
          }}>
            <Key size={24} />
          </div>
        </div>

        {step === 1 && (
          <>
            <h1>Reset Password</h1>
            <p className="subtitle">Enter your registered phone number to receive an OTP</p>

            {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}

            <form onSubmit={handleRequestOTP}>
              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-icon-wrapper">
                  <Phone size={18} />
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Enter 10-15 digit phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? 'Requesting OTP...' : 'Send Verification Code'}
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="auth-footer">
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1>Enter Verification Code</h1>
            <p className="subtitle">We generated an OTP for you. Reset your credentials below.</p>

            {autoOtp && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px dashed #10b981',
                padding: '0.75rem',
                borderRadius: '8px',
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                <p style={{ fontSize: '0.8rem', color: '#10b981', margin: 0 }}>
                  🔑 Simulated SMS Received: <strong>{autoOtp}</strong>
                </p>
              </div>
            )}

            {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}
            {message && <div className="success-message" style={{ color: '#10b981', fontSize: '0.85rem', marginBottom: '1rem' }}>{message}</div>}

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>6-Digit OTP Code</label>
                <div className="input-icon-wrapper">
                  <Key size={18} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>New Password</label>
                <div className="input-icon-wrapper">
                  <Lock size={18} />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? 'Resetting Password...' : 'Update Password'}
                <ArrowRight size={18} />
              </button>
            </form>

            <button
              onClick={() => setStep(1)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                marginTop: '1rem',
                cursor: 'pointer',
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            >
              Use a different phone number
            </button>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <CheckCircle size={56} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h1>Password Updated!</h1>
            <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Your credentials have been successfully updated. You can now log in.</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
              Go to Login
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
