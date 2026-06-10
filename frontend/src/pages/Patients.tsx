import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { Search, UserPlus, Plus, ChevronRight, Stethoscope } from 'lucide-react';

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

interface Treatment {
  id: string;
  toothNumber: number | null;
  procedureName: string;
  notes: string | null;
  price: string;
  status: 'PLANNED' | 'COMPLETED';
  createdAt: string;
}

export const Patients: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Selected Patient details
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogTreatmentModal, setShowLogTreatmentModal] = useState(false);
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

  // Log Treatment Form states
  const [procedureName, setProcedureName] = useState('Routine Cleaning');
  const [treatmentPrice, setTreatmentPrice] = useState('150.00');
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [treatmentStatus, setTreatmentStatus] = useState<'PLANNED' | 'COMPLETED'>('COMPLETED');

  const fetchPatients = async (query = '') => {
    try {
      const data = await apiRequest(`/patients?search=${query}`);
      setPatients(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetails = async (patient: Patient) => {
    setSelectedPatient(patient);
    setSelectedTooth(null);
    try {
      const data = await apiRequest(`/patients/${patient.id}/treatments`);
      setTreatments(data);
    } catch (err) {
      console.error(err);
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
      fetchPatientDetails(newPatient);
    } catch (err: any) {
      setError(err.message || 'Failed to create patient');
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
  };

  const handleLogTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setError('');

    try {
      const newTreatment = await apiRequest('/treatments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatient.id,
          toothNumber: selectedTooth || undefined,
          procedureName,
          notes: treatmentNotes || undefined,
          price: treatmentPrice,
          status: treatmentStatus,
        }),
      });

      setTreatments((prev) => [...prev, newTreatment]);
      setShowLogTreatmentModal(false);
      resetTreatmentForm();
    } catch (err: any) {
      setError(err.message || 'Failed to log treatment');
    }
  };

  // Determine pricing defaults based on procedure selection
  const handleProcedureChange = (val: string) => {
    setProcedureName(val);
    if (val === 'Routine Cleaning') setTreatmentPrice('150.00');
    else if (val === 'Composite Filling') setTreatmentPrice('200.00');
    else if (val === 'Root Canal treatment') setTreatmentPrice('800.00');
    else if (val === 'Tooth Extraction') setTreatmentPrice('250.00');
    else if (val === 'Dental Crown') setTreatmentPrice('1200.00');
  };

  const resetTreatmentForm = () => {
    setProcedureName('Routine Cleaning');
    setTreatmentPrice('150.00');
    setTreatmentNotes('');
    setTreatmentStatus('COMPLETED');
    setError('');
  };

  const openLogTreatmentModal = () => {
    resetTreatmentForm();
    setShowLogTreatmentModal(true);
  };

  // Define dental arch teeth mapping (1 to 16 for upper, 17 to 32 for lower)
  const upperTeeth = Array.from({ length: 16 }, (_, i) => i + 1);
  const lowerTeeth = Array.from({ length: 16 }, (_, i) => 32 - i);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Patient Directory</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <UserPlus size={18} />
          Register Patient
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Side: Search & Patient List */}
        <div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" style={{ padding: '12px' }}>
              <Search size={18} />
            </button>
          </form>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading patient files...</p>
          ) : patients.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              No patient records found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {patients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => fetchPatientDetails(p)}
                  className={`card ${selectedPatient?.id === p.id ? 'active' : ''}`}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0',
                    borderLeft: selectedPatient?.id === p.id ? '3px solid var(--color-primary)' : '1px solid var(--panel-border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Phone: {p.phone}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Detail Profile, Dental Chart, Treatment History */}
        <div>
          {selectedPatient ? (
            <div>
              {/* Profile Card */}
              <div className="card">
                <h2 className="card-title">Patient Profile</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '15px' }}>
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }}>Full Name</p>
                    <p style={{ fontWeight: 600, marginTop: '4px' }}>
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }}>Date of Birth (Age)</p>
                    <p style={{ fontWeight: 600, marginTop: '4px' }}>
                      {selectedPatient.dob} ({new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()} yrs)
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }}>Gender</p>
                    <p style={{ fontWeight: 600, marginTop: '4px' }}>{selectedPatient.gender}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)' }}>Phone / Email</p>
                    <p style={{ fontWeight: 600, marginTop: '4px' }}>
                      {selectedPatient.phone} {selectedPatient.email && `| ${selectedPatient.email}`}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '6px' }}>Medical History</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedPatient.medicalHistory.length === 0 ? (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>None recorded</span>
                      ) : (
                        selectedPatient.medicalHistory.map((h, i) => (
                          <span key={i} className="badge badge-info" style={{ textTransform: 'none' }}>{h}</span>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '6px' }}>Allergies</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedPatient.allergies.length === 0 ? (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No known allergies</span>
                      ) : (
                        selectedPatient.allergies.map((a, i) => (
                          <span key={i} className="badge badge-danger" style={{ textTransform: 'none' }}>{a}</span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Dental Chart */}
              <div className="card">
                <div className="card-title">
                  <span>Dental Chart (Tooth Status)</span>
                  {selectedTooth && (
                    <span style={{ fontSize: '13px', color: 'var(--color-primary)' }}>
                      Selected Tooth #{selectedTooth}
                    </span>
                  )}
                </div>
                <div className="dental-chart-container">
                  {/* Upper Arch */}
                  <div className="tooth-arch">
                    {upperTeeth.map((num) => {
                      const isTreated = treatments.some((t) => t.toothNumber === num && t.status === 'COMPLETED');
                      return (
                        <div
                          key={num}
                          onClick={() => setSelectedTooth(selectedTooth === num ? null : num)}
                          className={`tooth-item ${selectedTooth === num ? 'selected' : ''} ${isTreated ? 'treated' : ''}`}
                        >
                          <svg className="tooth-svg" viewBox="0 0 24 24">
                            <path d="M12,2A3,3 0 0,0 9,5C9,7 10.33,8.67 12,9.33C13.67,8.67 15,7 15,5A3,3 0 0,0 12,2M8,10A2,2 0 0,0 6,12C6,14.67 8.67,16.67 12,17C15.33,16.67 18,14.67 18,12A2,2 0 0,0 16,10H8Z" />
                          </svg>
                          <span className="tooth-number">{num}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Lower Arch */}
                  <div className="tooth-arch">
                    {lowerTeeth.map((num) => {
                      const isTreated = treatments.some((t) => t.toothNumber === num && t.status === 'COMPLETED');
                      return (
                        <div
                          key={num}
                          onClick={() => setSelectedTooth(selectedTooth === num ? null : num)}
                          className={`tooth-item ${selectedTooth === num ? 'selected' : ''} ${isTreated ? 'treated' : ''}`}
                        >
                          <svg className="tooth-svg" viewBox="0 0 24 24">
                            <path d="M12,2A3,3 0 0,0 9,5C9,7 10.33,8.67 12,9.33C13.67,8.67 15,7 15,5A3,3 0 0,0 12,2M8,10A2,2 0 0,0 6,12C6,14.67 8.67,16.67 12,17C15.33,16.67 18,14.67 18,12A2,2 0 0,0 16,10H8Z" />
                          </svg>
                          <span className="tooth-number">{num}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontStyle: 'italic', fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                    Select any tooth above to apply a localized clinical treatment or planned procedure.
                  </p>
                </div>
              </div>

              {/* Treatment log */}
              <div className="card">
                <div className="card-title">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Treatment & Dental Log</span>
                    {selectedTooth && (
                      <span
                        className="badge badge-info"
                        style={{ cursor: 'pointer', textTransform: 'none', fontSize: '11px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => setSelectedTooth(null)}
                      >
                        Tooth #{selectedTooth} Filter Active (Clear)
                      </span>
                    )}
                  </div>
                  {(user?.role === 'ADMIN' || user?.role === 'DENTIST') && (
                    <button onClick={openLogTreatmentModal} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                      <Plus size={14} /> Log Procedure
                    </button>
                  )}
                </div>

                {(() => {
                  const filteredTreatments = selectedTooth 
                    ? treatments.filter(t => t.toothNumber === selectedTooth) 
                    : treatments;
                  
                  return filteredTreatments.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      {selectedTooth 
                        ? `No procedures logged for Tooth #${selectedTooth} yet.` 
                        : 'No procedures logged yet.'}
                    </p>
                  ) : (
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Tooth #</th>
                            <th>Procedure</th>
                            <th>Status</th>
                            <th>Cost</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTreatments.map((t) => (
                            <tr key={t.id}>
                              <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                              <td>{t.toothNumber ? `Tooth #${t.toothNumber}` : 'General'}</td>
                              <td>{t.procedureName}</td>
                              <td>
                                <span className={`badge ${t.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                                  {t.status}
                                </span>
                              </td>
                              <td>${t.price}</td>
                              <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <Stethoscope size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3>Select a patient profile to view records, charts, and treatment histories.</h3>
            </div>
          )}
        </div>
      </div>

      {/* 1. Register Patient Modal */}
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
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Log Treatment Modal */}
      {showLogTreatmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '20px' }}>Log Clinical Procedure</h2>
            {error && <div style={{ color: 'var(--color-danger)', marginBottom: '15px' }}>{error}</div>}
            <form onSubmit={handleLogTreatment}>
              <div className="form-group">
                <label className="form-label">Selected Tooth</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedTooth ? `Tooth #${selectedTooth}` : 'General / Whole Mouth'}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Procedure / Treatment</label>
                <select className="form-input" value={procedureName} onChange={(e) => handleProcedureChange(e.target.value)}>
                  <option value="Routine Cleaning">Routine Cleaning</option>
                  <option value="Composite Filling">Composite Filling</option>
                  <option value="Root Canal treatment">Root Canal treatment</option>
                  <option value="Tooth Extraction">Tooth Extraction</option>
                  <option value="Dental Crown">Dental Crown</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={treatmentStatus} onChange={(e) => setTreatmentStatus(e.target.value as any)}>
                    <option value="COMPLETED">Completed / Executed</option>
                    <option value="PLANNED">Planned / Recommended</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cost ($)</label>
                  <input type="text" className="form-input" value={treatmentPrice} onChange={(e) => setTreatmentPrice(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Notes</label>
                <textarea
                  className="form-input"
                  style={{ height: '100px', resize: 'none' }}
                  placeholder="Record diagnosis details, anesthesia used, and follow-up advice..."
                  value={treatmentNotes}
                  onChange={(e) => setTreatmentNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => { setShowLogTreatmentModal(false); resetTreatmentForm(); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Log Procedure</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
