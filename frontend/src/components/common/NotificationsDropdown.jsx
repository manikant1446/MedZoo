import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, CheckCircle, Clock, ShieldAlert, Calendar, Users, X } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

export default function NotificationsDropdown() {
  const { user, isAuthenticated, refreshStaffAssignments } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState(null);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications on mount & user change
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;
    fetchNotifications();

    // Socket.io real-time listener
    const socketUrl = API_BASE_URL.replace('/api', '');
    const socket = io(socketUrl);

    socket.on(`notification_${user._id}`, (newNotif) => {
      const nid = newNotif._id || newNotif.id;
      setNotifications((prev) => [{ ...newNotif, _id: nid, id: nid }, ...prev.filter(n => (n._id || n.id) !== nid)]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on('notification_broadcast', (data) => {
      if (data.userId === user._id && data.notification) {
        const nid = data.notification._id || data.notification.id;
        const normalized = { ...data.notification, _id: nid, id: nid };
        setNotifications((prev) => [normalized, ...prev.filter(n => (n._id || n.id) !== nid)]);
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user?._id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/notifications`);
      // Normalize: ensure every notification has both _id and id set
      const normalized = (res.data.notifications || []).map(n => ({
        ...n,
        _id: n._id || n.id,
        id: n.id || n._id
      }));
      setNotifications(normalized);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/read-all`);
      setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const markAsRead = async (id) => {
    if (!id) return; // Guard against undefined IDs
    try {
      await axios.put(`${API_BASE_URL}/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map(n => ((n._id || n.id) === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const deleteNotification = async (e, id) => {
    e.stopPropagation();
    if (!id) return; // Guard against undefined IDs
    try {
      await axios.delete(`${API_BASE_URL}/notifications/${id}`);
      const deleted = notifications.find(n => (n._id || n.id) === id);
      setNotifications((prev) => prev.filter(n => (n._id || n.id) !== id));
      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/notifications/clear-all`);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const handleRespondInvitation = async (notifId, action) => {
    setActingId(notifId + action);
    try {
      const res = await axios.post(`${API_BASE_URL}/notifications/${notifId}/respond-invitation`, {
        action
      });

      // Update in local state
      setNotifications((prev) =>
        prev.map(n => {
          if ((n._id || n.id) === notifId) {
            return {
              ...n,
              isRead: true,
              data: { ...(n.data || {}), status: action === 'accept' ? 'accepted' : 'declined' },
              title: action === 'accept' ? '🤝 Clinic Team Invitation (Accepted)' : '🤝 Clinic Team Invitation (Declined)',
              message: action === 'accept'
                ? `You accepted the invitation from Dr. ${res.data.doctorName || 'Doctor'}. You can now manage their clinic appointments from the "Clinic Appointments" tab.`
                : `You declined the invitation from Dr. ${res.data.doctorName || 'Doctor'}.`
            };
          }
          return n;
        })
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Refresh staff assignments so the separate tab appears instantly in Navbar!
      if (action === 'accept') {
        await refreshStaffAssignments();
        alert(`Success! You have joined Dr. ${res.data.doctorName || 'Doctor'}'s clinic team. Check your Navbar for the new "Clinic Appointments" tab.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to respond to invitation');
    } finally {
      setActingId(null);
    }
  };

  const formatTime = (dateStr) => {
    try {
      const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch (e) {
      return '';
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'team_invitation':
        return <Users size={16} color="#6366f1" />;
      case 'team_accepted':
        return <CheckCircle size={16} color="#10b981" />;
      case 'emergency':
        return <ShieldAlert size={16} color="#ef4444" />;
      case 'appointment_booked':
        return <Calendar size={16} color="#38bdf8" />;
      case 'appointment_update':
        return <Clock size={16} color="#f59e0b" />;
      default:
        return <Bell size={16} color="#94a3b8" />;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: unreadCount > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)',
          position: 'relative',
          transition: 'all 0.2s ease'
        }}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: '#ef4444',
              color: 'white',
              fontSize: '0.68rem',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              padding: '0 4px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: '-10px',
            width: '380px',
            maxHeight: '520px',
            background: 'var(--bg-secondary, #121826)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1)',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: 'var(--accent-primary)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Check size={12} /> Mark read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              maxHeight: '440px'
            }}
          >
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Bell size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>No notifications yet</p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', opacity: 0.7 }}>
                  Updates and team invites will appear here
                </p>
              </div>
            ) : (
              notifications.map((n, index) => {
                const nid = n._id || n.id;
                const isInvite = n.type === 'team_invitation';
                const inviteStatus = n.data?.status;

                return (
                  <div
                    key={nid || `notif-${index}`}
                    onClick={() => !n.isRead && nid && markAsRead(nid)}
                    style={{
                      padding: '0.9rem 1.1rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.06)',
                      transition: 'background 0.15s ease',
                      position: 'relative',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start'
                    }}
                  >
                    {/* Icon Bubble */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      {renderIcon(n.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.2rem'
                        }}
                      >
                        <span
                          style={{
                            fontWeight: n.isRead ? 600 : 700,
                            fontSize: '0.84rem',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {n.title}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {formatTime(n.createdAt)}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.45
                        }}
                      >
                        {n.message}
                      </p>

                      {/* Interactive Buttons for Team Invitation */}
                      {isInvite && (
                        <div style={{ marginTop: '0.65rem' }}>
                          {inviteStatus === 'accepted' ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                color: '#10b981',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '3px 8px',
                                borderRadius: '4px'
                              }}
                            >
                              <CheckCircle size={12} /> Accepted • Clinic Access Enabled
                            </span>
                          ) : inviteStatus === 'declined' ? (
                            <span
                              style={{
                                color: 'var(--text-muted)',
                                fontSize: '0.74rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '3px 8px',
                                borderRadius: '4px'
                              }}
                            >
                              Declined
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{
                                  fontSize: '0.74rem',
                                  padding: '0.35rem 0.75rem',
                                  height: 'auto'
                                }}
                                disabled={actingId === nid + 'accept'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRespondInvitation(nid, 'accept');
                                }}
                              >
                                {actingId === nid + 'accept' ? 'Accepting...' : 'Accept Invitation'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                style={{
                                  fontSize: '0.74rem',
                                  padding: '0.35rem 0.65rem',
                                  height: 'auto',
                                  color: 'var(--text-muted)'
                                }}
                                disabled={actingId === nid + 'decline'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRespondInvitation(nid, 'decline');
                                }}
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Delete Message Button */}
                    <button
                      type="button"
                      onClick={(e) => deleteNotification(e, nid)}
                      title="Delete notification"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0.6,
                        transition: 'opacity 0.2s',
                        marginTop: '2px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
