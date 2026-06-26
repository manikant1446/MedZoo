import { useState, useEffect } from 'react';
import { FileText, ShieldCheck, Activity, Upload, Star, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rating modal states
  const [ratingConsultation, setRatingConsultation] = useState(null);
  const [userRating, setUserRating] = useState(5);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/consultations/patient`);
      setConsultations(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submitRating = async (e) => {
    e.preventDefault();
    if (!ratingConsultation) return;
    setSubmittingRating(true);
    setRatingError('');
    try {
      await axios.post(`${API_BASE_URL}/consultations/${ratingConsultation._id}/rate`, {
        rating: userRating
      });
      await fetchData();
      setRatingConsultation(null);
    } catch (err) {
      setRatingError(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const treated = consultations.filter(c => c.status === 'treated').length;
  const pending = consultations.filter(c => c.status === 'pending').length;

  return (
    <div className="page animate-in">
      <div className="page-header">
        <h1>Welcome, {user?.name}</h1>
        <p>Your health records, secured on the blockchain</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon purple"><FileText size={24} /></div>
          <div className="stat-info">
            <h4>Total Records</h4>
            <div className="stat-value">{consultations.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><ShieldCheck size={24} /></div>
          <div className="stat-info">
            <h4>Treated</h4>
            <div className="stat-value">{treated}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Activity size={24} /></div>
          <div className="stat-info">
            <h4>Pending</h4>
            <div className="stat-value">{pending}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><Upload size={24} /></div>
          <div className="stat-info">
            <h4>DID</h4>
            <div className="stat-value" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
              {user?.did ? `${user.did.slice(0, 20)}...` : 'Not set'}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent Consultations</h3>
        </div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading...</p>
        ) : consultations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No consultations yet. Find a doctor to get started.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Doctor</th><th>Category</th><th>Diagnosis</th>
                  <th>Status</th><th>Date</th><th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((c) => (
                  <tr key={c._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {c.doctorId?.name || 'Unknown'}
                    </td>
                    <td><span className="badge badge-info">{c.category}</span></td>
                    <td>{c.diagnosis || '—'}</td>
                    <td>
                      <span className={`badge ${
                        c.status === 'treated' ? 'badge-success' :
                        c.status === 'pending' ? 'badge-warning' :
                        c.status === 'referred' ? 'badge-primary' : 'badge-info'
                      }`}>{c.status}</span>
                    </td>
                    <td>{new Date(c.date).toLocaleDateString()}</td>
                    <td>
                      {c.rating > 0 ? (
                        <div style={{ display: 'flex', gap: '0.1rem', color: '#fbbf24' }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={14} fill={i < c.rating ? '#fbbf24' : 'none'} color="#fbbf24" />
                          ))}
                        </div>
                      ) : ['treated', 'referred', 'follow-up'].includes(c.status) ? (
                        <button className="btn btn-primary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => { setRatingConsultation(c); setUserRating(5); setRatingError(''); }}>
                          Rate Doctor
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingConsultation && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }} onClick={() => !submittingRating && setRatingConsultation(null)}>
          <div className="card" style={{
            width: '100%', maxWidth: 400,
            animation: 'fadeIn 0.3s ease-out',
            textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Rate Doctor</h3>
              <button onClick={() => setRatingConsultation(null)} disabled={submittingRating} style={{
                background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
              }}>
                <X size={20} />
              </button>
            </div>

            {ratingError && <div className="error-message">{ratingError}</div>}

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              How was your consultation experience with <strong>Dr. {ratingConsultation.doctorId?.name}</strong>?
            </p>

            <form onSubmit={submitRating}>
              {/* Star Selector */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    disabled={submittingRating}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: submittingRating ? 'not-allowed' : 'pointer',
                      padding: '4px',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseEnter={(e) => { if(!submittingRating) e.currentTarget.style.transform = 'scale(1.25)'; }}
                    onMouseLeave={(e) => { if(!submittingRating) e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Star
                      size={32}
                      fill={star <= userRating ? '#fbbf24' : 'none'}
                      color="#fbbf24"
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submittingRating}>
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setRatingConsultation(null)} disabled={submittingRating}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
