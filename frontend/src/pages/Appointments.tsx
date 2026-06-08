import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { Plus, Calendar as CalendarIcon, Clock, Check, RefreshCw, XCircle } from 'lucide-react';

interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reason: string;
  notes: string | null;
  patientFirstName: string;
  patientLastName: string;
  patientPhone: string;
  dentistFirstName: string;
  dentistLastName: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

export const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [error, setError] = useState('');

  // Booking Form states
  const [patientId, setPatientId] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('10:00');
  const [reason, setReason] = useState('Routine Checkup');
  const [notes, setNotes] = useState('');

  // Demonstration Dentist ID (seeded Dr. Arthur Dent)
  // In a full application, this is queried dynamically, but we can query it or fallback safely.
  const [dentists, setDentists] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const appts = await apiRequest('/appointments');
      setAppointments(appts);
      
      const pts = await apiRequest('/patients');
      setPatients(pts);

      // Search for dentists in seeded clinic
      // Since seed contains dentist@smile.com, we can grab it or we can fallback.
      // Fetching is ideal, let's look for dentist:
      // In this demo, we'll auto-extract the dentist's ID from existing appointments
      // or set a default.
      if (appts.length > 0) {
        const uniqueDentists = Array.from(
          new Map(appts.map((item: any) => [item.dentistId, { id: item.dentistId, name: `Dr. ${item.dentistFirstName} ${item.dentistLastName}` }])).values()
        );
        setDentists(uniqueDentists);
        if (uniqueDentists.length > 0) {
          // default dentist
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Resolve start and end ISO timestamps
    const startTimeStr = `${bookingDate}T${startHour}:00`;
    const endTimeStr = `${bookingDate}T${endHour}:00`;

    // Try to find default dentist ID
    // If no dentist mapped yet, use a standard UUID or placeholder.
    let dentistId = '';
    if (dentists.length > 0) {
      dentistId = dentists[0].id;
    } else if (appointments.length > 0) {
      dentistId = appointments[0].dentistId;
    } else {
      setError('Please ensure a dentist is registered in the clinic first.');
      return;
    }

    try {
      await apiRequest('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          dentistId,
          startTime: new Date(startTimeStr).toISOString(),
          endTime: new Date(endTimeStr).toISOString(),
          reason,
          notes: notes || undefined,
        }),
      });

      setShowBookModal(false);
      resetForm();
      fetchData(); // reload
    } catch (err: any) {
      setError(err.message || 'Failed to schedule appointment');
    }
  };

  const handleUpdateStatus = async (apptId: string, status: string) => {
    try {
      await apiRequest(`/appointments/${apptId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setSelectedAppt(null);
      fetchData(); // reload
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setPatientId('');
    setReason('Routine Checkup');
    setNotes('');
  };

  // Convert Hour string to slot index for scheduler positioning (8:00 AM is index 0)
  const calculatePosition = (startTimeStr: string, endTimeStr: string) => {
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);
    
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    
    const baseHour = 8; // Scheduler starts at 8:00 AM
    const slotHeight = 80; // height of 1 hour in pixels
    
    const top = (startHour - baseHour) * slotHeight;
    const height = (endHour - startHour) * slotHeight;
    
    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  // List of hours for vertical sidebar (8:00 AM to 6:00 PM)
  const hours = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8;
    return hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Appointment Scheduler</h1>
        <button onClick={() => setShowBookModal(true)} className="btn btn-primary">
          <Plus size={18} />
          Book Appointment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Scheduler Grid (Vite Calendar) */}
        <div className="card" style={{ padding: '10px' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--panel-border)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={18} style={{ color: 'var(--color-primary)' }} />
            <span>Clinic Schedule - {new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          {loading ? (
            <p style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading schedule...</p>
          ) : (
            <div className="scheduler-grid" style={{ marginTop: '16px' }}>
              {/* Hours Sidebar */}
              <div className="scheduler-sidebar">
                {hours.map((h, i) => (
                  <div key={i} className="scheduler-hour-slot">
                    {h}
                  </div>
                ))}
              </div>

              {/* Day Body */}
              <div className="scheduler-body">
                {/* Render background grid lines */}
                {hours.map((_, i) => (
                  <div key={i} className="scheduler-line-slot" />
                ))}

                {/* Render Appointments */}
                {appointments
                  .filter((appt) => appt.status !== 'CANCELLED')
                  .map((appt) => {
                    const pos = calculatePosition(appt.startTime, appt.endTime);
                    const timeLabel = `${new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(appt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                    return (
                      <div
                        key={appt.id}
                        onClick={() => setSelectedAppt(appt)}
                        className="scheduler-appointment-item"
                        style={{ ...pos }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>
                          {appt.patientFirstName} {appt.patientLastName}
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={10} />
                          {timeLabel}
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px', fontStyle: 'italic' }}>
                          {appt.reason}
                        </div>
                        <div style={{ position: 'absolute', right: '10px', top: '10px', fontSize: '9px', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>
                          {appt.status}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Selected Appointment Details / Actions */}
        <div>
          {selectedAppt ? (
            <div className="card">
              <h2 className="card-title">Booking Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
                <div>
                  <p style={{ color: 'var(--text-secondary)' }}>Patient Name</p>
                  <p style={{ fontWeight: 600, fontSize: '16px', marginTop: '2px' }}>
                    {selectedAppt.patientFirstName} {selectedAppt.patientLastName}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)' }}>Assigned Dentist</p>
                  <p style={{ fontWeight: 600, marginTop: '2px' }}>
                    Dr. {selectedAppt.dentistFirstName} {selectedAppt.dentistLastName}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)' }}>Schedule Time</p>
                  <p style={{ fontWeight: 600, marginTop: '2px' }}>
                    {new Date(selectedAppt.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)' }}>Reason for Visit</p>
                  <p style={{ fontWeight: 600, marginTop: '2px' }}>{selectedAppt.reason}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)' }}>Notes</p>
                  <p style={{ fontStyle: 'italic', marginTop: '2px', color: 'var(--text-secondary)' }}>
                    {selectedAppt.notes || 'No receptionist notes added.'}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px', marginTop: '10px' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 500 }}>Update Status</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedAppt.status === 'SCHEDULED' && (
                      <button onClick={() => handleUpdateStatus(selectedAppt.id, 'CHECKED_IN')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '10px' }}>
                        <Check size={14} style={{ color: 'var(--color-success)' }} /> Check In Patient
                      </button>
                    )}
                    {selectedAppt.status === 'CHECKED_IN' && (
                      <button onClick={() => handleUpdateStatus(selectedAppt.id, 'IN_PROGRESS')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '10px' }}>
                        <RefreshCw size={14} style={{ color: 'var(--color-warning)' }} /> Start Treatment
                      </button>
                    )}
                    {(selectedAppt.status === 'IN_PROGRESS' || selectedAppt.status === 'CHECKED_IN') && (
                      <button onClick={() => handleUpdateStatus(selectedAppt.id, 'COMPLETED')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '10px' }}>
                        <Check size={14} style={{ color: 'var(--color-success)' }} /> Complete Session
                      </button>
                    )}
                    {selectedAppt.status !== 'COMPLETED' && selectedAppt.status !== 'CANCELLED' && (
                      <button onClick={() => handleUpdateStatus(selectedAppt.id, 'CANCELLED')} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '10px', color: 'var(--color-danger)' }}>
                        <XCircle size={14} /> Cancel Appointment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              Select an appointment card in the calendar to view notes and toggle statuses.
            </div>
          )}
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '20px' }}>Book Appointment Slot</h2>
            {error && <div style={{ color: 'var(--color-danger)', marginBottom: '15px' }}>{error}</div>}
            <form onSubmit={handleBookAppointment}>
              <div className="form-group">
                <label className="form-label">Select Patient</label>
                <select className="form-input" value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Appointment Date</label>
                <input type="date" className="form-input" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <select className="form-input" value={startHour} onChange={(e) => setStartHour(e.target.value)}>
                    <option value="08:00">08:00 AM</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <select className="form-input" value={endHour} onChange={(e) => setEndHour(e.target.value)}>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Visit</label>
                <input type="text" className="form-input" placeholder="Routine Cleaning, Tooth Ache..." value={reason} onChange={(e) => setReason(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Receptionist Notes</label>
                <textarea
                  className="form-input"
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Additional patient requests or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowBookModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
