import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';
import { Stethoscope } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register clinic + user
        await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            clinicName,
            subdomain,
            email,
            password,
            firstName,
            lastName,
            phone,
          }),
        });
        
        // Auto switch to login
        setIsRegister(false);
        setError('Clinic registered successfully! Please log in.');
      } else {
        // Login
        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        login(data.accessToken, data.user, data.tenantName);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const loadDemoAdmin = () => {
    setEmail('admin@smile.com');
    setPassword('password');
    setIsRegister(false);
  };

  const loadDemoDentist = () => {
    setEmail('dentist@smile.com');
    setPassword('password');
    setIsRegister(false);
  };

  const loadDemoReceptionist = () => {
    setEmail('receptionist@smile.com');
    setPassword('password');
    setIsRegister(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Stethoscope size={32} />
            <span>Smile Saviours</span>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isRegister
              ? 'Register your clinic for the premium SaaS experience'
              : 'Sign in to access your multi-tenant workspace'}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: error.includes('success') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: error.includes('success') ? 'var(--color-success)' : 'var(--color-danger)',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Clinic Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Bright Smile Center"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subdomain Slug</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="bright-smile"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="555-0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@smile.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isRegister ? 'Register & Setup' : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isRegister ? 'Already have a clinic workspace?' : "Don't have a workspace?"}
          </span>{' '}
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
          >
            {isRegister ? 'Login here' : 'Register Clinic'}
          </span>
        </div>

        {!isRegister && (
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--panel-border)', paddingTop: '20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center' }}>
              ⚡ DEMO PRE-SETS (Password: `password`):
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={loadDemoAdmin} className="btn btn-secondary" style={{ padding: '8px', fontSize: '12px' }}>
                Load Admin (Emily Stone)
              </button>
              <button onClick={loadDemoDentist} className="btn btn-secondary" style={{ padding: '8px', fontSize: '12px' }}>
                Load Dentist (Dr. Arthur Dent)
              </button>
              <button onClick={loadDemoReceptionist} className="btn btn-secondary" style={{ padding: '8px', fontSize: '12px' }}>
                Load Receptionist (Sarah Connor)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
