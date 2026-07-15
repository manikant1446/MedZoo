import { useState } from 'react';
import { Users, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

export default function ContactPermissionModal() {
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState('ask'); // 'ask' | 'scanning' | 'synced' | 'error'
  const [loadingText, setLoadingText] = useState('');
  const [syncedCount, setSyncedCount] = useState(0);

  const handleSync = async () => {
    setStatus('scanning');
    setLoadingText('Requesting contacts permission...');
    
    try {
      let emails = [];

      // Check for native browser Contact Picker API support (primarily mobile Chrome/Safari)
      if (navigator.contacts && typeof navigator.contacts.select === 'function') {
        const props = ['email'];
        const opts = { multiple: true };
        try {
          const selectedContacts = await navigator.contacts.select(props, opts);
          if (selectedContacts && selectedContacts.length > 0) {
            emails = selectedContacts.flatMap(c => c.email || []);
          }
        } catch (err) {
          console.warn('Native contact picker error/cancellation:', err);
        }
      }

      // Fallback: If native picker not supported or returned empty list, simulate device scan for demo purposes
      if (emails.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLoadingText('Scanning device address book...');
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Predetermined patient mock accounts to trigger matches in MedZoo database
        emails = [
          'priya@medzoo.com',
          'rahul@medzoo.com',
          'alex@medzoo.com',
          'john.doe@example.com',
          'test.patient@medzoo.com'
        ];
      }

      setLoadingText('Syncing & matching friends on MedZoo...');
      const res = await axios.post(`${API_BASE_URL}/contacts/sync`, { emails });
      
      setSyncedCount(res.data.contactsCount);
      setStatus('synced');
      
      // Update local context
      updateUser({ contactsPermissionStatus: 'granted' });
    } catch (error) {
      console.error('Contact sync error:', error);
      setStatus('error');
    }
  };

  const handleDeny = async () => {
    try {
      await axios.post(`${API_BASE_URL}/contacts/deny`);
      updateUser({ contactsPermissionStatus: 'denied' });
    } catch (error) {
      console.error('Contact deny error:', error);
      updateUser({ contactsPermissionStatus: 'denied' }); // Fallback local update
    }
  };

  if (user?.role !== 'patient' || user?.contactsPermissionStatus !== 'prompt') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(5, 7, 13, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-bright)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '480px',
        padding: '2.5rem 2rem',
        boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
        animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative glow */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, var(--accent-primary-glow) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {status === 'ask' && (
            <>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: 'var(--accent-primary)'
              }}>
                <Users size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Find Your Trusted Friends
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                MedZoo can scan your device contacts to see which of your friends or family have been treated by local doctors. 
                This helps you find recommended specialists based on real social trust.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button onClick={handleSync} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}>
                  <Shield size={18} /> Sync Contacts
                </button>
                <button onClick={handleDeny} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '0.75rem', background: 'transparent', border: '1px solid var(--border)' }}>
                  Not Now
                </button>
              </div>
            </>
          )}

          {status === 'scanning' && (
            <div style={{ padding: '2rem 0' }}>
              <div style={{ position: 'relative', width: '70px', height: '70px', margin: '0 auto 1.5rem' }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--radius-full)',
                  border: '3px solid rgba(99, 102, 241, 0.1)',
                }} />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--radius-full)',
                  border: '3px solid transparent',
                  borderTopColor: 'var(--accent-primary)',
                  animation: 'spin 1s linear infinite'
                }} />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)'
                }}>
                  <Loader2 className="animate-spin" size={24} />
                </div>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Accessing Address Book
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {loadingText}
              </p>
            </div>
          )}

          {status === 'synced' && (
            <>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: 'var(--accent-success)'
              }}>
                <CheckCircle size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Contacts Synced!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                We found <strong>{syncedCount} of your friends</strong> on MedZoo. You will now see trust recommendations while searching for healthcare providers.
              </p>
              <button onClick={() => updateUser({ contactsPermissionStatus: 'granted' })} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                Awesome, Let's Go!
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: 'var(--accent-danger)'
              }}>
                <AlertCircle size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Synchronization Failed
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                Something went wrong while connecting to your device contacts. Please check your browser permission settings.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button onClick={handleSync} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Try Again
                </button>
                <button onClick={handleDeny} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)' }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
