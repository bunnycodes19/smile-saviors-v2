import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { Coins, Shield, Save, ToggleLeft, HelpCircle } from 'lucide-react';


export const ClinicSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [toothNumbering, setToothNumbering] = useState('fdi');
  const [currency, setCurrency] = useState('INR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/clinic-settings');
      if (data) {
        setToothNumbering(data.toothNumbering);
        setCurrency(data.currency);
        setDateFormat(data.dateFormat);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load clinic settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setSaving(true);
      await apiRequest('/clinic-settings', {
        method: 'PUT',
        body: JSON.stringify({
          toothNumbering,
          currency,
          dateFormat,
        }),
      });
      alert('Clinic preferences saved successfully! Relog or refresh the page to apply all changes.');
      fetchSettings();
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getToothNumberingExplanation = () => {
    switch (toothNumbering) {
      case 'fdi':
        return 'FDI Two-Digit Notation: Teeth are designated by a two-digit code. First digit is quadrant (1-4 for adults, 5-8 for kids), second is tooth index (1-8 from midline). Overwhelmingly preferred in Europe, India, and Australia.';
      case 'universal':
        return 'Universal Numbering System: Numbers 1-32 sequentially starting from upper right third molar (1), around to upper left (16), down to lower left third molar (17), and back to lower right third molar (32). Standard in the United States.';
      case 'palmer':
        return 'Palmer Notation System: Quadrant symbol (┘, └, ┐, ┌) containing the tooth number (1-8 from midline). Highly favored by orthodontists and oral surgeons for visual clarity.';
      default:
        return '';
    }
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading settings...</div>;
  if (error) return <div style={{ color: 'var(--color-danger)' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="dashboard-hero" style={{ marginBottom: '24px' }}>
        <div className="hero-content">
          <h1>Clinic Settings</h1>
          <p>Configure localization preferences, currencies, date formats, and clinical notation preferences.</p>
        </div>
      </div>

      {!isAdmin && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <Shield size={20} style={{ color: 'var(--color-danger)' }} />
          <div>
            <span style={{ fontWeight: 600, color: '#fff' }}>Access Restricted: </span>
            <span style={{ color: 'var(--text-secondary)' }}>Only Clinic Administrators (ADMIN role) can update settings and preferences.</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
          
          {/* Tooth Numbering Preferences */}
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '16px', marginTop: 0, borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}>
              <ToggleLeft size={20} style={{ color: 'var(--color-secondary)' }} /> Tooth Numbering Notation
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '16px', alignItems: 'start' }}>
              <div className="form-group">
                <label className="form-label">Notation Standard</label>
                <select
                  className="form-control"
                  disabled={!isAdmin}
                  value={toothNumbering}
                  onChange={(e) => setToothNumbering(e.target.value)}
                >
                  <option value="fdi">FDI Two-Digit (11 - 48)</option>
                  <option value="universal">Universal System (1 - 32)</option>
                  <option value="palmer">Palmer Notation (┘1 - 8┌)</option>
                </select>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '10px', lineHeight: 1.5 }}>
                <HelpCircle size={36} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>Notation Context</strong>
                  {getToothNumberingExplanation()}
                </div>
              </div>
            </div>
          </div>

          {/* Localization Preferences */}
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '16px', marginTop: 0, borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}>
              <Coins size={20} style={{ color: 'var(--color-success)' }} /> Localization and Financials
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <select
                  className="form-control"
                  disabled={!isAdmin}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="INR">₹ (INR - Indian Rupee)</option>
                  <option value="USD">$ (USD - US Dollar)</option>
                  <option value="EUR">€ (EUR - Euro)</option>
                  <option value="GBP">£ (GBP - British Pound)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Display Date Format</label>
                <select
                  className="form-control"
                  disabled={!isAdmin}
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 24/06/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 06/24/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-06-24)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          {isAdmin && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--panel-border)', paddingTop: '20px', marginTop: '10px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={18} /> {saving ? 'Saving Changes...' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
