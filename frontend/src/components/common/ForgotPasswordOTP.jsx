import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Mail, Lock, Key, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Inbox } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function ForgotPasswordOTP() {
  const [identifier, setIdentifier] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: request, 2: verify/reset, 3: success
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isEmail = identifier.includes('@');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { identifier });
      setTargetEmail(res.data.targetEmail || '');
      if (res.data.simulatedOtp) {
        setSimulatedOtp(res.data.simulatedOtp);
      }
      setMessage(res.data.message || 'Verification code sent successfully!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request OTP. Make sure email/phone exists.');
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
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      // First verify OTP
      await axios.post(`${API_BASE_URL}/auth/verify-otp`, { identifier, otp });
      // Then reset password
      await axios.post(`${API_BASE_URL}/auth/reset-password`, { identifier, otp, password: newPassword });
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
            <p className="subtitle">Enter your registered Gmail or phone number to receive a verification OTP</p>

            {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}

            <form onSubmit={handleRequestOTP}>
              <div className="form-group">
                <label>Registered Gmail / Phone Number</label>
                <div className="input-icon-wrapper">
                  {isEmail ? <Mail size={18} /> : <Phone size={18} />}
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your Gmail (e.g. name@gmail.com)"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? 'Sending OTP to Gmail...' : 'Send OTP to Gmail'}
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
            <h1>Enter Gmail OTP</h1>
            <p className="subtitle">
              {targetEmail ? (
                <>We sent a 6-digit verification code to <strong>{targetEmail}</strong>. Please check your inbox.</>
              ) : (
                <>Enter the verification code sent to your registered account.</>
              )}
            </p>

            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#818cf8'
            }}>
              <Inbox size={20} />
              <span>Please check your <strong>Gmail Inbox</strong> (and Spam folder).</span>
            </div>

            {simulatedOtp && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px dashed #10b981',
                padding: '0.65rem',
                borderRadius: '8px',
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                <p style={{ fontSize: '0.8rem', color: '#10b981', margin: 0 }}>
                  🔑 Server Code (Dev Demo): <strong>{simulatedOtp}</strong>
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
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="input-icon-wrapper">
                  <Lock size={18} />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? 'Resetting Password...' : 'Reset & Save Password'}
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
              Use a different Gmail / Phone number
            </button>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <CheckCircle size={56} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h1>Password Updated!</h1>
            <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Your credentials have been successfully updated. You can now log in with your new password.</p>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/login')}>
              Go to Login
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
