import { useState, useEffect } from 'react';
import { 
  Download, Copy, Check, Share2, QrCode, ShieldCheck, 
  Building, X, ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../../contexts/AuthContext';

export default function DoctorQR({ isOpen, onClose }) {
  const { user } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloadingStandee, setDownloadingStandee] = useState(false);

  // Deep link to public doctor profile & direct booking on MedZoo
  const baseUrl = window.location.origin;
  const profileUrl = `${baseUrl}/discover?doctor=${user?._id || user?.id}`;

  useEffect(() => {
    if (!isOpen || !user) return;
    setGenerating(true);

    // High error-correction QR code (Level H)
    QRCode.toDataURL(profileUrl, {
      width: 500,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    }).then(url => {
      setQrDataUrl(url);
      setGenerating(false);
    }).catch(err => {
      console.error('Doctor QR generation failed:', err);
      setGenerating(false);
    });
  }, [isOpen, user, profileUrl]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 1. Download Clean QR Code (PNG)
  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `Doctor_QR_${user?.name?.replace(/\s+/g, '_') || 'MedZoo'}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  // 2. Download Ultra-Professional Clinic Desk Standee / Poster (Hi-Res PNG)
  const handleDownloadStandee = async () => {
    if (!qrDataUrl) return;
    setDownloadingStandee(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1520;
      const ctx = canvas.getContext('2d');

      // 1. Background gradient (Deep Medical Navy)
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 1520);
      bgGrad.addColorStop(0, '#0a0f1d');
      bgGrad.addColorStop(0.5, '#11192e');
      bgGrad.addColorStop(1, '#070b14');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 1520);

      // Top Accent glow
      const glowGrad = ctx.createRadialGradient(600, 0, 50, 600, 0, 700);
      glowGrad.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
      glowGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, 1200, 700);

      // 2. Card Container Border & Shadow
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 3;
      ctx.strokeRect(60, 60, 1080, 1400);
      ctx.restore();

      // 3. Header: MedZoo Brand
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚕  MEDZOO SMART HEALTHCARE', 600, 140);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('VERIFIED PRACTITIONER & CLINIC TOKEN DESK', 600, 185);

      // 4. White Center Card for QR & Doctor Badge
      const cardX = 140;
      const cardY = 240;
      const cardW = 920;
      const cardH = 1060;

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 36);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // 5. Doctor Name & Title inside card
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Dr. ${user?.name || 'Doctor'}`, 600, 340);

      // Specialty & Qualifications Badge
      const specialtyText = `${user?.specialty || 'Specialist'}${user?.qualifications ? '  •  ' + user.qualifications : ''}`;
      ctx.fillStyle = '#4f46e5';
      ctx.font = '600 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(specialtyText, 600, 395);

      // Hospital / Clinic Location
      if (user?.hospital || user?.locality) {
        ctx.fillStyle = '#64748b';
        ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const clinicLoc = [user?.hospital, user?.locality || user?.address].filter(Boolean).join(', ');
        ctx.fillText(`🏥 ${clinicLoc}`, 600, 435);
      }

      // Divider line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(220, 470);
      ctx.lineTo(980, 470);
      ctx.stroke();

      // 6. Draw QR Code in Center
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });

      const qrSize = 560;
      const qrX = (1200 - qrSize) / 2;
      const qrY = 510;

      // QR container box
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 24);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // 7. Call to action below QR (clean, no extra scanner text)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('SCAN TO BOOK APPOINTMENT', 600, 1185);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Instant OPD token  •  Digital prescription records  •  Verified profile', 600, 1235);

      // 8. Footer on outer card
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('medzoo.vercel.app', 600, 1390);

      ctx.fillStyle = '#64748b';
      ctx.font = '400 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Unified Blockchain & AI Healthcare Platform', 600, 1425);

      // Trigger download
      const standeeUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Doctor_Standee_Dr_${user?.name?.replace(/\s+/g, '_') || 'MedZoo'}.png`;
      link.href = standeeUrl;
      link.click();
    } catch (err) {
      console.error('Standee render failed:', err);
    } finally {
      setDownloadingStandee(false);
    }
  };

  // 3. Copy Direct Booking Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Copy link failed:', err);
    }
  };

  // 4. Native Share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Dr. ${user?.name} - MedZoo Clinic Profile`,
          text: `Book an appointment with Dr. ${user?.name} (${user?.specialty || 'Doctor'}) on MedZoo.`,
          url: profileUrl
        });
      } catch (err) {
        console.log('Share dismissed');
      }
    } else {
      handleCopyLink();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '1.5rem',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          animation: 'fadeIn 0.25s ease-out',
          background: 'var(--surface)',
          border: '1px solid var(--border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar: Title with Download and Close (X) Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, var(--accent-primary), #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <QrCode size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Doctor QR</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official Clinic Booking QR</p>
            </div>
          </div>

          {/* Side action buttons: Download and Cross (X) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleDownloadStandee}
              disabled={downloadingStandee || !qrDataUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem'
              }}
              title="Download High-Res Standee (PNG)"
            >
              <Download size={14} />
              {downloadingStandee ? 'Saving...' : 'Download'}
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                width: '34px',
                height: '34px',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-hover)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Professional Visual Standee Card Preview */}
        <div style={{
          background: 'linear-gradient(180deg, #0d1322 0%, #151d32 100%)',
          borderRadius: '1.25rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 15px 35px -10px rgba(0, 0, 0, 0.5)',
          padding: '1.5rem 1.25rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top glow accent */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '240px', height: '100px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* MedZoo Branding Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.75rem', borderRadius: '2rem',
            background: 'rgba(99, 102, 241, 0.18)', border: '1px solid rgba(99, 102, 241, 0.4)',
            color: '#a5b4fc', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: '1rem'
          }}>
            ⚕ MedZoo Smart Healthcare
          </div>

          {/* Doctor Info Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '1rem',
            padding: '1.4rem 1rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            color: '#0f172a'
          }}>
            <h3 style={{
              margin: '0 0 0.2rem 0',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em'
            }}>
              Dr. {user?.name || 'Doctor'}
            </h3>

            <div style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#4f46e5',
              marginBottom: '0.35rem'
            }}>
              {user?.specialty || 'General Practitioner'}
              {user?.qualifications && ` • ${user.qualifications}`}
            </div>

            {(user?.hospital || user?.locality) && (
              <div style={{
                fontSize: '0.76rem',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                marginBottom: '0.85rem'
              }}>
                <Building size={13} />
                {[user?.hospital, user?.locality || user?.address].filter(Boolean).join(', ')}
              </div>
            )}

            {/* High-Resolution Scannable QR Code */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '0.75rem',
              padding: '0.85rem',
              margin: '0.5rem auto 0.85rem',
              display: 'inline-block',
              border: '1px solid #e2e8f0',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)'
            }}>
              {generating ? (
                <div style={{
                  width: '190px', height: '190px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94a3b8'
                }}>
                  <QrCode size={36} style={{ animation: 'pulse 1.5s infinite' }} />
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Doctor QR Code for Dr. ${user?.name}`}
                  style={{
                    width: '190px',
                    height: '190px',
                    display: 'block',
                    borderRadius: '0.35rem'
                  }}
                />
              ) : (
                <div style={{ width: '190px', height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  QR Error
                </div>
              )}
            </div>

            {/* Scan Call to Action (clean, no scanner app text) */}
            <div style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              Scan to Book Appointment
            </div>
          </div>

          {/* Footer inside standee */}
          <div style={{ marginTop: '1rem', fontSize: '0.72rem', color: '#94a3b8' }}>
            Instant OPD Tokens • Digital History • MedZoo Verified
          </div>
        </div>

        {/* Secondary Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button
            className="btn btn-secondary"
            onClick={handleCopyLink}
            style={{ flex: 1, justifyContent: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
          >
            {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            {copied ? 'Copied Link!' : 'Copy Booking Link'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleDownloadQR}
            disabled={!qrDataUrl}
            style={{ flex: 1, justifyContent: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
            title="Download QR code image only"
          >
            <QrCode size={14} /> QR Only (PNG)
          </button>

          <button
            className="btn btn-ghost"
            onClick={handleShare}
            style={{ padding: '0.5rem 0.75rem' }}
            title="Share"
          >
            <Share2 size={15} />
          </button>
        </div>

      </div>
    </div>
  );
}
