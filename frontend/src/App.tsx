import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { Appointments } from './pages/Appointments';
import { Billing } from './pages/Billing';
import { Staff } from './pages/Staff';
import './styles/theme.css';
import { LayoutDashboard, Users, Calendar, Receipt, LogOut, Stethoscope, UserCheck } from 'lucide-react';

type ActivePage = 'dashboard' | 'patients' | 'appointments' | 'billing' | 'staff';

const MainAppContent: React.FC = () => {
  const { user, tenantName, logout } = useAuth();
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');

  const renderActivePage = () => {
    switch (activePage) {
      case 'patients':
        return <Patients />;
      case 'appointments':
        return <Appointments />;
      case 'billing':
        return <Billing />;
      case 'staff':
        return <Staff />;
      default:
        return <Dashboard />;
    }
  };

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
            <li
              className={`sidebar-item ${activePage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActivePage('dashboard')}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </li>
            <li
              className={`sidebar-item ${activePage === 'patients' ? 'active' : ''}`}
              onClick={() => setActivePage('patients')}
            >
              <Users size={20} />
              <span>Patients</span>
            </li>
            <li
              className={`sidebar-item ${activePage === 'appointments' ? 'active' : ''}`}
              onClick={() => setActivePage('appointments')}
            >
              <Calendar size={20} />
              <span>Appointments</span>
            </li>
            <li
              className={`sidebar-item ${activePage === 'billing' ? 'active' : ''}`}
              onClick={() => setActivePage('billing')}
            >
              <Receipt size={20} />
              <span>Billing</span>
            </li>
            {user?.role === 'ADMIN' && (
              <li
                className={`sidebar-item ${activePage === 'staff' ? 'active' : ''}`}
                onClick={() => setActivePage('staff')}
              >
                <UserCheck size={20} />
                <span>Staff Management</span>
              </li>
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
        {renderActivePage()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthConsumer />
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
