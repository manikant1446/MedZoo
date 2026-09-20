import { useState, useEffect, useRef } from 'react';
import { X, Download, QrCode, Copy, Check, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../../contexts/AuthContext';

export default function ClinicQRCode({ isOpen, onClose }) {
  const { user } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef(null);

  // Build the public profile URL
  const baseUrl = window.location.origin;
  const profileUrl = `${baseUrl}/discover?doctor=${user?._id}`;

  useEffect(() => {
    if (!isOpen || !user?._id) return;
    setGenerating(true);

    QRCode.toDataURL(profileUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    }).then(url => {
      setQrDataUrl(url);
      setGenerating(false);
    }).catch(err => {
      console.error('QR generation failed:', err);
      setGenerating(false);
    });
  }, [isOpen, user?._id, profileUrl]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `Dr_${user?.name?.replace(/\s+/g, '_') || 'Clinic'}_QR.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      <div className="card" style={{
        width: '100%', maxWidth: 420,
        animation: 'fadeIn 0.3s ease-out',
        textAlign: 'center',
        padding: '2rem'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <QrCode size={20} color="#fff" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>My Clinic QR Code</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Share with patients</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            padding: '4px', borderRadius: '0.25rem', transition: 'color 0.15s'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* QR Code Display */}
        <div style={{
          background: '#ffffff',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.25rem',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)'
        }}>
          {generating ? (
            <div style={{
              width: 200, height: 200, margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#888'
            }}>
              <QrCode size={48} style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Clinic QR Code"
              style={{
                width: 200, height: 200, margin: '0 auto', display: 'block',
                borderRadius: '0.5rem'
              }}
              ref={canvasRef}
            />
          ) : (
            <div style={{ width: 200, height: 200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
              <p>Failed to generate</p>
            </div>
          )}

          {/* Doctor Info Below QR */}
          <div style={{ marginTop: '1rem' }}>
            <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' }}>
              Dr. {user?.name || 'Doctor'}
            </p>
            {user?.specialization && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                {user.specialization}
              </p>
            )}
          </div>
        </div>

        {/* Info Text */}
        <p style={{
          fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1.25rem',
          lineHeight: 1.5
        }}>
          Patients can scan this QR code to instantly find your profile and book an appointment on MedZoo.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={!qrDataUrl}
            style={{ flex: 1, justifyContent: 'center', gap: '0.4rem' }}
          >
            <Download size={16} /> Download
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleCopyLink}
            style={{ flex: 1, justifyContent: 'center', gap: '0.4rem' }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Profile Link Preview */}
        <div style={{
          marginTop: '1rem', padding: '0.6rem 0.75rem',
          background: 'var(--surface-hover)', borderRadius: '0.5rem',
          fontSize: '0.72rem', color: 'var(--text-muted)',
          wordBreak: 'break-all', fontFamily: 'monospace',
          textAlign: 'left'
        }}>
          {profileUrl}
        </div>
      </div>
    </div>
  );
}
