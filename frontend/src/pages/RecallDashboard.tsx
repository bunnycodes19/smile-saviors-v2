import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { Bell, Clock, Plus, Trash2, Send, AlertCircle, CheckCircle } from 'lucide-react';

interface RecallSchedule {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  procedureType: string;
  dueDate: string;
  status: string; // pending | booked | completed | missed
  reminderSent: boolean;
  reminderSentAt: string | null;
}

interface RecallRule {
  id: string;
  procedureType: string;
  intervalDays: number;
  reminderText: string | null;
}

export const RecallDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [schedules, setSchedules] = useState<RecallSchedule[]>([]);
  const [rules, setRules] = useState<RecallRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Rule creation form state
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [procType, setProcType] = useState('Routine Cleaning');
  const [intervalDays, setIntervalDays] = useState(180);
  const [reminderText, setReminderText] = useState('Time for your 6-month dental checkup!');
  const [savingRule, setSavingRule] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'overdue' | 'due-this-week'>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const rulesData = await apiRequest('/recalls/rules');
      setRules(rulesData);
      
      let schedulesUrl = '/recalls/schedules';
      if (filterType === 'overdue') {
        schedulesUrl += '?overdue=true';
      } else if (filterType === 'due-this-week') {
        schedulesUrl += '?dueThisWeek=true';
      }
      
      const schedulesData = await apiRequest(schedulesUrl);
      setSchedules(schedulesData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recalls data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType]);

  const handleSendReminder = async (id: string) => {
    try {
      const res = await apiRequest(`/recalls/schedules/${id}/remind`, { method: 'POST' });
      if (res && res.success) {
        // Refresh schedules
        fetchData();
        alert('Reminder message successfully sent to patient via WhatsApp!');
      } else {
        alert('Failed to send reminder.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error sending reminder.');
    }
  };

  const handleCreateRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingRule(true);
      await apiRequest('/recalls/rules', {
        method: 'POST',
        body: JSON.stringify({
          procedureType: procType,
          intervalDays: Number(intervalDays),
          reminderText,
        }),
      });
      setShowRuleModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create rule');
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this recall rule?')) return;
    try {
      await apiRequest(`/recalls/rules/${ruleId}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete rule');
    }
  };

  // Compute stat summary card counts
  const pendingCount = schedules.filter(s => s.status === 'pending').length;
  const overdueCount = schedules.filter(s => {
    const today = new Date().toISOString().split('T')[0];
    return s.dueDate < today && s.status === 'pending';
  }).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Recall & Follow-up Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Track patient recovery checks, routine hygiene scale appointments, and automatic notification dispatching.
          </p>
        </div>
        {user?.role === 'ADMIN' && (
          <button onClick={() => setShowRuleModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Manage Recall Rules
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--color-primary)' }}>
            <Bell size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Pending Recalls</div>
            <div className="stat-value">{pendingCount}</div>
          </div>
        </div>

        <div className="stat-card" style={{ border: overdueCount > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : 'none' }}>
          <div className="stat-icon" style={{ color: '#ef4444' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Overdue Recalls</div>
            <div className="stat-value" style={{ color: overdueCount > 0 ? '#ef4444' : 'inherit' }}>{overdueCount}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--color-success)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Configured Clinic Rules</div>
            <div className="stat-value">{rules.length}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recall Schedule List + Rules Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* Recalls table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="card-title" style={{ margin: 0 }}>Follow-up Schedule</h2>
            
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                onClick={() => setFilterType('all')} 
                className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                All
              </button>
              <button 
                onClick={() => setFilterType('overdue')} 
                className={`btn ${filterType === 'overdue' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Overdue
              </button>
              <button 
                onClick={() => setFilterType('due-this-week')} 
                className={`btn ${filterType === 'due-this-week' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Due This Week
              </button>
            </div>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>Loading follow-ups...</p>
          ) : error ? (
            <div style={{ color: 'var(--color-danger)', padding: '20px 0' }}>{error}</div>
          ) : schedules.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>No pending recalls found matching the current filter.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Procedure Type</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Reminder Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => {
                    const isOverdue = new Date(s.dueDate) < new Date() && s.status === 'pending';
                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.patientName}</td>
                        <td>{s.procedureType}</td>
                        <td style={{ color: isOverdue ? '#ef4444' : 'inherit', fontWeight: isOverdue ? 600 : 'normal' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isOverdue && <AlertCircle size={14} />}
                            {new Date(s.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${s.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td>
                          {s.reminderSent ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              Sent ({new Date(s.reminderSentAt!).toLocaleDateString()})
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Not Sent</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => handleSendReminder(s.id)} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            disabled={s.status !== 'pending'}
                          >
                            <Send size={12} /> Send WhatsApp
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rules side widget */}
        <div className="card">
          <h2 className="card-title">Clinic Recall Rules</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            Clinic rules auto-schedule follow-ups when treatments are completed.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rules.map((rule) => (
              <div 
                key={rule.id} 
                className="card" 
                style={{ 
                  padding: '12px', 
                  margin: 0, 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid var(--panel-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{rule.procedureType}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Interval: <strong>{rule.intervalDays} days</strong>
                  </div>
                  {rule.reminderText && (
                    <div style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                      "{rule.reminderText}"
                    </div>
                  )}
                </div>
                {user?.role === 'ADMIN' && (
                  <button 
                    onClick={() => handleDeleteRule(rule.id)}
                    style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Rule Modal */}
      {showRuleModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <h2 style={{ marginBottom: '20px' }}>Configure Recall Interval</h2>
            <form onSubmit={handleCreateRuleSubmit}>
              <div className="form-group">
                <label className="form-label">Procedure Type</label>
                <select className="form-input" value={procType} onChange={(e) => setProcType(e.target.value)}>
                  <option value="Routine Cleaning">Routine Cleaning</option>
                  <option value="Root Canal treatment">Root Canal treatment</option>
                  <option value="Tooth Extraction">Tooth Extraction</option>
                  <option value="Dental Crown">Dental Crown</option>
                  <option value="Composite Filling">Composite Filling</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Follow-up Days Interval</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={intervalDays} 
                  onChange={(e) => setIntervalDays(Number(e.target.value))} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp Template Message</label>
                <textarea 
                  className="form-input" 
                  value={reminderText} 
                  onChange={(e) => setReminderText(e.target.value)} 
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Hello! It is time for your follow-up check..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowRuleModal(false)} className="btn btn-secondary" disabled={savingRule}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingRule}>
                  {savingRule ? 'Saving...' : 'Save Recall Interval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
