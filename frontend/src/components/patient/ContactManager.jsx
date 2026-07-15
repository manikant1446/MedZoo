import { useState, useEffect } from 'react';
import { Users, Shield, Trash2, RefreshCw, Smartphone, Check } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

export default function ContactManager() {
  const { user, updateUser } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/contacts`);
      setContacts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeContact = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/contacts/${id}`);
      fetchContacts();
    } catch (err) {
      console.error(err);
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      let emails = [];
      // Native contact picker attempt
      if (navigator.contacts && typeof navigator.contacts.select === 'function') {
        const props = ['email'];
        const opts = { multiple: true };
        try {
          const selectedContacts = await navigator.contacts.select(props, opts);
          if (selectedContacts && selectedContacts.length > 0) {
            emails = selectedContacts.flatMap(c => c.email || []);
          }
        } catch (err) {
          console.warn('Native picker cancelled or failed, falling back to simulation', err);
        }
      }

      // Fallback mockup list
      if (emails.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        emails = [
          'priya@medzoo.com',
          'rahul@medzoo.com',
          'alex@medzoo.com',
          'john.doe@example.com',
          'test.patient@medzoo.com'
        ];
      }

      const res = await axios.post(`${API_BASE_URL}/contacts/sync`, { emails });
      setSyncMessage(`Successfully synced ${res.data.contactsCount} contacts!`);
      updateUser({ contactsPermissionStatus: 'granted' });
      await fetchContacts();
    } catch (err) {
      console.error(err);
      setSyncMessage('Failed to sync contacts. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const isDenied = user?.contactsPermissionStatus === 'denied';
  const isGranted = user?.contactsPermissionStatus === 'granted';

  return (
    <div className="page animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Trust Network</h1>
          <p>Manage your synced device contacts to discover trusted healthcare specialists</p>
        </div>
        {isGranted && (
          <button className="btn btn-secondary" onClick={triggerSync} disabled={syncing} style={{ border: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Sync Contacts'}
          </button>
        )}
      </div>

      {syncMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: 'var(--accent-success)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Check size={16} /> {syncMessage}
        </div>
      )}

      <div className="grid grid-2">
        {/* Info & Setup Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header">
              <h3><Shield size={18} style={{ marginRight: '0.5rem', color: 'var(--accent-primary)' }} />Trust Network Mechanics</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              MedZoo leverages a <strong>decentralized social trust graph</strong>. Instead of matching you with anonymous reviews, we check if contacts in your address book have visited a doctor.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>1.</div>
                <div style={{ color: 'var(--text-secondary)' }}>You grant contact access permission.</div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>2.</div>
                <div style={{ color: 'var(--text-secondary)' }}>We check which of your contacts are registered users on MedZoo.</div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>3.</div>
                <div style={{ color: 'var(--text-secondary)' }}>When searching doctors, we highlight those recommended by your friends.</div>
              </div>
            </div>
          </div>

          {isDenied ? (
            <div style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Contacts permission is currently disabled. Enable access to unlock trust recommendations.
              </p>
              <button className="btn btn-primary" onClick={triggerSync} disabled={syncing} style={{ width: '100%', justifyContent: 'center' }}>
                <Smartphone size={16} /> Enable & Sync Contacts
              </button>
            </div>
          ) : (
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Smartphone size={20} style={{ color: 'var(--accent-success)' }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Contacts synced successfully. Your trust-based recommendations are active.
              </div>
            </div>
          )}
        </div>

        {/* Contacts List Card */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3><Users size={18} style={{ marginRight: '0.5rem', color: 'var(--accent-primary)' }} />Synced Friends</h3>
            <span className="badge badge-info">{contacts.length} registered</span>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Loading network...</p>
          ) : isDenied ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
              <Users size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.9rem' }}>No contacts loaded. Grant permission to find friends on MedZoo.</p>
            </div>
          ) : contacts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
              <Users size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>No contacts found on MedZoo yet.</p>
              <button className="btn btn-secondary" onClick={triggerSync} disabled={syncing} style={{ border: '1px solid var(--border)' }}>
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> Sync Again
              </button>
            </div>
          ) : (
            <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {contacts.map((c) => (
                <div key={c._id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '0.5rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-full)',
                    background: 'var(--gradient-secondary)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 700, color: 'white', flexShrink: 0
                  }}>
                    {c.contactUserId?.name?.charAt(0) || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.nickname || c.contactUserId?.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.contactUserId?.email}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeContact(c._id)}
                    style={{ color: 'var(--accent-danger)', padding: '0.25rem' }} title="Remove friend connection">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
