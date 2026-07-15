import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, User, RefreshCw, Filter, AlertTriangle, Activity, Search, Edit, CreditCard, ShieldAlert, Send } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function AppointmentManager() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  
  // Reschedule state
  const [editingApt, setEditingApt] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editTimeSlot, setEditTimeSlot] = useState('');
  const [editReason, setEditReason] = useState('');

  // Cancel with reason state
  const [cancellingApt, setCancellingApt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Invitation Form State
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/appointments/doctor`);
      setAppointments(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const updateStatus = async (id, status) => {
    setActionLoading(id + status);
    try {
      await axios.put(`${API_BASE_URL}/appointments/${id}/status`, { status });
      fetchAppointments();
    } catch (err) { console.error(err); }
    finally { setActionLoading(''); }
  };

  const togglePayment = async (id) => {
    setActionLoading(id + 'payment');
    try {
      await axios.put(`${API_BASE_URL}/appointments/${id}/payment`);
      fetchAppointments();
    } catch (err) { console.error(err); }
    finally { setActionLoading(''); }
  };

  const toggleEmergency = async (id) => {
    setActionLoading(id + 'emergency');
    try {
      await axios.put(`${API_BASE_URL}/appointments/${id}/emergency`);
      fetchAppointments();
    } catch (err) { console.error(err); }
    finally { setActionLoading(''); }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!editingApt) return;
    setActionLoading(editingApt._id + 'edit');
    try {
      await axios.put(`${API_BASE_URL}/appointments/${editingApt._id}/edit`, {
        date: editDate,
        timeSlot: editTimeSlot,
        reason: editReason
      });
      setEditingApt(null);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancelWithReason = async (e) => {
    e.preventDefault();
    if (!cancellingApt) return;
    setActionLoading(cancellingApt._id + 'cancel');
    try {
      await axios.put(`${API_BASE_URL}/appointments/${cancellingApt._id}/cancel-with-reason`, {
        reason: cancelReason
      });
      setCancellingApt(null);
      setCancelReason('');
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading('');
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviteLink('');
    setInviteLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/invite`, {
        phone: invitePhone,
        role: inviteRole
      });
      const generatedLink = `${window.location.origin}/accept-invitation/${res.data.token}`;
      setInviteLink(generatedLink);
      setInviteSuccess('Invitation generated successfully! Share the registration link below:');
      setInvitePhone('');
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  // Filter and search logic
  const filtered = appointments.filter(a => {
    // Status Filter mapping
    let matchesStatus = true;
    if (filter === 'pending') matchesStatus = a.status === 'pending';
    else if (filter === 'confirmed') matchesStatus = a.status === 'confirmed';
    else if (filter === 'in-progress') matchesStatus = a.status === 'in-progress';
    else if (filter === 'critical') matchesStatus = a.status === 'critical' || a.isEmergency;
    else if (filter === 'completed') matchesStatus = a.status === 'completed';
    else if (filter === 'cancelled') matchesStatus = a.status === 'cancelled';
    
    // Search Query mapping
    const matchesSearch = searchQuery.trim() === '' || 
      a.patientId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.patientId?._id?.includes(searchQuery) ||
      a.reason?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    'in-progress': appointments.filter(a => a.status === 'in-progress').length,
    critical: appointments.filter(a => a.status === 'critical' || a.isEmergency).length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  const statusConfig = {
    pending:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   label: 'Pending' },
    confirmed:    { color: '#10b981', bg: 'rgba(16,185,129,0.1)',   label: 'Confirmed' },
    'in-progress':{ color: '#6366f1', bg: 'rgba(99,102,241,0.1)',   label: 'In Progress' },
    critical:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: '🚨 Critical' },
    completed:    { color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',   label: 'Completed' },
    cancelled:    { color: '#64748b', bg: 'rgba(100,116,139,0.1)',  label: 'Cancelled' },
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="page animate-in">
      <div className="page-header flex-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Appointments Dashboard</h1>
          <p>Advanced daily booking slots control & real-time monitoring</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {counts.critical > 0 && (
            <span style={{
              background: 'rgba(239,68,68,0.15)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.4)',
              padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem', fontWeight: 700,
              animation: 'criticalBlink 1.2s ease-in-out infinite'
            }}>
              🚨 {counts.critical} Emergency Alerts
            </span>
          )}
          <button className="btn btn-secondary" onClick={() => fetchAppointments(true)} disabled={refreshing}>
            <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
            {refreshing ? 'Refreshing...' : 'Refresh Slots'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }} className="responsive-grid">
        {/* Main Content Area */}
        <div>
          {/* Advanced Search and Filters */}
          <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search patients by name, ID or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {[
                { key: 'all',         label: 'All',         icon: <Filter size={14} />,       color: '#818cf8' },
                { key: 'pending',     label: 'Pending',     icon: <Clock size={14} />,        color: '#f59e0b' },
                { key: 'confirmed',   label: 'Confirmed',   icon: <CheckCircle size={14} />,  color: '#10b981' },
                { key: 'in-progress', label: 'In Progress', icon: <Activity size={14} />,     color: '#6366f1' },
                { key: 'critical',    label: 'Emergency',    icon: <AlertTriangle size={14} />, color: '#ef4444' },
                { key: 'completed',   label: 'Treated',   icon: <CheckCircle size={14} />,  color: '#22d3ee' },
                { key: 'cancelled',   label: 'Cancelled',   icon: <XCircle size={14} />,      color: '#64748b' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    border: filter === tab.key ? `1.5px solid ${tab.color}` : '1px solid var(--border)',
                    background: filter === tab.key ? `${tab.color}15` : 'var(--bg-secondary)',
                    color: filter === tab.key ? tab.color : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.icon} {tab.label}
                  <span style={{
                    background: filter === tab.key ? tab.color : 'var(--border)',
                    color: filter === tab.key ? 'white' : 'var(--text-muted)',
                    borderRadius: 'var(--radius-full)', fontSize: '0.68rem',
                    padding: '0 5px', minWidth: 16, textAlign: 'center', fontWeight: 700
                  }}>
                    {counts[tab.key] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Appointment List */}
          {filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Calendar size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
              <p>No matching appointment records found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.map(apt => {
                const isEmergency = apt.isEmergency || apt.status === 'critical';
                const sc = statusConfig[apt.status] || statusConfig.pending;
                const isPending = apt.status === 'pending';
                const isConfirmed = apt.status === 'confirmed';
                const isInProgress = apt.status === 'in-progress';

                return (
                  <div
                    key={apt._id}
                    className={isEmergency ? 'card critical-card' : 'card'}
                    style={{
                      borderLeft: !isEmergency ? `4px solid ${sc.color}` : undefined,
                      padding: '1.25rem',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      {/* Avatar */}
                      <div style={{
                        width: 48, height: 48, borderRadius: 'var(--radius-md)',
                        background: `linear-gradient(135deg, ${sc.color}33, ${sc.color}66)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: sc.color, fontWeight: 800, fontSize: '1.1rem', flexShrink: 0
                      }}>
                        {apt.patientId?.name?.charAt(0) || 'P'}
                      </div>

                      {/* Info Details */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                            {apt.patientId?.name || 'Unknown Patient'}
                          </h4>
                          <span style={{
                            padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem', fontWeight: 700,
                            background: sc.bg, color: sc.color,
                          }}>
                            {sc.label}
                          </span>
                          
                          {/* Inline Payment Toggler badge */}
                          <button
                            onClick={() => togglePayment(apt._id)}
                            style={{
                              border: 'none',
                              background: apt.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                              color: apt.paymentStatus === 'Paid' ? '#10b981' : '#ef4444',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            <CreditCard size={11} />
                            {apt.paymentStatus || 'Unpaid'}
                          </button>

                          {/* Inline Emergency Control badge */}
                          <button
                            onClick={() => toggleEmergency(apt._id)}
                            style={{
                              border: 'none',
                              background: apt.isEmergency ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.08)',
                              color: apt.isEmergency ? '#ef4444' : 'var(--text-muted)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            <ShieldAlert size={11} />
                            {apt.isEmergency ? 'Emergency: ON' : 'Trigger Emergency'}
                          </button>
                        </div>

                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
                          ID: {apt.patientId?._id}
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={13} color="var(--accent-primary)" /> {formatDate(apt.date)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={13} color="var(--accent-primary)" /> {apt.timeSlot}
                          </span>
                        </div>

                        {apt.reason && (
                          <p style={{
                            fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem',
                            background: 'var(--bg-tertiary)', padding: '0.4rem 0.6rem',
                            borderRadius: 'var(--radius-sm)'
                          }}>
                            💬 Reason: {apt.reason}
                          </p>
                        )}

                        {apt.cancellationReason && (
                          <p style={{
                            fontSize: '0.8rem', color: '#ef4444', marginTop: '0.5rem',
                            background: 'rgba(239, 68, 68, 0.05)', padding: '0.4rem 0.6rem',
                            borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #ef4444'
                          }}>
                            🚫 Cancelled Reason: {apt.cancellationReason}
                          </p>
                        )}
                      </div>

                      {/* Right Hand Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', width: '100%', marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        {isPending && (
                          <>
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--gradient-success)', color: 'white' }}
                              onClick={() => updateStatus(apt._id, 'confirmed')}>
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => updateStatus(apt._id, 'in-progress')}>
                              Start Visit
                            </button>
                          </>
                        )}
                        {(isConfirmed || isInProgress) && (
                          <>
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--gradient-secondary)', color: 'white' }}
                              onClick={() => updateStatus(apt._id, 'completed')}>
                              Mark Treated
                            </button>
                          </>
                        )}
                        {apt.status === 'completed' && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => updateStatus(apt._id, 'confirmed')}>
                            Mark Untreated
                          </button>
                        )}
                        {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                          <>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setEditingApt(apt);
                                setEditDate(apt.date.split('T')[0]);
                                setEditTimeSlot(apt.timeSlot);
                                setEditReason(apt.reason || '');
                              }}>
                              <Edit size={12} /> Reschedule
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              style={{ color: '#ef4444' }}
                              onClick={() => setCancellingApt(apt)}>
                              Cancel Visit
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar: Invitation Creator Widget */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🤝 Team Invitation
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Invite guest doctors or medical assistants to join your clinic staff database.
          </p>

          {inviteError && <div className="error-message" style={{ fontSize: '0.8rem', padding: '0.5rem', marginBottom: '1rem' }}>{inviteError}</div>}
          {inviteSuccess && <div className="success-message" style={{ fontSize: '0.8rem', padding: '0.5rem', marginBottom: '1rem', color: '#10b981', background: 'rgba(16,185,129,0.08)' }}>{inviteSuccess}</div>}

          {inviteLink && (
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                readOnly
                value={inviteLink}
                onClick={(e) => { e.target.select(); document.execCommand('copy'); alert('Link copied to clipboard!'); }}
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  fontSize: '0.78rem',
                  border: '1px solid #10b981',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}
              />
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                💡 Click on input field box to auto-copy URL.
              </p>
            </div>
          )}

          <form onSubmit={handleSendInvite}>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.78rem' }}>Collaborator Phone</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.78rem' }}>Role Permission</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="staff">Staff/Receptionist</option>
                <option value="doctor">Associate Doctor</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem' }} disabled={inviteLoading}>
              <Send size={12} /> {inviteLoading ? 'Generating...' : 'Generate Invite Link'}
            </button>
          </form>
        </div>
      </div>

      {/* Edit / Reschedule Modal Overlay */}
      {editingApt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', margin: '1rem' }}>
            <h3>Reschedule Appointment</h3>
            <p className="subtitle" style={{ marginBottom: '1rem' }}>
              Select new date & slot for <strong>{editingApt.patientId?.name}</strong>
            </p>

            <form onSubmit={handleReschedule}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label>Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label>Time Slot</label>
                <select
                  value={editTimeSlot}
                  onChange={(e) => setEditTimeSlot(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
                  <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                  <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                  <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                  <option value="03:00 PM - 03:30 PM">03:00 PM - 03:30 PM</option>
                  <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label>Reschedule Reason (Optional)</label>
                <textarea
                  placeholder="e.g. Doctor unavailable during original slot"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    minHeight: '60px',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingApt(null)}>
                  Close
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Reason Modal Overlay */}
      {cancellingApt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', margin: '1rem' }}>
            <h3 style={{ color: '#ef4444' }}>Cancel Appointment</h3>
            <p className="subtitle" style={{ marginBottom: '1rem' }}>
              Please provide a reason to cancel the booking slot for <strong>{cancellingApt.patientId?.name}</strong>
            </p>

            <form onSubmit={handleCancelWithReason}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label>Cancellation Reason</label>
                <textarea
                  placeholder="e.g. Patient requested cancellation or slots double-booked"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    minHeight: '80px',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCancellingApt(null)}>
                  Close
                </button>
                <button type="submit" className="btn" style={{ background: '#ef4444', color: 'white' }}>
                  Cancel Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
