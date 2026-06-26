import { LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, role, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="navGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8"/>
              <stop offset="50%" stopColor="#6366f1"/>
              <stop offset="100%" stopColor="#4f46e5"/>
            </linearGradient>
          </defs>
          <path d="M18 4h12v14h14v12H30v14H18V30H4V18h14V4z" fill="none" stroke="url(#navGrad)" strokeWidth="2.5" strokeLinejoin="round"/>
          <polyline points="6,24 16,24 19,16 22,32 25,12 28,30 31,24 42,24" fill="none" stroke="url(#navGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>MedZoo</span>
      </Link>

      {isAuthenticated && (
        <div className="navbar-links">
          {role === 'patient' && (
            <>
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Dashboard</Link>
              <Link to="/discover" className={location.pathname === '/discover' ? 'active' : ''}>Find Doctors</Link>
              <Link to="/contacts" className={location.pathname === '/contacts' ? 'active' : ''}>Contacts</Link>
            </>
          )}
          {role === 'doctor' && (
            <>
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>Analytics</Link>
              <Link to="/patients" className={location.pathname === '/patients' ? 'active' : ''}>Patients</Link>
              <Link to="/appointments" className={location.pathname === '/appointments' ? 'active' : ''}>Appointments</Link>
              <Link to="/referrals" className={location.pathname === '/referrals' ? 'active' : ''}>Referrals</Link>
            </>
          )}
        </div>
      )}

      <div className="navbar-actions">
        {isAuthenticated ? (
          <div className="navbar-user" style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }} title="View Profile">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-full)',
                  objectFit: 'cover', border: '1.5px solid var(--accent-primary)'
                }} />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-full)',
                  background: 'var(--gradient-primary)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 800, color: 'white'
                }}>
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="user-name" style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.2 }}>{user?.name}</div>
                <div className="user-role" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize', margin: 0 }}>{role}</div>
              </div>
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={logout} style={{ padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
