import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { Plus, AlertCircle, Calendar, ShieldAlert } from 'lucide-react';

interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  toothNumber: string | null;
  labName: string;
  labContact: string | null;
  workType: string; // crown | bridge | denture | aligner | etc.
  shade: string | null;
  material: string | null;
  orderDate: string;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  status: string; // ordered | sent_to_lab | in_progress | received | fitted | rework_needed
  cost: number | null;
  patientCharge: number | null;
  notes: string | null;
}

interface StatusHistory {
  id: string;
  status: string;
  changedBy: string;
  changedAt: string;
  notes: string | null;
  changerName: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

const COLUMNS = [
  { id: 'ordered', title: 'Ordered', color: 'rgba(99, 102, 241, 0.15)', textColor: '#6366f1' },
  { id: 'sent_to_lab', title: 'Sent to Lab', color: 'rgba(6, 182, 212, 0.15)', textColor: '#06b6d4' },
  { id: 'in_progress', title: 'In Progress', color: 'rgba(245, 158, 11, 0.15)', textColor: '#f59e0b' },
  { id: 'received', title: 'Received', color: 'rgba(16, 185, 129, 0.15)', textColor: '#10b981' },
  { id: 'fitted', title: 'Fitted', color: 'rgba(139, 92, 246, 0.15)', textColor: '#8b5cf6' },
  { id: 'rework_needed', title: 'Rework Needed', color: 'rgba(244, 63, 94, 0.15)', textColor: '#f43f5e' },
];

export const LabOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering
  const [filterOverdue, setFilterOverdue] = useState(false);

