import React, { useEffect, useState } from 'react';
import { fetchApi } from '../services/api';
import { Challan, Customer, Product } from '../types';
import { Modal } from '../components/Modal';
import { Search, Plus, Eye, CheckCircle2, Trash2, AlertCircle, FileDown, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateChallanPDF } from '../utils/pdfGenerator';

interface ChallanLineItem {
  productId: string;
  quantity: number;
}

export const ChallansPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);

  // New Challan Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<ChallanLineItem[]>([{ productId: '', quantity: 10 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadChallans = async () => {
    setIsLoading(true);
    try {
      let url = `/challans?q=${encodeURIComponent(searchQuery)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await fetchApi<Challan[]>(url);
      if (res.success && res.data) {
        setChallans(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sales challans');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        fetchApi<Customer[]>('/customers'),
        fetchApi<Product[]>('/products'),
      ]);
      if (custRes.success && custRes.data) setCustomers(custRes.data);
      if (prodRes.success && prodRes.data) setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load customers/products dropdown:', err);
    }
  };

  useEffect(() => {
    loadChallans();
  }, [searchQuery, statusFilter]);

  const handleOpenNew = () => {
    loadDropdownData();
    setSelectedCustomerId('');
    setLineItems([{ productId: '', quantity: 10 }]);
    setError(null);
    setIsNewModalOpen(true);
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { productId: '', quantity: 10 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: keyof ChallanLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  // Real-time calculations
  const calculateTotals = () => {
    let totalQty = 0;
    let totalAmt = 0;
    const prodMap = new Map(products.map((p) => [p.id, p]));

    for (const item of lineItems) {
      if (item.productId && item.quantity > 0) {
        const prod = prodMap.get(item.productId);
        if (prod) {
          totalQty += item.quantity;
          totalAmt += prod.unitPrice * item.quantity;
        }
      }
    }
    return { totalQty, totalAmt };
  };

  const handleCreateChallan = async (status: 'DRAFT' | 'CONFIRMED') => {
    if (!selectedCustomerId) {
      setError('Please select a customer for the sales challan');
      return;
    }
    if (lineItems.some((i) => !i.productId || i.quantity <= 0)) {
      setError('Please ensure all items have a valid product and quantity > 0');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetchApi('/challans', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          status,
          items: lineItems,
        }),
      });

      if (res.success) {
        setIsNewModalOpen(false);
        loadChallans();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create sales challan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmExistingDraft = async (id: string) => {
    if (!confirm('Are you sure you want to confirm this Sales Challan? Stock will be reduced.')) return;
    try {
      const res = await fetchApi(`/challans/${id}/confirm`, { method: 'PUT' });
      if (res.success) {
        loadChallans();
        if (selectedChallan) {
          setSelectedChallan(res.data);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to confirm sales challan');
    }
  };

  const handleCancelChallan = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this draft sales challan?')) return;
    try {
      const res = await fetchApi(`/challans/${id}/cancel`, { method: 'PUT' });
      if (res.success) {
        loadChallans();
        setIsDetailModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel sales challan');
    }
  };

  const handleViewDetail = (ch: Challan) => {
    setSelectedChallan(ch);
    setIsDetailModalOpen(true);
  };

  const { totalQty, totalAmt } = calculateTotals();
  const canCreate = hasRole('SALES');

  return (
    <div>
      {/* Top Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by Challan #, Store Name, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="select-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {canCreate && (
            <button className="btn btn-primary" onClick={handleOpenNew}>
              <Plus size={18} />
              Create Sales Challan
            </button>
          )}
        </div>
      </div>

      {error && !isNewModalOpen && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Challans Table */}
      <div className="card-table-wrapper">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Challan No.</th>
                <th>Customer & Store</th>
                <th>Total Items</th>
                <th>Total Value (₹)</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8}>
                      <div className="skeleton-box skeleton-row" />
                    </td>
                  </tr>
                ))
              ) : challans.length > 0 ? (
                challans.map((ch) => {
                  const dateStr = new Date(ch.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <tr key={ch.id}>
                      <td style={{ fontWeight: 700, color: '#1e293b' }}>{ch.challanNumber}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#5c3a21', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Building2 size={14} />
                          {ch.customer?.businessName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ch.customer?.name}</div>
                      </td>
                      <td>{ch.totalQuantity} units</td>
                      <td style={{ fontWeight: 700 }}>₹{ch.totalAmount.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge badge-${ch.status.toLowerCase()}`}>{ch.status}</span>
                      </td>
                      <td>{ch.createdBy?.name}</td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{dateStr}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => generateChallanPDF(ch)}
                            title="Export Invoice as PDF"
                          >
                            <FileDown size={15} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => handleViewDetail(ch)}
                            title="View Challan Details & Snapshot"
                          >
                            <Eye size={15} />
                          </button>
                          {ch.status === 'DRAFT' && canCreate && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleConfirmExistingDraft(ch.id)}
                              title="Confirm Challan & Reduce Stock"
                            >
                              <CheckCircle2 size={14} /> Confirm
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="empty-state">
                    No sales challans found.
                    {canCreate && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={handleOpenNew}>
                          Create your first dispatch challan
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sales Challan Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create Chocolate Sales Challan"
        maxWidth="750px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div className="form-group">
            <label className="form-label">Select Business Customer *</label>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- Choose Customer Store / Business --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName} ({c.name} - {c.mobile})
                </option>
              ))}
            </select>
          </div>

          {/* Line Items Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label">Challan Chocolate Line Items *</label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddLineItem}>
                <Plus size={14} /> Add Product Row
              </button>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>Chocolate Product</th>
                    <th style={{ width: '15%' }}>Available Stock</th>
                    <th style={{ width: '15%' }}>Unit Price</th>
                    <th style={{ width: '15%' }}>Qty (units)</th>
                    <th style={{ width: '10%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => {
                    const selectedProd = products.find((p) => p.id === item.productId);
                    const stock = selectedProd ? selectedProd.currentStock : 0;
                    const price = selectedProd ? selectedProd.unitPrice : 0;

                    return (
                      <tr key={idx}>
                        <td>
                          <select
                            className="form-select"
                            style={{ fontSize: '0.8rem', padding: '0.35rem' }}
                            value={item.productId}
                            onChange={(e) => handleLineItemChange(idx, 'productId', e.target.value)}
                          >
                            <option value="">-- Select Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {selectedProd ? (
                            <span className={`badge ${stock < item.quantity ? 'badge-low-stock' : 'badge-active'}`}>
                              {stock} units
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>{selectedProd ? `₹${price}` : '-'}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            style={{ fontSize: '0.8rem', padding: '0.35rem' }}
                            value={item.quantity}
                            onChange={(e) =>
                              handleLineItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                            }
                          />
                        </td>
                        <td>
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm btn-icon"
                              onClick={() => handleRemoveLineItem(idx)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Summary Box */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '0.85rem 1.25rem',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Quantity: </span>
              <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{totalQty} units</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Calculated Total Value: </span>
              <strong style={{ fontSize: '1.1rem', color: '#5c3a21' }}>₹{totalAmt.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Actions: Save Draft vs Confirm */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isSubmitting}
              onClick={() => handleCreateChallan('DRAFT')}
            >
              Save as Draft
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isSubmitting}
              onClick={() => handleCreateChallan('CONFIRMED')}
            >
              Confirm Challan & Reduce Stock
            </button>
          </div>
        </div>
      </Modal>

      {/* View Challan Detail Modal (Snapshot View) */}
      {selectedChallan && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Dispatch Challan Snapshot: ${selectedChallan.challanNumber}`}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedChallan.challanNumber}</h3>
                <div style={{ color: '#475569', fontSize: '0.85rem' }}>
                  Customer: <strong>{selectedChallan.customer?.businessName}</strong> ({selectedChallan.customer?.name})
                </div>
              </div>
              <div>
                <span className={`badge badge-${selectedChallan.status.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}>
                  {selectedChallan.status}
                </span>
              </div>
            </div>

            {/* Snapshot Items Table */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Chocolate Line Items Snapshot (Preserved Info)
              </h4>
              <table className="custom-table" style={{ border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Unit Price</th>
                    <th>Qty (units)</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedChallan.items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700 }}>{item.sku}</td>
                      <td>{item.productName}</td>
                      <td>₹{item.unitPrice}</td>
                      <td>{item.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        ₹{item.totalPrice.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.75rem',
                borderTop: '2px solid #e2e8f0',
              }}
            >
              <div>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Created By: </span>
                <strong>{selectedChallan.createdBy?.name}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Grand Total: </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#5c3a21' }}>
                  ₹{selectedChallan.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '0.5rem' }}>
              {selectedChallan.status === 'DRAFT' && canCreate && (
                <>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancelChallan(selectedChallan.id)}
                  >
                    Cancel Challan
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleConfirmExistingDraft(selectedChallan.id)}
                  >
                    Confirm & Reduce Stock Now
                  </button>
                </>
              )}
              <button
                className="btn btn-primary"
                onClick={() => generateChallanPDF(selectedChallan)}
              >
                <FileDown size={16} /> Export PDF Invoice
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
