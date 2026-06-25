import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { Package, Plus, Trash2, Edit2, Search, ArrowLeftRight, AlertTriangle } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string; // consumable | material | instrument
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  unitCost: number | null;
  supplierName: string | null;
  supplierContact: string | null;
}

interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: string; // restock | usage | adjustment
  quantity: number;
  date: string;
  notes: string | null;
  recorderName: string;
}

export const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all | low

  // Create/Edit Item Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('consumable');
  const [itemUnit, setItemUnit] = useState('pieces');
  const [itemStock, setItemStock] = useState(0);
  const [itemThreshold, setItemThreshold] = useState(5);
  const [itemCost, setItemCost] = useState(0);
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // Record Transaction Modal
  const [showTxModal, setShowTxModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [txType, setTxType] = useState('restock'); // restock | usage | adjustment
  const [txQuantity, setTxQuantity] = useState(1);
  const [txNotes, setTxNotes] = useState('');
  const [savingTx, setSavingTx] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const itemsData = await apiRequest('/inventory/items');
      setItems(itemsData);

      const txData = await apiRequest('/inventory/transactions/recent');
      setTransactions(txData);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNewItemModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemCategory('consumable');
    setItemUnit('pieces');
    setItemStock(0);
    setItemThreshold(5);
    setItemCost(0);
    setSupplierName('');
    setSupplierContact('');
    setShowItemModal(true);
  };

  const openEditItemModal = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemUnit(item.unit);
    setItemStock(item.currentStock);
    setItemThreshold(item.reorderThreshold);
    setItemCost(item.unitCost || 0);
    setSupplierName(item.supplierName || '');
    setSupplierContact(item.supplierContact || '');
    setShowItemModal(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    try {
      setSavingItem(true);
      const body = {
        name: itemName,
        category: itemCategory,
        unit: itemUnit,
        currentStock: itemStock,
        reorderThreshold: itemThreshold,
        unitCost: itemCost,
        supplierName: supplierName || undefined,
        supplierContact: supplierContact || undefined,
      };

      if (editingItem) {
        await apiRequest(`/inventory/items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        await apiRequest('/inventory/items', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      setShowItemModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save item');
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      await apiRequest(`/inventory/items/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    }
  };

  const openTxModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setTxType('restock');
    setTxQuantity(1);
    setTxNotes('');
    setShowTxModal(true);
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setSavingTx(true);
      // For usage/subtraction, make sure quantity doesn't exceed stock
      if (txType === 'usage' && selectedItem.currentStock < txQuantity) {
        alert(`Insufficient stock. You only have ${selectedItem.currentStock} ${selectedItem.unit} left.`);
        return;
      }

      await apiRequest(`/inventory/items/${selectedItem.id}/transactions`, {
        method: 'POST',
        body: JSON.stringify({
          type: txType,
          quantity: Number(txQuantity),
          notes: txNotes,
        }),
      });

      setShowTxModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record transaction');
    } finally {
      setSavingTx(false);
    }
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.currentStock <= item.reorderThreshold) {
      return 'var(--color-danger)';
    }
    if (item.currentStock <= item.reorderThreshold * 2) {
      return 'var(--color-warning)';
    }
    return 'var(--color-success)';
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStock = stockFilter === 'all' || (stockFilter === 'low' && item.currentStock <= item.reorderThreshold);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const lowStockCount = items.filter((i) => i.currentStock <= i.reorderThreshold).length;

  return (
    <div>
      <div className="dashboard-hero" style={{ marginBottom: '24px' }}>
        <div className="hero-content">
          <h1>Inventory Management</h1>
          <p>Track clinical consumables, materials, dental implants, and dental tools. Configure reorder alerts.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openNewItemModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add Supply Item
          </button>
        )}
      </div>

      {lowStockCount > 0 && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <AlertTriangle size={24} style={{ color: 'var(--color-danger)' }} />
          <div>
            <span style={{ fontWeight: 600, color: '#fff' }}>Critical Alert: </span>
            <span style={{ color: 'var(--text-secondary)' }}>You have {lowStockCount} items at or below reorder threshold. Restock recommended.</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <AlertTriangle size={24} style={{ color: 'var(--color-danger)' }} />
          <div>
            <span style={{ fontWeight: 600, color: '#fff' }}>Error: </span>
            <span style={{ color: 'var(--text-secondary)' }}>{error}</span>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search supplies by name..."
                className="form-control"
                style={{ paddingLeft: '38px', width: '100%', background: 'rgba(255,255,255,0.03)' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              className="form-control"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', cursor: 'pointer' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="consumable">Consumables</option>
              <option value="material">Materials</option>
              <option value="instrument">Instruments</option>
            </select>

            <select
              className="form-control"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', cursor: 'pointer' }}
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="all">All Stock Statuses</option>
              <option value="low">Low Stock Only</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px', alignItems: 'start' }}>
        {/* Supplies Catalog Table */}
        <div className="card">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={20} /> Supplies Catalog ({filteredItems.length})
          </h2>

          {loading ? (
            <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading catalog...</div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>No items found matching the selected filters.</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>Current Stock</th>
                    <th style={{ textAlign: 'center' }}>Threshold</th>
                    <th>Supplier</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const statusColor = getStockStatusColor(item);
                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{item.name}</div>
                          {item.unitCost && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Unit Cost: ₹{item.unitCost.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>
                          <span className={`badge badge-info`}>{item.category}</span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: statusColor }}>
                          {item.currentStock} {item.unit}
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                          {item.reorderThreshold} {item.unit}
                        </td>
                        <td>
                          <div style={{ fontSize: '13px' }}>{item.supplierName || '—'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.supplierContact || ''}</div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={() => openTxModal(item)}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px' }}
                            >
                              <ArrowLeftRight size={14} /> Log Stock
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => openEditItemModal(item)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '6px' }}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="btn btn-danger btn-sm"
                                  style={{ padding: '6px' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transactions Ledger */}
        <div className="card">
          <h2 className="card-title">Recent Stock Activity</h2>
          {loading ? (
            <div style={{ padding: '16px', color: 'var(--text-secondary)' }}>Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No inventory movements logged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
              {transactions.map((tx) => {
                const isAdd = tx.type === 'restock' || (tx.type === 'adjustment' && tx.quantity > 0);
                const dateLabel = new Date(tx.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <div key={tx.id} style={{ paddingBottom: '12px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, marginRight: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{tx.itemName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Logged by {tx.recorderName} • {dateLabel}
                      </div>
                      {tx.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '4px', marginTop: '6px', fontStyle: 'italic' }}>
                          Note: "{tx.notes}"
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${isAdd ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 600, fontSize: '12px' }}>
                        {isAdd ? '+' : ''}{tx.quantity}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'capitalize' }}>
                        {tx.type}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Item Modal (Create/Edit) */}
      {showItemModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h2 className="modal-title">{editingItem ? 'Edit Supply Item' : 'Add New Supply Item'}</h2>
            <form onSubmit={handleItemSubmit}>
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-control"
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                  >
                    <option value="consumable">Consumable</option>
                    <option value="material">Material</option>
                    <option value="instrument">Instrument</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit of Measure *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. boxes, ml, pieces"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Current Stock</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    disabled={!!editingItem} // only adjust via transaction logging for audit trail
                    value={itemStock}
                    onChange={(e) => setItemStock(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Alert Level *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    required
                    value={itemThreshold}
                    onChange={(e) => setItemThreshold(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Unit Cost (₹)</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={itemCost}
                  onChange={(e) => setItemCost(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Supplier Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Supplier Contact</label>
                  <input
                    type="text"
                    className="form-control"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowItemModal(false)}
                  disabled={savingItem}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingItem}>
                  {savingItem ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Logging Modal */}
      {showTxModal && selectedItem && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 className="modal-title">Log Supply Transaction</h2>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
              Recording inventory updates for <strong style={{ color: '#fff' }}>{selectedItem.name}</strong>.
              Current level: <strong style={{ color: getStockStatusColor(selectedItem) }}>{selectedItem.currentStock} {selectedItem.unit}</strong>.
            </div>
            <form onSubmit={handleTxSubmit}>
              <div className="form-group">
                <label className="form-label">Transaction Type *</label>
                <select className="form-control" value={txType} onChange={(e) => setTxType(e.target.value)}>
                  <option value="restock">Restock (Add to stock)</option>
                  <option value="usage">Usage (Subtract from stock)</option>
                  <option value="adjustment">Manual Adjustment (Can be negative)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity ({selectedItem.unit}) *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  required
                  min={txType === 'usage' ? 0.01 : -9999}
                  value={txQuantity}
                  onChange={(e) => setTxQuantity(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Notes</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="e.g. Received new shipment from supplier, Used in root canal procedure"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTxModal(false)}
                  disabled={savingTx}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingTx}>
                  {savingTx ? 'Saving...' : 'Record Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
