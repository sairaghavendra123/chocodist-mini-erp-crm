import React, { useEffect, useState } from 'react';
import { fetchApi } from '../services/api';
import { StockMovement, Product } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  User as UserIcon,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Sliders,
  AlertCircle,
  X,
  PackageCheck,
  Search,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'audit'>('inventory');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [movementFilter, setMovementFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal States
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  // Form Field States
  const [quantityInput, setQuantityInput] = useState<string>('10');
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [reasonInput, setReasonInput] = useState('Supplier Delivery');
  const [notesInput, setNotesInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canManageStock = hasRole('WAREHOUSE'); // Returns true for ADMIN & WAREHOUSE, false for SALES & ACCOUNTS

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [movRes, prodRes] = await Promise.all([
        fetchApi<StockMovement[]>('/inventory/movements'),
        fetchApi<Product[]>('/products'),
      ]);

      if (movRes.success && movRes.data) {
        setMovements(movRes.data);
      }
      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stock health counts
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert && p.currentStock > 0).length;
  const outOfStockCount = products.filter((p) => p.currentStock === 0).length;
  const healthyStockCount = Math.max(0, totalProducts - lowStockCount - outOfStockCount);

  // Selected product helper
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Open Receive Stock Modal
  const handleOpenReceiveModal = (preselectedProdId?: string) => {
    setFormError(null);
    setError(null);
    const targetProdId = preselectedProdId || (products.length > 0 ? products[0].id : '');
    setSelectedProductId(targetProdId);
    setQuantityInput('10');
    setMovementType('IN');
    setReasonInput('Supplier Delivery');
    setNotesInput('');
    setIsReceiveModalOpen(true);
  };

  // Open Stock Adjustment Modal
  const handleOpenAdjustModal = (preselectedProdId?: string) => {
    setFormError(null);
    setError(null);
    const targetProdId = preselectedProdId || (products.length > 0 ? products[0].id : '');
    setSelectedProductId(targetProdId);
    setQuantityInput('5');
    setMovementType('OUT');
    setReasonInput('Physical Count Correction');
    setNotesInput('');
    setIsAdjustModalOpen(true);
  };

  // Handle Submit Stock Receive or Adjustment
  const handleSaveStockMovement = async (e: React.FormEvent, isReceive: boolean) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedProductId) {
      setFormError('Please select a product');
      return;
    }

    const qty = parseInt(quantityInput, 10);
    if (isNaN(qty) || qty <= 0) {
      setFormError('Please enter a valid positive quantity greater than 0');
      return;
    }

    const effectiveMovementType = isReceive ? 'IN' : movementType;
    const currentProd = products.find((p) => p.id === selectedProductId);

    // Negative stock prevention check
    if (effectiveMovementType === 'OUT' && currentProd) {
      if (qty > currentProd.currentStock) {
        setFormError(
          `Cannot decrease stock below zero. Available stock for '${currentProd.name}' is ${currentProd.currentStock} units.`
        );
        return;
      }
    }

    setIsSaving(true);

    try {
      const res = await fetchApi('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProductId,
          quantityChanged: qty,
          movementType: effectiveMovementType,
          reason: reasonInput,
          notes: notesInput,
        }),
      });

      if (res.success) {
        setSuccessMessage(
          isReceive
            ? `Stock received successfully! Added +${qty} units to ${currentProd?.name || 'product'}.`
            : `Stock adjustment completed successfully (${effectiveMovementType} ${qty} units).`
        );
        setIsReceiveModalOpen(false);
        setIsAdjustModalOpen(false);
        loadData();
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to update stock');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Products for Inventory Catalog
  const filteredProducts = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  // Filtered Movements for Audit Log
  const filteredMovements = movementFilter
    ? movements.filter((m) => m.movementType === movementFilter)
    : movements;

  return (
    <div>
      {/* Top Banner Alert Notifications */}
      {successMessage && (
        <div className="alert alert-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {error && !isReceiveModalOpen && !isAdjustModalOpen && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Top Warehouse KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-val">{isLoading ? <div className="skeleton-box" style={{ width: 50, height: 28 }} /> : totalProducts}</div>
            <div className="stat-label">Total Products</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-brown">
            <Boxes size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-val" style={{ color: '#16a34a' }}>
              {isLoading ? <div className="skeleton-box" style={{ width: 50, height: 28 }} /> : healthyStockCount}
            </div>
            <div className="stat-label">Healthy Stock</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-green">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-val" style={{ color: lowStockCount > 0 ? '#d97706' : '#0f172a' }}>
              {isLoading ? <div className="skeleton-box" style={{ width: 50, height: 28 }} /> : lowStockCount}
            </div>
            <div className="stat-label">Low Stock Alert</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-amber">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-val" style={{ color: outOfStockCount > 0 ? '#dc2626' : '#0f172a' }}>
              {isLoading ? <div className="skeleton-box" style={{ width: 50, height: 28 }} /> : outOfStockCount}
            </div>
            <div className="stat-label">Out of Stock</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-amber" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' }}>
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* Control Bar: Sub-Tabs & Action Buttons */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${activeSubTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('inventory')}
          >
            <Boxes size={16} /> Inventory Stock Catalog ({products.length})
          </button>
          <button
            className={`btn ${activeSubTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('audit')}
          >
            <Calendar size={16} /> Stock Movement Audit Log ({movements.length})
          </button>
        </div>

        {canManageStock && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => handleOpenAdjustModal()}>
              <Sliders size={16} /> Stock Adjustment
            </button>
            <button className="btn btn-primary" onClick={() => handleOpenReceiveModal()}>
              <Plus size={18} /> + Receive Stock
            </button>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: INVENTORY STOCK CATALOG TABLE */}
      {activeSubTab === 'inventory' && (
        <div className="card-table-wrapper">
          <div className="card-header">
            <h3 className="card-title">Warehouse Stock Inventory</h3>
            <div className="search-input-wrapper" style={{ maxWidth: '300px' }}>
              <Search className="search-icon" size={16} />
              <input
                type="text"
                className="search-input"
                placeholder="Search stock by name, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.4rem 0.6rem 0.4rem 2rem', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Unit Price</th>
                  <th>Current Stock</th>
                  <th>Stock Status</th>
                  {canManageStock && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={canManageStock ? 8 : 7}>
                        <div className="skeleton-box skeleton-row" />
                      </td>
                    </tr>
                  ))
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const isOutOfStock = p.currentStock === 0;
                    const isLowStock = p.currentStock <= p.minStockAlert && p.currentStock > 0;
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: '#1e293b' }}>{p.sku}</td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>
                          <span className="badge" style={{ background: '#f7f3f0', color: '#5c3a21', border: '1px solid #e7ded7' }}>
                            {p.category}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.825rem', color: '#475569' }}>{p.warehouseLocation}</td>
                        <td style={{ fontWeight: 700 }}>₹{p.unitPrice.toLocaleString('en-IN')}</td>
                        <td>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#0f172a' }}>
                            {p.currentStock} units
                          </span>
                        </td>
                        <td>
                          {isOutOfStock ? (
                            <span className="badge badge-outstock">OUT OF STOCK</span>
                          ) : isLowStock ? (
                            <span className="badge badge-lowstock">LOW STOCK</span>
                          ) : (
                            <span className="badge badge-instock">HEALTHY</span>
                          )}
                        </td>
                        {canManageStock && (
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenReceiveModal(p.id)}
                              title="Receive or update stock for this product"
                            >
                              <PackageCheck size={14} /> Update Stock
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={canManageStock ? 8 : 7} className="empty-state">
                      No products found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STOCK MOVEMENT AUDIT LOG TABLE */}
      {activeSubTab === 'audit' && (
        <div className="card-table-wrapper">
          <div className="card-header">
            <h3 className="card-title">Stock Movement Audit Log</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Type:</span>
              <select
                className="select-input"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                value={movementFilter}
                onChange={(e) => setMovementFilter(e.target.value)}
              >
                <option value="">All Movements</option>
                <option value="IN">IN (Inward Stock)</option>
                <option value="OUT">OUT (Outward Stock)</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Product</th>
                  <th>Movement Type</th>
                  <th>Quantity</th>
                  <th>Reason & Audit Notes</th>
                  <th>Logged By</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6}>
                        <div className="skeleton-box skeleton-row" />
                      </td>
                    </tr>
                  ))
                ) : filteredMovements.length > 0 ? (
                  filteredMovements.map((m) => {
                    const dateStr = new Date(m.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    });
                    const isIN = m.movementType === 'IN';
                    return (
                      <tr key={m.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#475569', fontSize: '0.8rem' }}>
                            <Calendar size={14} />
                            {dateStr}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{m.product?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SKU: {m.product?.sku}</div>
                        </td>
                        <td>
                          <span className={`badge ${isIN ? 'badge-in' : 'badge-out'}`}>
                            {isIN ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                            {m.movementType}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {isIN ? `+${m.quantityChanged}` : `-${m.quantityChanged}`} units
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{m.reason}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <UserIcon size={14} color="#64748b" />
                            <span style={{ fontWeight: 600 }}>{m.createdBy?.name || 'System'}</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{m.createdBy?.role}</div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: RECEIVE STOCK (+ Stock In) */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="+ Receive Stock Shipment"
      >
        <form onSubmit={(e) => handleSaveStockMovement(e, true)}>
          {formError && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-grid">
            {/* Product Dropdown */}
            <div className="form-group full-width">
              <label className="form-label">Select Product *</label>
              <select
                className="form-select"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku}) — Stock: {p.currentStock} units
                  </option>
                ))}
              </select>
            </div>

            {/* Read-Only Current Stock Box */}
            <div className="form-group">
              <label className="form-label">Current Stock (Read-Only)</label>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  color: '#1e293b',
                  fontSize: '0.9rem',
                }}
              >
                {selectedProduct ? `${selectedProduct.currentStock} units` : '0 units'}
              </div>
            </div>

            {/* Movement Type */}
            <div className="form-group">
              <label className="form-label">Movement Type</label>
              <input type="text" className="form-input" value="Stock In (IN)" disabled style={{ background: '#f0fdf4', color: '#16a34a', fontWeight: 700 }} />
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label className="form-label">Received Quantity (Units) *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                required
              />
            </div>

            {/* Reason */}
            <div className="form-group">
              <label className="form-label">Inward Reason *</label>
              <select
                className="form-select"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
              >
                <option value="Supplier Delivery">Supplier Delivery</option>
                <option value="Purchase Order">Purchase Order</option>
                <option value="Stock Return">Stock Return</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div className="form-group full-width">
              <label className="form-label">PO / Delivery Reference Notes</label>
              <textarea
                className="form-textarea"
                placeholder="e.g. Received Batch #4092 via Cadbury Supplier Truck 4"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsReceiveModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Processing...' : 'Confirm Stock Update'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: STOCK ADJUSTMENT (IN or OUT) */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Stock Adjustment"
      >
        <form onSubmit={(e) => handleSaveStockMovement(e, false)}>
          {formError && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-grid">
            {/* Product Dropdown */}
            <div className="form-group full-width">
              <label className="form-label">Select Product *</label>
              <select
                className="form-select"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku}) — Stock: {p.currentStock} units
                  </option>
                ))}
              </select>
            </div>

            {/* Current Stock */}
            <div className="form-group">
              <label className="form-label">Current Stock (Read-Only)</label>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  color: '#1e293b',
                  fontSize: '0.9rem',
                }}
              >
                {selectedProduct ? `${selectedProduct.currentStock} units` : '0 units'}
              </div>
            </div>

            {/* Adjustment Type */}
            <div className="form-group">
              <label className="form-label">Adjustment Direction *</label>
              <select
                className="form-select"
                value={movementType}
                onChange={(e) => setMovementType(e.target.value as 'IN' | 'OUT')}
              >
                <option value="IN">Increase (+ Stock In)</option>
                <option value="OUT">Decrease (- Stock Out)</option>
              </select>
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label className="form-label">Quantity (Units) *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                required
              />
            </div>

            {/* Reason Dropdown */}
            <div className="form-group">
              <label className="form-label">Adjustment Reason *</label>
              <select
                className="form-select"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
              >
                <option value="Damaged">Damaged</option>
                <option value="Expired">Expired</option>
                <option value="Missing">Missing</option>
                <option value="Physical Count Correction">Physical Count Correction</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Calculated New Stock Preview */}
            {selectedProduct && (
              <div className="form-group full-width" style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Stock Calculation Preview:</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  Current: {selectedProduct.currentStock} units &nbsp; ➔ &nbsp;
                  {movementType === 'IN' ? ` +${quantityInput || 0}` : ` -${quantityInput || 0}`} units &nbsp; ➔ &nbsp;
                  New Stock: &nbsp;
                  <span style={{ color: movementType === 'OUT' && (selectedProduct.currentStock - parseInt(quantityInput || '0', 10)) < 0 ? '#dc2626' : '#16a34a' }}>
                    {movementType === 'IN'
                      ? selectedProduct.currentStock + parseInt(quantityInput || '0', 10)
                      : selectedProduct.currentStock - parseInt(quantityInput || '0', 10)}{' '}
                    units
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="form-group full-width">
              <label className="form-label">Audit Notes & Inspection Remarks</label>
              <textarea
                className="form-textarea"
                placeholder="e.g. 5 boxes found crushed during warehouse pallet audit"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Processing...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
