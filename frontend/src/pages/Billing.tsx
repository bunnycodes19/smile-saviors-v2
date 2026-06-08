import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { Plus, Receipt, CreditCard, ChevronRight } from 'lucide-react';

interface Invoice {
  id: string;
  patientFirstName: string;
  patientLastName: string;
  totalAmount: string;
  paidAmount: string;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'VOID';
  dueDate: string;
  createdAt: string;
}

interface InvoiceDetail {
  invoice: {
    id: string;
    patientId: string;
    totalAmount: string;
    paidAmount: string;
    status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'VOID';
    dueDate: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface Treatment {
  id: string;
  procedureName: string;
  price: string;
  status: string;
  toothNumber: number | null;
}

export const Billing: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal controllers
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [error, setError] = useState('');

  // Invoice creation states
  const [patientId, setPatientId] = useState('');
  const [patientTreatments, setPatientTreatments] = useState<Treatment[]>([]);
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 2 weeks terms
    return d.toISOString().split('T')[0];
  });

  // Payment registration states
  const [paymentAmount, setPaymentAmount] = useState('');

  const fetchInvoices = async () => {
    try {
      const data = await apiRequest('/billing/invoices');
      setInvoices(data);
      
      const pts = await apiRequest('/patients');
      setPatients(pts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleInvoiceClick = async (invoiceId: string) => {
    try {
      const data = await apiRequest(`/billing/invoices/${invoiceId}`);
      setSelectedInvoice(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePatientChange = async (pId: string) => {
    setPatientId(pId);
    setPatientTreatments([]);
    setSelectedTreatments([]);
    if (!pId) return;

    try {
      // Get completed treatments for the patient to bill them
      const data = await apiRequest(`/patients/${pId}/treatments`);
      // Filter out only completed ones
      const completed = data.filter((t: Treatment) => t.status === 'COMPLETED');
      setPatientTreatments(completed);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTreatmentSelection = (treatmentId: string) => {
    setSelectedTreatments((prev) =>
      prev.includes(treatmentId) ? prev.filter((id) => id !== treatmentId) : [...prev, treatmentId]
    );
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedTreatments.length === 0) {
      setError('Please select at least one treatment item to bill.');
      return;
    }

    try {
      // Prepare invoice items
      const items = selectedTreatments.map((tId) => {
        const treat = patientTreatments.find((t) => t.id === tId)!;
        return {
          treatmentId: treat.id,
          description: `${treat.procedureName} ${treat.toothNumber ? `(Tooth #${treat.toothNumber})` : ''}`,
          quantity: 1,
          unitPrice: treat.price,
        };
      });

      await apiRequest('/billing/invoices', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          dueDate,
          items,
        }),
      });

      setShowCreateModal(false);
      setPatientId('');
      setPatientTreatments([]);
      setSelectedTreatments([]);
      fetchInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to generate invoice');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setError('');

    try {
      await apiRequest(`/billing/invoices/${selectedInvoice.invoice.id}/payment`, {
        method: 'POST',
        body: JSON.stringify({ amount: paymentAmount }),
      });

      setShowPaymentModal(false);
      setPaymentAmount('');
      
      // Reload detail
      handleInvoiceClick(selectedInvoice.invoice.id);
      fetchInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="badge badge-success">Paid</span>;
      case 'PARTIALLY_PAID':
        return <span className="badge badge-info">Partially Paid</span>;
      case 'VOID':
        return <span className="badge badge-danger" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>Void</span>;
      default:
        return <span className="badge badge-danger">Unpaid</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Billing & Invoicing</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Invoice List */}
        <div className="card" style={{ padding: '0px' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={20} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 600, fontSize: '18px' }}>Clinic Invoices</span>
          </div>

          {loading ? (
            <p style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading invoices...</p>
          ) : invoices.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No invoices issued yet.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date Issued</th>
                    <th>Due Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => handleInvoiceClick(inv.id)}
                      style={{ cursor: 'pointer' }}
                      className={selectedInvoice?.invoice.id === inv.id ? 'active' : ''}
                    >
                      <td style={{ fontWeight: 600 }}>{inv.patientFirstName} {inv.patientLastName}</td>
                      <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td>${inv.totalAmount}</td>
                      <td>${inv.paidAmount}</td>
                      <td>{getStatusBadge(inv.status)}</td>
                      <td>
                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invoice Preview & Payment Actions */}
        <div>
          {selectedInvoice ? (
            <div className="card">
              <h2 className="card-title">Receipt Breakdown</h2>
              <div style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Invoice ID</p>
                <p style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '14px', marginTop: '2px' }}>{selectedInvoice.invoice.id}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '16px' }}>
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Due Date</p>
                    <p style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>
                      {new Date(selectedInvoice.invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Status</p>
                    <div style={{ marginTop: '2px' }}>{getStatusBadge(selectedInvoice.invoice.status)}</div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Billed Procedures</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedInvoice.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingBottom: '8px', borderBottom: '1px dashed var(--panel-border)' }}>
                      <div>
                        <span>{item.description}</span>
                        {item.quantity > 1 && <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '6px' }}>x{item.quantity}</span>}
                      </div>
                      <span style={{ fontWeight: 600 }}>${item.totalPrice}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Balance */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--panel-border)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Invoice Total:</span>
                  <span style={{ fontWeight: 600 }}>${selectedInvoice.invoice.totalAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Amount Paid:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>${selectedInvoice.invoice.paidAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, paddingTop: '8px', borderTop: '1px solid var(--panel-border)' }}>
                  <span>Balance Due:</span>
                  <span style={{ color: selectedInvoice.invoice.status === 'PAID' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    ${(Number(selectedInvoice.invoice.totalAmount) - Number(selectedInvoice.invoice.paidAmount)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedInvoice.invoice.status !== 'PAID' && (
                <button onClick={() => setShowPaymentModal(true)} className="btn btn-primary" style={{ width: '100%' }}>
                  <CreditCard size={16} />
                  Record Payment
                </button>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              Select an invoice in the list to inspect billed items and post payments.
            </div>
          )}
        </div>
      </div>

      {/* 1. Create Invoice Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '20px' }}>Issue Billing Invoice</h2>
            {error && <div style={{ color: 'var(--color-danger)', marginBottom: '15px' }}>{error}</div>}
            <form onSubmit={handleGenerateInvoice}>
              <div className="form-group">
                <label className="form-label">Select Patient</label>
                <select className="form-input" value={patientId} onChange={(e) => handlePatientChange(e.target.value)} required>
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Billed Treatments</label>
                {patientId === '' ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>Please select a patient first.</p>
                ) : patientTreatments.length === 0 ? (
                  <p style={{ color: 'var(--color-danger)', fontSize: '13px', fontStyle: 'italic' }}>No uninvoiced completed procedures found for this patient.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-sm)' }}>
                    {patientTreatments.map((t) => (
                      <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
                        <input
                          type="checkbox"
                          checked={selectedTreatments.includes(t.id)}
                          onChange={() => toggleTreatmentSelection(t.id)}
                        />
                        <span>
                          {t.procedureName} {t.toothNumber ? `(Tooth #${t.toothNumber})` : '(General)'} - <strong>${t.price}</strong>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Invoice Due Date</label>
                <input type="date" className="form-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={selectedTreatments.length === 0}>Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '20px' }}>Post Invoice Payment</h2>
            {error && <div style={{ color: 'var(--color-danger)', marginBottom: '15px' }}>{error}</div>}
            <form onSubmit={handleRecordPayment}>
              <div className="form-group">
                <label className="form-label">Outstanding Balance</label>
                <input
                  type="text"
                  className="form-input"
                  value={`$${(Number(selectedInvoice.invoice.totalAmount) - Number(selectedInvoice.invoice.paidAmount)).toFixed(2)}`}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="250.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
