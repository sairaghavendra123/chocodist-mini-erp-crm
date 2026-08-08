import React, { useEffect, useState } from 'react';
import { fetchApi } from '../services/api';
import { Product } from '../types';
import { Modal } from '../components/Modal';
import { Search, Plus, Edit, AlertTriangle, Boxes, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProductsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 10,
    warehouseLocation: '',
  });

  // Adjust Stock State
  const [adjustData, setAdjustData] = useState({
    quantityChanged: 10,
    movementType: 'IN' as 'IN' | 'OUT',
    reason: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      let url = `/products?q=${encodeURIComponent(searchQuery)}`;
      if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
      if (stockStatusFilter === 'LOW_STOCK') url += `&lowStock=true`;

      const res = await fetchApi<Product[]>(url);
      if (res.success && res.data) {
        let list = res.data;
        if (stockStatusFilter === 'OUT_OF_STOCK') {
          list = list.filter((p) => p.currentStock === 0);
        } else if (stockStatusFilter === 'IN_STOCK') {
          list = list.filter((p) => p.currentStock > p.minStockAlert);
        }
        setProducts(list);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load chocolate products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchQuery, categoryFilter, stockStatusFilter]);

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: 'Milk Chocolate',
      unitPrice: 0,
      currentStock: 0,
      minStockAlert: 50,
      warehouseLocation: 'Bay 01-A (Temp Control)',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setSelectedProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      warehouseLocation: p.warehouseLocation,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenAdjust = (p: Product) => {
    setSelectedProduct(p);
    setAdjustData({
      quantityChanged: 10,
      movementType: 'IN',
      reason: 'New stock received',
    });
    setIsAdjustModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (selectedProduct) {
        await fetchApi(`/products/${selectedProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await fetchApi('/products', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      setIsFormModalOpen(false);
      loadProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSaving(true);
    setError(null);

    try {
      await fetchApi('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProduct.id,
          ...adjustData,
        }),
      });
      setIsAdjustModalOpen(false);
      loadProducts();
    } catch (err: any) {
      setError(err.message || 'Stock adjustment failed');
    } finally {
      setIsSaving(false);
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const canEditProduct = hasRole('WAREHOUSE');

  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by product name, SKU, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {categories.length > 0 && (
            <select
              className="select-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <select
            className="select-input"
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
          >
            <option value="">All Stock Levels</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock Alert</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          {canEditProduct && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={18} />
              Add Product
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Product Table */}
      <div className="card-table-wrapper">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Unit Price (₹)</th>
                <th>Current Stock</th>
                <th>Stock Ratio</th>
                <th>Location</th>
                {canEditProduct && <th style={{ textAlign: 'right' }}>Actions</th>}
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
              ) : products.length > 0 ? (
                products.map((p) => {
                  const isOutOfStock = p.currentStock === 0;
                  const isLowStock = p.currentStock <= p.minStockAlert && p.currentStock > 0;
                  const stockRatio = Math.min(100, Math.round((p.currentStock / Math.max(1, p.minStockAlert * 2)) * 100));

                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: '#1e293b' }}>{p.sku}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#f7f3f0', color: '#5c3a21', border: '1px solid #e7ded7' }}>
                          {p.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{p.unitPrice.toLocaleString('en-IN')}</td>
                      <td>
                        {isOutOfStock ? (
                          <span className="badge badge-outstock">
                            <AlertTriangle size={12} /> Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="badge badge-low-stock">
                            <AlertTriangle size={12} /> Low Stock ({p.currentStock} units)
                          </span>
                        ) : (
                          <span className="badge badge-instock">
                            <CheckCircle2 size={12} /> {p.currentStock} units
                          </span>
                        )}
                      </td>
                      <td style={{ width: 140 }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.2rem' }}>
                          Min: {p.minStockAlert} units
                        </div>
                        <div className="stock-progress-container">
                          <div
                            className={`stock-progress-fill ${
                              isOutOfStock
                                ? 'stock-progress-red'
                                : isLowStock
                                ? 'stock-progress-amber'
                                : 'stock-progress-green'
                            }`}
                            style={{ width: `${isOutOfStock ? 0 : Math.max(8, stockRatio)}%` }}
                          />
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#475569' }}>{p.warehouseLocation}</td>
                      {canEditProduct && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenAdjust(p)}
                              title="Adjust Stock (IN / OUT)"
                            >
                              <Boxes size={14} /> Adjust Stock
                            </button>
                            <button
                              className="btn btn-secondary btn-sm btn-icon"
                              onClick={() => handleOpenEdit(p)}
                              title="Edit Product Info"
                            >
                              <Edit size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="empty-state">
                    No chocolate products found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedProduct ? 'Edit Chocolate Product' : 'Add New Chocolate Product'}
      >
        <form onSubmit={handleSaveProduct}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dairy Milk (50g)"
              />
            </div>

            <div className="form-group">
              <label className="form-label">SKU / Item Code *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. CHO-DM-001"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Milk Chocolate">Milk Chocolate</option>
                <option value="Dark Chocolate">Dark Chocolate</option>
                <option value="Wafer Chocolate">Wafer Chocolate</option>
                <option value="Premium Chocolate">Premium Chocolate</option>
                <option value="Chocolate Bars">Chocolate Bars</option>
                <option value="Chocolate Pouches">Chocolate Pouches</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Current Stock (units) *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                required
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Minimum Stock Alert Quantity *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                required
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Warehouse Location *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.warehouseLocation}
                onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                placeholder="e.g. Bay 01-A (Temp Control), Cold Storage Shed C"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Stock Adjustment Modal */}
      {selectedProduct && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title={`Adjust Stock: ${selectedProduct.name}`}
        >
          <form onSubmit={handleAdjustStock}>
            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
              <div>
                <strong>SKU:</strong> {selectedProduct.sku} | <strong>Current Stock:</strong>{' '}
                <span className="badge badge-active">{selectedProduct.currentStock} units</span>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Adjustment Type *</label>
                <select
                  className="form-select"
                  value={adjustData.movementType}
                  onChange={(e) => setAdjustData({ ...adjustData, movementType: e.target.value as 'IN' | 'OUT' })}
                >
                  <option value="IN">IN (+) Inward Stock</option>
                  <option value="OUT">OUT (-) Outward Stock</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity Changed (units) *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  required
                  value={adjustData.quantityChanged}
                  onChange={(e) => setAdjustData({ ...adjustData, quantityChanged: parseInt(e.target.value, 10) || 1 })}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Reason for Adjustment *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  placeholder="e.g. New stock received, Supplier delivery, Warehouse replenishment"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'Updating...' : 'Record Stock Movement'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
