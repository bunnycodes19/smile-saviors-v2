import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { Users, Calendar, DollarSign, FileText } from 'lucide-react';

interface StatData {
  totalPatients: number;
  todayAppointments: number;
  totalRevenue: string;
  outstandingBills: string;
  latestAppointments: Array<{
    id: string;
    startTime: string;
    reason: string;
    status: string;
    patientFirstName: string;
    patientLastName: string;
  }>;
  revenueHistory: Array<{
    date: string;
    revenue: number;
  }>;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchStats = async () => {
    try {
      const stats = await apiRequest('/dashboard/stats');
      setData(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading dashboard data...</div>;
  if (error) return <div style={{ color: 'var(--color-danger)' }}>{error}</div>;
  if (!data) return null;

  // Find maximum revenue to scale custom chart
  const maxRevenue = Math.max(...data.revenueHistory.map((r) => r.revenue), 100);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-success">Completed</span>;
      case 'CHECKED_IN':
        return <span className="badge badge-info">Checked In</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-warning">In Progress</span>;
      case 'CANCELLED':
        return <span className="badge badge-danger">Cancelled</span>;
      default:
        return <span className="badge badge-warning">Scheduled</span>;
    }
  };

  return (
    <div>
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1>{getGreeting()}, {user?.firstName || 'Staff'}!</h1>
          <p>Welcome back to your workspace. Here is a summary of your clinic's performance and operations today.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Total Patients</div>
            <div className="stat-value">{data.totalPatients}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--color-secondary)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Today's Appointments</div>
            <div className="stat-value">{data.todayAppointments}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--color-success)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Total Revenue</div>
            <div className="stat-value">${data.totalRevenue}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--color-danger)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Outstanding Balance</div>
            <div className="stat-value">${data.outstandingBills}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px', alignItems: 'start' }}>
        {/* Revenue History (Custom CSS Chart) */}
        <div className="card">
          <h2 className="card-title">Revenue (Last 7 Days)</h2>
          <div className="bar-chart-container">
            {data.revenueHistory.map((item, idx) => {
              const heightPercent = `${(item.revenue / maxRevenue) * 85 + 5}%`; // limit to 90% height max
              // Format date label (e.g. "Jun 08")
              const dateLabel = new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
              });

              return (
                <div key={idx} className="bar-column">
                  <div className="bar-fill" style={{ height: heightPercent }}>
                    <div className="bar-tooltip">${item.revenue.toFixed(2)}</div>
                  </div>
                  <div className="bar-label">{dateLabel}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Latest Activity Log */}
        <div className="card">
          <h2 className="card-title">Recent Appointments</h2>
          {data.latestAppointments.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No recent appointments scheduled.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.latestAppointments.map((appt) => {
                const time = new Date(appt.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const date = new Date(appt.startTime).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={appt.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '12px',
                      borderBottom: '1px solid var(--panel-border)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>
                        {appt.patientFirstName} {appt.patientLastName}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                        {appt.reason} • {date} {time}
                      </div>
                    </div>
                    {getStatusBadge(appt.status)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
