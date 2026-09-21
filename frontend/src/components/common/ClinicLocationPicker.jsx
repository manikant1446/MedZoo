import { useState } from 'react';
import { MapPin, Navigation, CheckCircle, AlertCircle, X, LoaderCircle } from 'lucide-react';

/**
 * Clinic location picker for doctors.
 *
 * A doctor's clinic location is FIXED and doctor-managed: it is captured from
 * the device and persisted on their profile, so patients can be ranked by the
 * distance from their own (transient) location.
 *
 * Props:
 *   latitude  {number|null} currently saved latitude
 *   longitude {number|null} currently saved longitude
 *   updatedAt {string|null} timestamp of the last save (for display)
 *   onSave    (lat|null, lng|null) => Promise   persist, or clear with nulls
 *   disabled  {boolean} disable controls while another save is in flight
 */
export default function ClinicLocationPicker({ latitude, longitude, updatedAt, onSave, disabled = false }) {
  const [status, setStatus] = useState('idle'); // idle | locating | saving | error
  const [message, setMessage] = useState('');

  const hasSavedLocation = latitude != null && longitude != null;
  const busy = status === 'locating' || status === 'saving' || disabled;

  const handleCapture = () => {
    setMessage('');

    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('Geolocation is not supported by this browser. Please enter your clinic address manually instead.');
      return;
    }

    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus('saving');
        try {
          await onSave(
            Number(position.coords.latitude.toFixed(7)),
            Number(position.coords.longitude.toFixed(7))
          );
          setStatus('idle');
          setMessage('');
        } catch (err) {
          setStatus('error');
          setMessage(err?.response?.data?.message || 'Could not save your clinic location. Please try again.');
        }
      },
      (error) => {
        setStatus('error');
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission denied. Allow location access to pin your clinic, or update your clinic address manually.'
            : error.code === error.TIMEOUT
              ? 'Locating timed out. Move somewhere with a clearer signal and try again.'
              : 'Could not determine your location. Please try again.'
        );
      },
      // A clinic is a fixed point, so a cached fix is acceptable; prefer accuracy.
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleClear = async () => {
    setMessage('');
    setStatus('saving');
    try {
      await onSave(null, null);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setMessage(err?.response?.data?.message || 'Could not remove your clinic location.');
    }
  };

  return (
    <div className={`location-picker${hasSavedLocation ? ' location-picker-saved' : ''}`}>
      <div
        className="sec-icon-lg"
        style={{
          width: '38px',
          height: '38px',
          background: hasSavedLocation ? 'rgba(16,185,129,0.15)' : 'rgba(34,211,238,0.15)',
          color: hasSavedLocation ? '#10b981' : '#22d3ee'
        }}
      >
        <MapPin size={18} />
      </div>

      <div className="location-picker-info">
        <div className="location-picker-title">
          Clinic Location
          {hasSavedLocation && (
            <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>
              <CheckCircle size={11} /> Saved
            </span>
          )}
        </div>
        <div className="location-picker-sub">
          {hasSavedLocation
            ? `Patients near this clinic see you first${updatedAt ? ` • updated ${new Date(updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`
            : 'Not set — pin your clinic so nearby patients find you first'}
        </div>
        {hasSavedLocation && (
          <div className="location-picker-coords">
            {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={handleCapture} disabled={busy}>
          {status === 'locating' ? (
            <>
              <LoaderCircle size={14} style={{ animation: 'spin 1s linear infinite' }} /> Locating...
            </>
          ) : status === 'saving' ? (
            'Saving...'
          ) : (
            <>
              <Navigation size={14} /> {hasSavedLocation ? 'Update from this device' : 'Use my current location'}
            </>
          )}
        </button>

        {hasSavedLocation && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleClear} disabled={busy}>
            <X size={14} /> Remove
          </button>
        )}
      </div>

      {message && (
        <div
          className="location-msg"
          style={{ width: '100%', color: status === 'error' ? '#ef4444' : '#10b981' }}
        >
          {status === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
          {message}
        </div>
      )}
    </div>
  );
}