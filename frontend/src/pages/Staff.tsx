import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Plus, Phone, Mail, Shield, ShieldAlert } from 'lucide-react';

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'DENTIST' | 'RECEPTIONIST';
  phone: string | null;
  createdAt: string;
}

export const Staff: React.FC = () => {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'DENTIST' | 'RECEPTIONIST'>('DENTIST');
  const [phone, setPhone] = useState('');

  const fetchStaff = async () => {
    try {
      const data = await apiRequest('/auth/staff');
      setStaffList(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      await apiRequest('/auth/staff', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          role,
          phone: phone || undefined,
        }),
      });

      setShowAddModal(false);
      resetForm();
      fetchStaff(); // reload list
    } catch (err: any) {
      setError(err.message || 'Failed to add staff member');
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setRole('DENTIST');
    setPhone('');
    setError('');
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' };
      case 'DENTIST':
        return { background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' };
      default:
        return { background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' };
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
        <ShieldAlert size={48} style={{ color: 'var(--color-danger)', marginBottom: '15px' }} />
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Only clinic administrators can view or manage staff accounts.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Register, configure, and review accounts for dentists and receptionists.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff directory table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={18} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontWeight: 600 }}>Active Clinic Staff Directory</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading clinic directory...
          </div>
        ) : staffList.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No staff members registered. Add your first dentist or receptionist above.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((member) => {
                  const style = getRoleBadgeStyle(member.role);
                  return (
                    <tr key={member.id}>
                      <td style={{ fontWeight: 600 }}>
                        {member.firstName} {member.lastName}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                          <span>{member.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={style}>
                          {member.role}
                        </span>
                      </td>
                      <td>
                        {member.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                            <span>{member.phone}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {new Date(member.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '20px' }}>Register Clinic Staff</h2>
            {error && <div style={{ color: 'var(--color-danger)', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
            
            <form onSubmit={handleAddStaff}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-input" placeholder="e.g. John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="staff@clinic.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={role} onChange={(e) => setRole(e.target.value as any)} required>
                  <option value="DENTIST">Dentist (Clinical access)</option>
                  <option value="RECEPTIONIST">Receptionist (Front-desk billing & booking)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input type="text" className="form-input" placeholder="555-0199" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  <span>Register Staff</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
