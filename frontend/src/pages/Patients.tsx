import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import { Search, UserPlus, Eye } from 'lucide-react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string | null;
  address: string | null;
  medicalHistory: string[];
  allergies: string[];
}

export const Patients: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');

  // Create Patient Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [medHistoryInput, setMedHistoryInput] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');

  const fetchPatients = async (query = '') => {
    try {
      setLoading(true);
      const data = await apiRequest(`/patients?search=${query}`);
      setPatients(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(search);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const historyArr = medHistoryInput.split(',').map((s) => s.trim()).filter(Boolean);
      const allergiesArr = allergiesInput.split(',').map((s) => s.trim()).filter(Boolean);

      const newPatient = await apiRequest('/patients', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          dob,
          gender,
          phone,
          email: email || undefined,
          address: address || undefined,
          medicalHistory: historyArr,
          allergies: allergiesArr,
        }),
      });

      setPatients((prev) => [...prev, newPatient]);
      setShowCreateModal(false);
      resetPatientForm();
      // Navigate straight to the details of the newly registered patient
      navigate(`/patients/${newPatient.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to register patient');
    }
  };

  const resetPatientForm = () => {
    setFirstName('');
    setLastName('');
    setDob('');
    setGender('Male');
    setPhone('');
    setEmail('');
    setAddress('');
    setMedHistoryInput('');
    setAllergiesInput('');
    setError('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Patient Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Manage and view all clinical patient records in one place.
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <UserPlus size={18} />
          Register Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Search patients by name, phone number, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Patient Directory Table */}
      <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading patient records...
          </div>
        ) : patients.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No patient records found. Register a new patient to get started.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age / DOB</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Allergies</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => {
                  const age = new Date().getFullYear() - new Date(p.dob).getFullYear();
                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => navigate(`/patients/${p.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</td>
                      <td>{age} yrs ({p.dob})</td>
                      <td>{p.gender}</td>
                      <td>{p.phone}</td>
                      <td>{p.email || '-'}</td>
                      <td>
                        {p.allergies.length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {p.allergies.slice(0, 2).map((a, i) => (
                              <span key={i} className="badge badge-danger" style={{ fontSize: '10px', textTransform: 'none' }}>{a}</span>
                            ))}
                            {p.allergies.length > 2 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{p.allergies.length - 2}</span>}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>None</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/patients/${p.id}`);
                          }}
                        >
                          <Eye size={14} /> View Hub
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

      {/* Register Patient Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '20px' }}>Register New Patient</h2>
            {error && <div style={{ color: 'var(--color-danger)', marginBottom: '15px' }}>{error}</div>}
            <form onSubmit={handleCreatePatient}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-input" value={dob} onChange={(e) => setDob(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Medical History (comma separated)</label>
                <input type="text" className="form-input" placeholder="Hypertension, Diabetes" value={medHistoryInput} onChange={(e) => setMedHistoryInput(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Allergies (comma separated)</label>
                <input type="text" className="form-input" placeholder="Penicillin, Latex" value={allergiesInput} onChange={(e) => setAllergiesInput(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => { setShowCreateModal(false); resetPatientForm(); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
