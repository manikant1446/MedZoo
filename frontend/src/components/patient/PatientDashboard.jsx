import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, ShieldCheck, Activity, Star, X, Phone, 
  Search, RefreshCw, Calendar, CheckCircle2, Clock, ArrowRight, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Rating modal states
  const [ratingConsultation, setRatingConsultation] = useState(null);
  const [userRating, setUserRating] = useState(5);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/consultations/patient`);
      setConsultations(res.data);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
      if (isManual) setRefreshing(false);
    }
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

  const todayStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
  });

  return (
    <div className="page animate-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem' }}>
            <Sparkles size={13} /> Patient Portal
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            • {todayStr}
          </span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
          Welcome back, {user?.name || 'Patient'}
        </h1>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon purple"><FileText size={24} /></div>
          <div className="stat-info">
            <h4>Total Consultations</h4>
            <div className="stat-value">{consultations.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><ShieldCheck size={24} /></div>
          <div className="stat-info">
            <h4>Treated & Completed</h4>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              {treated}
              {consultations.length > 0 && (
                <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                  ({Math.round((treated / consultations.length) * 100)}%)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber"><Activity size={24} /></div>
          <div className="stat-info">
            <h4>Pending / Active</h4>
            <div className="stat-value">{pending}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon cyan"><Phone size={24} /></div>
          <div className="stat-info">
            <h4>Registered Contact</h4>
            <div className="stat-value" style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0.02em' }}>
              {user?.phone ? `+91 ${user.phone}` : 'Not Linked'}
            </div>
          </div>
        </div>
      </div>

      {/* Consultations Card */}
      <div className="card">
        <div className="card-header flex-between" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Consultation History</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Complete chronological medical record and doctor feedback
            </p>
          </div>
          {consultations.length > 0 && (
            <span className="badge badge-info">
              {consultations.length} {consultations.length === 1 ? 'Record' : 'Records'}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)', marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading your medical records...</p>
          </div>
        ) : consultations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--surface-hover)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
              color: 'var(--text-muted)'
            }}>
              <Calendar size={28} />
            </div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              No consultations recorded yet
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 420, margin: '0 auto 1.5rem' }}>
              Search for trusted specialists in your network, view recommendations, and book your first appointment.
            </p>
            <Link to="/discover" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <Search size={16} /> Explore Doctors <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Doctor</th><th>Category</th><th>Diagnosis</th>
                    <th>Status</th><th>Date</th>
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
