import { useState, useEffect, useRef } from 'react';
import { 
  Download, Copy, Check, Share2, QrCode, ShieldCheck, 
  Stethoscope, MapPin, Building, Sparkles, ExternalLink, Printer
} from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../../contexts/AuthContext';

export default function DoctorQR() {
  const { user } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloadingStandee, setDownloadingStandee] = useState(false);

  // Deep link to public doctor profile & direct booking on MedZoo
  const baseUrl = window.location.origin;
  const profileUrl = `${baseUrl}/discover?doctor=${user?._id || user?.id}`;

  useEffect(() => {
    if (!user) return;
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
  }, [user, profileUrl]);

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
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');

      // 1. Background gradient (Deep Medical Navy)
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 1600);
      bgGrad.addColorStop(0, '#0a0f1d');
      bgGrad.addColorStop(0.5, '#11192e');
      bgGrad.addColorStop(1, '#070b14');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 1600);

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
      ctx.strokeRect(60, 60, 1080, 1480);
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
      const cardH = 1140;

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

      const qrSize = 580;
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

      // 7. Instructions below QR
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('SCAN TO BOOK APPOINTMENT', 600, 1180);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Instant OPD token • Digital prescription records • Verified profile', 600, 1225);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Camera or any UPI / QR Scanner App', 600, 1265);

      // 8. Footer on outer card
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('medzoo.vercel.app', 600, 1470);

      ctx.fillStyle = '#64748b';
      ctx.font = '400 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Unified Blockchain & AI Healthcare Platform', 600, 1505);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Overview Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <QrCode size={13} /> Official Doctor QR
              </span>
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={13} /> Verified Practitioner
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
              Doctor QR &amp; Clinic Standee
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '600px', lineHeight: 1.5 }}>
              Your dedicated professional QR code. Patients can scan this from your clinic reception, prescription pad, or WhatsApp to directly book appointments and access digital OPD tokens.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={handleDownloadStandee}
              disabled={downloadingStandee || !qrDataUrl}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Download size={16} />
              {downloadingStandee ? 'Generating...' : 'Download Desk Standee'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleCopyLink}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
              {copied ? 'Copied Link!' : 'Copy Link'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Standee Preview + Configuration/Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        alignItems: 'start'
      }}>

        {/* Column 1: Professional Visual Standee Card Preview */}
        <div style={{
          background: 'linear-gradient(180deg, #0d1322 0%, #151d32 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top glow accent */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '280px', height: '120px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* MedZoo Branding Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.35rem 0.85rem', borderRadius: '2rem',
            background: 'rgba(99, 102, 241, 0.18)', border: '1px solid rgba(99, 102, 241, 0.4)',
            color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: '1.25rem'
          }}>
            ⚕ MedZoo Smart Healthcare
          </div>

          {/* Doctor Info Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '1.25rem',
            padding: '1.75rem 1.25rem',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
            color: '#0f172a'
          }}>
            <h3 style={{
              margin: '0 0 0.25rem 0',
              fontSize: '1.35rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em'
            }}>
              Dr. {user?.name || 'Doctor'}
            </h3>

            <div style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#4f46e5',
              marginBottom: '0.4rem'
            }}>
              {user?.specialty || 'General Practitioner'}
              {user?.qualifications && ` • ${user.qualifications}`}
            </div>

            {(user?.hospital || user?.locality) && (
              <div style={{
                fontSize: '0.78rem',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                marginBottom: '1rem'
              }}>
                <Building size={13} />
                {[user?.hospital, user?.locality || user?.address].filter(Boolean).join(', ')}
              </div>
            )}

            {/* High-Resolution Scannable QR Code */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '1rem',
              padding: '1rem',
              margin: '0.75rem auto 1rem',
              display: 'inline-block',
              border: '1px solid #e2e8f0',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)'
            }}>
              {generating ? (
                <div style={{
                  width: '210px', height: '210px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94a3b8'
                }}>
                  <QrCode size={40} style={{ animation: 'pulse 1.5s infinite' }} />
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Doctor QR Code for Dr. ${user?.name}`}
                  style={{
                    width: '210px',
                    height: '210px',
                    display: 'block',
                    borderRadius: '0.5rem'
                  }}
                />
              ) : (
                <div style={{ width: '210px', height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  QR Error
                </div>
              )}
            </div>

            {/* Scan Call to Action */}
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              Scan to Book Appointment
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
              Point camera or any QR / UPI scanner app
            </div>
          </div>

          {/* Footer inside standee */}
          <div style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            Instant OPD Tokens • Digital History • MedZoo Verified
          </div>
        </div>

        {/* Column 2: Management & Distribution Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Action Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
              Downloads &amp; Distribution
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleDownloadStandee}
                disabled={downloadingStandee || !qrDataUrl}
                style={{ justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1rem' }}
              >
                <Download size={18} />
                {downloadingStandee ? 'Generating High-Res Standee...' : 'Download Printable Clinic Standee (PNG)'}
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleDownloadQR}
                disabled={!qrDataUrl}
                style={{ justifyContent: 'center', gap: '0.5rem' }}
              >
                <QrCode size={16} /> Download QR Code Only (PNG)
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-ghost"
                  onClick={handleCopyLink}
                  style={{ flex: 1, justifyContent: 'center', gap: '0.4rem' }}
                >
                  {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy Booking Link'}
                </button>

                <button
                  className="btn btn-ghost"
                  onClick={handleShare}
                  style={{ flex: 1, justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Share2 size={16} /> Share Link
                </button>
              </div>
            </div>
          </div>

          {/* Direct Link Preview Card */}
          <div className="card">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              Public Booking URL
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
              This link is embedded in your QR code and opens directly to your appointment booking page on MedZoo.
            </p>
            <div style={{
              padding: '0.65rem 0.85rem',
              background: 'var(--surface-hover)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              color: 'var(--accent-primary)',
              wordBreak: 'break-all',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}>
              <span>{profileUrl}</span>
              <a
                href={profileUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}
                title="Open preview in new tab"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Recommendations / Best Practices */}
          <div className="card" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 0.6rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={16} color="var(--accent-warning)" /> Where to use your Doctor QR?
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li><strong>Reception Desk:</strong> Print the standee and place it on an acrylic stand for walk-in OPD token registration.</li>
              <li><strong>Prescription Slips:</strong> Include the clean QR code in the header or footer of your printed prescriptions.</li>
              <li><strong>WhatsApp &amp; Social:</strong> Share the standee as a status or image so patients can book appointments from home.</li>
              <li><strong>Visiting Card:</strong> Add the QR code on the back of your doctor business card.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
