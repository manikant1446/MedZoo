import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/common/Navbar';
import Login from './components/common/Login';
import Register from './components/common/Register';
import Profile from './components/common/Profile';
import PatientDashboard from './components/patient/PatientDashboard';
import DoctorDiscovery from './components/patient/DoctorDiscovery';
import ContactManager from './components/patient/ContactManager';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import PatientList from './components/doctor/PatientList';
import ReferralManager from './components/doctor/ReferralManager';
import AppointmentManager from './components/doctor/AppointmentManager';

function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/dashboard" />;
  return children;
}

function DashboardRouter() {
  const { role } = useAuth();
  if (role === 'doctor') return <DoctorDashboard />;
  return <PatientDashboard />;
}

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />

        {/* Dashboard (role-based) */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardRouter /></ProtectedRoute>
        } />

        {/* Profile */}
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />

        {/* Patient routes */}
        <Route path="/discover" element={
          <ProtectedRoute allowedRole="patient"><DoctorDiscovery /></ProtectedRoute>
        } />
        <Route path="/contacts" element={
          <ProtectedRoute allowedRole="patient"><ContactManager /></ProtectedRoute>
        } />

        {/* Doctor routes */}
        <Route path="/patients" element={
          <ProtectedRoute allowedRole="doctor"><PatientList /></ProtectedRoute>
        } />
        <Route path="/referrals" element={
          <ProtectedRoute allowedRole="doctor"><ReferralManager /></ProtectedRoute>
        } />
        <Route path="/appointments" element={
          <ProtectedRoute allowedRole="doctor"><AppointmentManager /></ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
