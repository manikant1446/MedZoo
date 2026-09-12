import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function GoogleAuthButton({ role = 'patient', onError }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      if (onError) onError('Google did not return credentials. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithGoogle(credentialResponse.credential, role);
      if (res?.isProfileIncomplete) {
        navigate('/complete-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      const msg = err.response?.data?.message || 'Failed to authenticate with Google. Please try again.';
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleClick = () => {
    // If Google GSI button isn't loaded or client_id is in demo mode
    alert("To enable direct Google 1-Tap Sign-In, please add your Google Client ID (from Google Cloud Console) to VITE_GOOGLE_CLIENT_ID in frontend/.env.");
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.75rem 0' }}>
      {loading ? (
        <div style={{ padding: '0.6rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Signing in with Google...
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
              if (onError) onError('Google Sign-In was cancelled or failed.');
            }}
            theme="filled_black"
            shape="pill"
            text="continue_with"
            size="large"
            width="100%"
          />
        </div>
      )}
    </div>
  );
}
