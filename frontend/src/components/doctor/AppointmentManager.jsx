import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, XCircle, User, RefreshCw, Filter, AlertTriangle, Activity, Search, Edit, CreditCard, ShieldAlert, Send, Trash2, Users, UserMinus } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

export default function AppointmentManager() {
  const { user, role, staffAssignments, isClinicStaff, refreshStaffAssignments } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [leavingClinic, setLeavingClinic] = useState(false);
  
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
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);

  useEffect(() => {
    fetchAppointments();
    if (role === 'doctor') {
      fetchTeam();
    } else {
      refreshStaffAssignments();
    }
  }, [role]);

  // Real-time team updates listener
  useEffect(() => {
    if (!user?._id) return;
    const socketUrl = API_BASE_URL.replace('/api', '');
    const socket = io(socketUrl);

    socket.on(`team_update_${user._id}`, () => {
      console.log('🔄 Live team update event received');
      if (role === 'doctor') {
        fetchTeam();
      } else {
        refreshStaffAssignments();
      }
    });

    return () => socket.disconnect();
  }, [user?._id, role]);

  const fetchTeam = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/team`);
      const list = Array.isArray(res.data) ? res.data : (res.data.teamMembers || []);
      const pending = res.data.pendingInvitations || [];
      setTeamMembers(list);
      setPendingInvitations(pending);
    } catch (err) {
      console.error('Error fetching team:', err);
    }
  };

  const handleCancelInvitation = async (id, phone) => {
    if (!window.confirm(`Cancel pending invitation to ${phone}?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/auth/invitations/${id}`);
      fetchTeam();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  const handleRemoveTeamMember = async (id, memberName) => {
    if (!window.confirm(`Remove ${memberName || 'this member'} from your team? They will no longer have access to manage your appointments.`)) {
      return;
    }
    try {
      await axios.delete(`${API_BASE_URL}/auth/team/${id}`);
      fetchTeam();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleLeaveClinic = async () => {
    const docName = staffAssignments[0]?.doctor_name || 'the clinic doctor';
    if (!window.confirm(`Are you sure you want to finish duties and step down from Dr. ${docName}'s clinic staff? You will no longer manage these appointments.`)) {
      return;
    }
    setLeavingClinic(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/leave-clinic`, {
        doctorId: staffAssignments[0]?.doctor_id
      });
      await refreshStaffAssignments();
      alert('You have successfully stepped down from clinic staff duties.');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave clinic staff');
    } finally {
      setLeavingClinic(false);
    }
  };

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
      if (res.data.isExistingUser) {
        setInviteSuccess(`✅ Member (${res.data.existingUserName || invitePhone}) already has a MedZoo account and has been directly added to your clinic team! They can now manage your appointments.`);
      } else {
        const generatedLink = `${window.location.origin}/accept-invitation/${res.data.token}`;
        setInviteLink(generatedLink);
        setInviteSuccess('Invitation generated successfully! Share the onboarding link below:');
      }
      setInvitePhone('');
      fetchTeam();
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

      {(role === 'staff' || isClinicStaff) && role !== 'doctor' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '1.6rem' }}>👨‍⚕️</div>
            <div>
              <h4 style={{ margin: '0 0 0.2rem 0', color: 'var(--accent-primary)', fontSize: '0.92rem' }}>
                Clinic Assistant Workspace
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Logged in as <strong>{user?.name}</strong>. Handling appointments for <strong>Dr. {staffAssignments[0]?.doctor_name || 'Clinic Doctor'}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLeaveClinic}
            disabled={leavingClinic}
            style={{
              borderColor: 'rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              padding: '0.45rem 0.85rem',
              background: 'rgba(239, 68, 68, 0.08)'
            }}
            title="Finish duties and leave clinic assistant role"
          >
            <UserMinus size={14} />
            {leavingClinic ? 'Leaving...' : 'Leave'}
          </button>
        </div>
      )}

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
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && (
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
                          )}

                          {/* Inline Emergency Control badge */}
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && (
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
                          )}
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
                      {apt.status !== 'cancelled' && (
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
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar: Invitation Creator Widget & Active Team Members */}
        {role === 'doctor' ? (
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🤝 Team Invitation
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Invite any member to handle your appointments. Existing MedZoo users are linked instantly without creating a new account.
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
                <label style={{ fontSize: '0.78rem' }}>Member Phone Number</label>
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
                  <option value="staff">Staff / Assistant</option>
                  <option value="doctor">Associate Doctor</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem' }} disabled={inviteLoading}>
                <Send size={12} /> {inviteLoading ? 'Processing...' : 'Invite Member'}
              </button>
            </form>

            {/* Active Team Members List */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={14} /> Active Team Members ({teamMembers.length})
              </h4>
              {teamMembers.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  No team members added yet. Invite someone using their phone number above.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {teamMembers.map(m => (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.6rem 0.7rem', background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.25)'
                    }}>
                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</span>
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                            background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                            padding: '1px 6px', borderRadius: 'var(--radius-full)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            letterSpacing: '0.03em', whiteSpace: 'nowrap'
                          }}>
                            ● Active
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          📱 {m.phone} • <span style={{ textTransform: 'capitalize', color: 'var(--accent-primary)', fontWeight: 600 }}>{m.role}</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Joined {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember(m.id, m.name)}
                        title="Remove member access"
                        style={{
                          background: 'transparent', border: 'none', color: '#ef4444',
                          cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b' }}>
                  <Clock size={14} /> Pending Invitations ({pendingInvitations.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {pendingInvitations.map(inv => (
                    <div key={inv.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.5rem 0.7rem', background: 'rgba(245, 158, 11, 0.06)',
                      borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>📱 {inv.phone}</span>
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                            background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
                            padding: '1px 6px', borderRadius: 'var(--radius-full)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            letterSpacing: '0.03em'
                          }}>
                            ⏳ Pending
                          </span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          Role: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{inv.role}</span> • Sent {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCancelInvitation(inv.id, inv.phone)}
                        title="Cancel invitation"
                        style={{
                          background: 'transparent', border: 'none', color: '#ef4444',
                          cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center',
                          flexShrink: 0
                        }}
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🩺 Assistant Quick Guide
            </h3>
            {staffAssignments[0] && (
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                marginBottom: '1rem',
                fontSize: '0.8rem'
              }}>
                <div style={{ fontWeight: 600 }}>👨‍⚕️ Dr. {staffAssignments[0].doctor_name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                  {staffAssignments[0].specialty || 'General Practitioner'} • {staffAssignments[0].hospital || 'MedZoo Clinic'}
                </div>
              </div>
            )}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              As clinic assistant, you can handle appointments in real time:
            </p>
            <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: 1.7, margin: '0 0 1.25rem 0' }}>
              <li><strong>Status:</strong> Confirm bookings or mark as completed.</li>
              <li><strong>Reschedule:</strong> Move slots if requested or delayed.</li>
              <li><strong>Payment:</strong> Mark visits as Paid or Unpaid.</li>
              <li><strong>Emergency:</strong> Trigger or monitor emergency alerts.</li>
              <li><strong>Cancel:</strong> Cancel with an audit reason.</li>
            </ul>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLeaveClinic}
                disabled={leavingClinic}
                style={{
                  width: '100%',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.08)'
                }}
                title="Finish duties and leave clinic assistant role"
              >
                <UserMinus size={15} />
                {leavingClinic ? 'Leaving...' : 'Leave'}
              </button>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', margin: '0.35rem 0 0 0' }}>
                Click when your duty is complete to remove clinic access.
              </p>
            </div>
          </div>
        )}
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