  // New Lab Order Modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderPatientId, setOrderPatientId] = useState('');
  const [orderTooth, setOrderTooth] = useState('');
  const [orderLabName, setOrderLabName] = useState('');
  const [orderLabContact, setOrderLabContact] = useState('');
  const [orderWorkType, setOrderWorkType] = useState('crown');
  const [orderShade, setOrderShade] = useState('');
  const [orderMaterial, setOrderMaterial] = useState('');
  const [orderExpectedDate, setOrderExpectedDate] = useState('');
  const [orderCost, setOrderCost] = useState(0);
  const [orderCharge, setOrderCharge] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);

  // View Details / Update Status Modal
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      let url = '/lab-orders';
      if (filterOverdue) {
        url += '?overdue=true';
      }
      const data = await apiRequest(url);
      setOrders(data);

      const patientsData = await apiRequest('/patients');
      setPatients(patientsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load lab cases data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterOverdue]);

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderPatientId || !orderLabName || !orderWorkType) return;

    try {
      setSavingOrder(true);
      await apiRequest('/lab-orders', {
        method: 'POST',
        body: JSON.stringify({
          patientId: orderPatientId,
          toothNumber: orderTooth || undefined,
          labName: orderLabName,
          labContact: orderLabContact || undefined,
          workType: orderWorkType,
          shade: orderShade || undefined,
          material: orderMaterial || undefined,
          expectedReturnDate: orderExpectedDate || undefined,
          cost: Number(orderCost),
          patientCharge: Number(orderCharge),
          notes: orderNotes || undefined,
        }),
      });
      setShowOrderModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create lab case order');
    } finally {
      setSavingOrder(false);
    }
  };

  const openNewOrderModal = () => {
    setOrderPatientId('');
    setOrderTooth('');
    setOrderLabName('');
    setOrderLabContact('');
    setOrderWorkType('crown');
    setOrderShade('');
    setOrderMaterial('');
    setOrderExpectedDate('');
    setOrderCost(0);
    setOrderCharge(0);
    setOrderNotes('');
    setShowOrderModal(true);
  };

  const openDetailModal = async (order: LabOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
    setStatusNotes('');
    setNextStatus('');

    try {
      setLoadingHistory(true);
      const history = await apiRequest(`/lab-orders/${order.id}/history`);
      setStatusHistory(history);
    } catch (err) {
      console.error('Failed to load status history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !nextStatus) return;

    try {
      setUpdatingStatus(true);
      const res = await apiRequest(`/lab-orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          notes: statusNotes,
        }),
      });

      // Refresh data
      fetchData();
      
      // Update selected order in details modal view
      setSelectedOrder(res);
      setNextStatus('');
      setStatusNotes('');

      // Reload history
      const history = await apiRequest(`/lab-orders/${selectedOrder.id}/history`);
      setStatusHistory(history);
      
      if (nextStatus === 'received') {
        alert('Lab order received! Patient has been notified via WhatsApp message fallback.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update lab case status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isOverdue = (order: LabOrder) => {
    if (order.status === 'received' || order.status === 'fitted') return false;
    if (!order.expectedReturnDate) return false;
    return new Date(order.expectedReturnDate) < new Date();
  };

  const countOverdue = orders.filter(isOverdue).length;

  return (
    <div>
      <div className="dashboard-hero" style={{ marginBottom: '24px' }}>
        <div className="hero-content">
          <h1>Lab Cases Tracker</h1>
          <p>Manage dental prosthetics, crowns, bridges, and shade matching sent to dental labs.</p>
        </div>
        <button className="btn btn-primary" onClick={openNewOrderModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> New Lab Order
        </button>
      </div>

      {countOverdue > 0 && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <ShieldAlert size={24} style={{ color: 'var(--color-danger)' }} />
          <div>
            <span style={{ fontWeight: 600, color: '#fff' }}>Attention Needed: </span>
            <span style={{ color: 'var(--text-secondary)' }}>You have {countOverdue} lab orders that are past their expected return date.</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <AlertCircle size={24} style={{ color: 'var(--color-danger)' }} />
          <div>
            <span style={{ fontWeight: 600, color: '#fff' }}>Error: </span>
            <span style={{ color: 'var(--text-secondary)' }}>{error}</span>
          </div>
        </div>
      )}

      {/* Filter Options */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Filter Options:</span>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={filterOverdue}
                onChange={(e) => setFilterOverdue(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Show Overdue Orders Only
            </label>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'start', overflowX: 'auto', paddingBottom: '16px' }}>
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.id);
          return (
            <div key={col.id} className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', padding: '16px', borderRadius: 'var(--radius-md)', minHeight: '400px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '8px', borderBottom: `2px solid ${col.textColor}` }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0 }}>{col.title}</h3>
                <span className="badge" style={{ background: col.color, color: col.textColor, fontSize: '12px', padding: '2px 8px', borderRadius: '12px' }}>
                  {colOrders.length}
                </span>
              </div>

              {loading ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Loading...</div>
              ) : colOrders.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '30px', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                  No cases
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {colOrders.map((order) => {
                    const overdue = isOverdue(order);
                    return (
                      <div
                        key={order.id}
                        onClick={() => openDetailModal(order)}
                        style={{
                          background: overdue ? 'rgba(239, 68, 68, 0.05)' : 'var(--panel-bg)',
                          border: overdue ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--panel-border)',
                          borderRadius: '6px',
                          padding: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.borderColor = overdue ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = overdue ? 'rgba(239, 68, 68, 0.25)' : 'var(--panel-border)';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{order.patientName}</span>
                          {overdue && (
                            <span style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <AlertCircle size={10} /> LATE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', textTransform: 'capitalize' }}>
                          {order.workType} {order.toothNumber ? `(Tooth ${order.toothNumber})` : ''}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Lab: {order.labName}
                        </div>
                        {order.expectedReturnDate && (
                          <div style={{ fontSize: '11px', color: overdue ? 'var(--color-danger)' : 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} /> Return: {new Date(order.expectedReturnDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Order Modal */}
      {showOrderModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <h2 className="modal-title">Create Lab Case Order</h2>
            <form onSubmit={handleCreateOrderSubmit}>
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select
                  className="form-control"
                  required
                  value={orderPatientId}
                  onChange={(e) => setOrderPatientId(e.target.value)}
                >
                  <option value="">Select Patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Work Type *</label>
                  <select
                    className="form-control"
                    required
                    value={orderWorkType}
                    onChange={(e) => setOrderWorkType(e.target.value)}
                  >
                    <option value="crown">Crown (Caps)</option>
                    <option value="bridge">Bridge</option>
                    <option value="denture">Denture</option>
                    <option value="aligner">Aligner / Ortho</option>
                    <option value="nightguard">Nightguard</option>
                    <option value="retainer">Retainer</option>
                    <option value="veneer">Veneer</option>
                    <option value="inlay_onlay">Inlay / Onlay</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tooth Number (FDI/Universal)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 26 or 46"
                    value={orderTooth}
                    onChange={(e) => setOrderTooth(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Dental Lab Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Clove Lab, Prime Dental Lab"
                    value={orderLabName}
                    onChange={(e) => setOrderLabName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lab Contact Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. +91 999888777"
                    value={orderLabContact}
                    onChange={(e) => setOrderLabContact(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">VITA Shade Matching</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. A2, A3, B1"
                    value={orderShade}
                    onChange={(e) => setOrderShade(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Material Specifications</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Zirconia, PFM, E-max"
                    value={orderMaterial}
                    onChange={(e) => setOrderMaterial(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expected Return Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={orderExpectedDate}
                  onChange={(e) => setOrderExpectedDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Lab Cost (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={orderCost}
                    onChange={(e) => setOrderCost(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Patient Charge (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={orderCharge}
                    onChange={(e) => setOrderCharge(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Instructions / Notes</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Specify prep designs, margins, margin style, metal occlusion details..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowOrderModal(false)}
                  disabled={savingOrder}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingOrder}>
                  {savingOrder ? 'Submitting...' : 'Submit Lab Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details / Update Status Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="modal-title">Lab Order Details</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Patient Name</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>{selectedOrder.patientName}</div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px' }}>Lab Details</div>
                <div style={{ fontSize: '14px', color: '#fff', marginTop: '2px' }}>
                  {selectedOrder.labName} {selectedOrder.labContact ? `(${selectedOrder.labContact})` : ''}
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px' }}>Work Specifications</div>
                <div style={{ fontSize: '14px', color: '#fff', marginTop: '2px', textTransform: 'capitalize' }}>
                  {selectedOrder.workType} {selectedOrder.toothNumber ? `(Tooth ${selectedOrder.toothNumber})` : ''}
                  {selectedOrder.shade ? ` • Shade ${selectedOrder.shade}` : ''}
                  {selectedOrder.material ? ` • ${selectedOrder.material}` : ''}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Status</div>
                <div style={{ marginTop: '4px' }}>
                  <span className="badge badge-warning" style={{ textTransform: 'uppercase', fontSize: '12px' }}>
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px' }}>Expected Return</div>
                <div style={{ fontSize: '14px', color: isOverdue(selectedOrder) ? 'var(--color-danger)' : '#fff', marginTop: '2px' }}>
                  {selectedOrder.expectedReturnDate ? new Date(selectedOrder.expectedReturnDate).toLocaleDateString() : '—'}
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px' }}>Financials</div>
                <div style={{ fontSize: '14px', color: '#fff', marginTop: '2px' }}>
                  Cost: ₹{selectedOrder.cost || 0} • Charged: ₹{selectedOrder.patientCharge || 0}
                </div>
              </div>
            </div>

            {selectedOrder.notes && (
              <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--panel-border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Notes & Instructions:</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'pre-line' }}>{selectedOrder.notes}</div>
              </div>
            )}

            {/* Advance Status Form */}
            <div className="card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--panel-border)', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: 0, marginBottom: '12px' }}>Advance Case Workflow</h3>
              <form onSubmit={handleUpdateStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '12px' }}>
                  <select
                    className="form-control"
                    required
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                  >
                    <option value="">Choose Next Status...</option>
                    <option value="ordered">Ordered</option>
                    <option value="sent_to_lab">Sent to Lab</option>
                    <option value="in_progress">In Progress</option>
                    <option value="received">Received at Clinic</option>
                    <option value="fitted">Fitted (Completed)</option>
                    <option value="rework_needed">Rework Needed</option>
                  </select>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Workflow log notes (e.g. shade wrong, sent via courier)..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={updatingStatus || !nextStatus}>
                    Update Status
                  </button>
                </div>
              </form>
            </div>

            {/* History Logs */}
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>Status Log & Audit History</h3>
            {loadingHistory ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Loading history...</div>
            ) : statusHistory.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No history logged.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {statusHistory.map((h) => {
                  const date = new Date(h.changedAt).toLocaleString();
                  return (
                    <div key={h.id} style={{ display: 'flex', gap: '12px', fontSize: '13px', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '4px' }}>
                      <div style={{ color: 'var(--text-muted)', minWidth: '130px' }}>{date}</div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-primary)' }}>{h.status.replace(/_/g, ' ')}</span>
                        {h.notes && <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>— "{h.notes}"</span>}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>By {h.changerName}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
