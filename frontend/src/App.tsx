import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { Appointments } from './pages/Appointments';
import { Billing } from './pages/Billing';
import { Staff } from './pages/Staff';
import { RecallDashboard } from './pages/RecallDashboard';
import { InventoryPage } from './pages/InventoryPage';
import { LabOrdersPage } from './pages/LabOrdersPage';
import { ClinicSettingsPage } from './pages/ClinicSettingsPage';
import './styles/theme.css';
import { LayoutDashboard, Users, Calendar, Receipt, LogOut, Stethoscope, UserCheck, Bell, Package, Clipboard, Settings } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, tenantName, logout } = useAuth();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'rgba(244, 63, 94, 0.15)'; // Rose Red
      case 'DENTIST':
        return 'rgba(6, 182, 212, 0.15)'; // Cyan
      default:
        return 'rgba(99, 102, 241, 0.15)'; // Indigo
    }
  };

  const getRoleTextColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '#f43f5e';
      case 'DENTIST':
        return '#06b6d4';
      default:
        return '#6366f1';
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">
            <Stethoscope size={28} />
            <span>Smile Saviours</span>
          </div>

          <nav className="sidebar-menu">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/patients"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Users size={20} />
              <span>Patients</span>
            </NavLink>
            <NavLink
              to="/appointments"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Calendar size={20} />
              <span>Appointments</span>
            </NavLink>
            <NavLink
              to="/billing"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Receipt size={20} />
              <span>Billing</span>
            </NavLink>
            <NavLink
              to="/recalls"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Bell size={20} />
              <span>Recalls</span>
            </NavLink>
            <NavLink
              to="/inventory"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Package size={20} />
              <span>Inventory</span>
            </NavLink>
            <NavLink
              to="/lab-orders"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Clipboard size={20} />
              <span>Lab Orders</span>
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>
            {user?.role === 'ADMIN' && (
              <NavLink
                to="/staff"
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <UserCheck size={20} />
                <span>Staff Management</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Sidebar Footer / User Context */}
        {user && (
          <div className="sidebar-footer">
            <div style={{ paddingBottom: '16px' }}>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>{user.firstName} {user.lastName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span
                  className="badge"
                  style={{
                    background: getRoleBadgeColor(user.role),
                    color: getRoleTextColor(user.role),
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    padding: '2px 8px',
                  }}
                >
                  {user.role}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tenantName}</span>
              </div>
            </div>
            <button onClick={logout} className="sidebar-item" style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer' }}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content View */}
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetailPage />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/recalls" element={<RecallDashboard />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/lab-orders" element={<LabOrdersPage />} />
          <Route path="/settings" element={<ClinicSettingsPage />} />
          {user?.role === 'ADMIN' ? (
            <Route path="/staff" element={<Staff />} />
          ) : (
            <Route path="/staff" element={<Navigate to="/dashboard" replace />} />
          )}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthConsumer />
      </BrowserRouter>
    </AuthProvider>
  );
};

const AuthConsumer: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
        Loading Smile Saviours Workspace...
      </div>
    );
  }

  return isAuthenticated ? <MainAppContent /> : <Auth />;
};

export default App;
