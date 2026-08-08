import React, { useEffect, useState } from 'react';
import { fetchApi } from '../services/api';
import { Customer, CustomerType, CustomerStatus } from '../types';
import { Modal } from '../components/Modal';
import { Search, Plus, Edit, Eye, MessageSquare, AlertCircle, Building2, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const CustomersPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Add/Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'WHOLESALE' as CustomerType,
    address: '',
    city: '',
    state: '',
    pincode: '',
    status: 'ACTIVE' as CustomerStatus,
    followUpDate: '',
    notes: '',
  });

  // Inline Validation Error State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [followUpNoteInput, setFollowUpNoteInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      let url = `/customers?q=${encodeURIComponent(searchQuery)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (typeFilter) url += `&customerType=${typeFilter}`;

      const res = await fetchApi<Customer[]>(url);
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [searchQuery, statusFilter, typeFilter]);

  const handleOpenAdd = () => {
    setSelectedCustomer(null);
    setFieldErrors({});
    setError(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'WHOLESALE',
      address: '',
      city: '',
      state: '',
      pincode: '',
      status: 'ACTIVE',
      followUpDate: '',
      notes: '',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setSelectedCustomer(c);
    setFieldErrors({});
    setError(null);
    setFormData({
      name: c.name,
      mobile: c.mobile,
      email: c.email || '',
      businessName: c.businessName,
      gstNumber: c.gstNumber || '',
      customerType: c.customerType,
      address: c.address,
      city: '',
      state: '',
      pincode: '',
      status: c.status,
      followUpDate: c.followUpDate || '',
      notes: c.notes || '',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (c: Customer) => {
    setSelectedCustomer(c);
    setFollowUpNoteInput('');
    setIsDetailModalOpen(true);
  };

  // Client-Side Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Customer Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Customer Name must be at least 2 characters';
    }

    if (!formData.businessName.trim()) {
      errors.businessName = 'Business Name is required';
    }

    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile Number is required';
    } else if (!/^[0-9+\-\s]{10,15}$/.test(formData.mobile.trim())) {
      errors.mobile = 'Please enter a valid 10-15 digit mobile number';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      if (selectedCustomer) {
        // Edit existing
        const res = await fetchApi(`/customers/${selectedCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        if (res.success) {
          setSuccessMessage('Customer updated successfully.');
        }
      } else {
        // Create new
        const res = await fetchApi('/customers', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        if (res.success) {
          setSuccessMessage('Customer added successfully.');
        }
      }
      setIsFormModalOpen(false);
      loadCustomers();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFollowUpNote = async () => {
    if (!selectedCustomer || !followUpNoteInput.trim()) return;
    setIsSaving(true);
    try {
      const updatedNotes = selectedCustomer.notes
        ? `${selectedCustomer.notes}\n\n[${new Date().toLocaleDateString()}] ${followUpNoteInput}`
        : `[${new Date().toLocaleDateString()}] ${followUpNoteInput}`;

      const res = await fetchApi<Customer>(`/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        body: JSON.stringify({ notes: updatedNotes }),
      });

      if (res.success && res.data) {
        setSelectedCustomer(res.data);
        setFollowUpNoteInput('');
        loadCustomers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update follow-up notes');
    } finally {
      setIsSaving(false);
    }
  };

  const canAddCustomer = hasRole('SALES'); // Returns true for ADMIN & SALES, false for ACCOUNTS & WAREHOUSE

  return (
    <div>
      {/* Top Banner Alert Messages */}
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

      {error && !isFormModalOpen && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Top Action & Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by customer name, store name, mobile..."
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
            <option value="ACTIVE">Active</option>
            <option value="LEAD">Lead</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            className="select-input"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Account Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>

          {canAddCustomer && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={18} />
              Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Customer List Table */}
      <div className="card-table-wrapper">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Business Name</th>
                <th>Mobile & Email</th>
                <th>Account Type</th>
                <th>Status</th>
                <th>Follow-up</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7}>
                      <div className="skeleton-box skeleton-row" />
                    </td>
                  </tr>
                ))
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      {c.gstNumber && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>GSTIN: {c.gstNumber}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#5c3a21', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Building2 size={14} />
                        {c.businessName}
                      </div>
                    </td>
                    <td>
                      <div>{c.mobile}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.email || 'N/A'}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
                        {c.customerType}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                    </td>
                    <td>{c.followUpDate ? c.followUpDate : <span style={{ color: '#94a3b8' }}>None</span>}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => handleOpenDetail(c)}
                          title="View Customer Details & CRM Remarks"
                        >
                          <Eye size={15} />
                        </button>
                        {canAddCustomer && (
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Customer Info"
                          >
                            <Edit size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No business customers found.
                    {canAddCustomer && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
                          Add your first business customer
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

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedCustomer ? 'Edit Business Customer' : 'Add New Business Customer'}
      >
        <form onSubmit={handleSaveCustomer}>
          {error && isFormModalOpen && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-grid">
            {/* Customer Name */}
            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                }}
                placeholder="e.g. Ramesh Gupta"
              />
              {fieldErrors.name && (
                <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 500 }}>
                  {fieldErrors.name}
                </span>
              )}
            </div>

            {/* Business Name */}
            <div className="form-group">
              <label className="form-label">Business Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.businessName}
                onChange={(e) => {
                  setFormData({ ...formData, businessName: e.target.value });
                  if (fieldErrors.businessName) setFieldErrors({ ...fieldErrors, businessName: '' });
                }}
                placeholder="e.g. ABC Supermarket"
              />
              {fieldErrors.businessName && (
                <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 500 }}>
                  {fieldErrors.businessName}
                </span>
              )}
            </div>

            {/* Mobile Number */}
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                type="text"
                className="form-input"
                value={formData.mobile}
                onChange={(e) => {
                  setFormData({ ...formData, mobile: e.target.value });
                  if (fieldErrors.mobile) setFieldErrors({ ...fieldErrors, mobile: '' });
                }}
                placeholder="e.g. 9876543210"
              />
              {fieldErrors.mobile && (
                <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 500 }}>
                  {fieldErrors.mobile}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                }}
                placeholder="e.g. ramesh@abcsupermarket.in"
              />
              {fieldErrors.email && (
                <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 500 }}>
                  {fieldErrors.email}
                </span>
              )}
            </div>

            {/* GSTIN */}
            <div className="form-group">
              <label className="form-label">GSTIN</label>
              <input
                type="text"
                className="form-input"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                placeholder="e.g. 36AAACA123411Z5"
              />
            </div>

            {/* Account Type */}
            <div className="form-group">
              <label className="form-label">Account Type *</label>
              <select
                className="form-select"
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
              >
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
              >
                <option value="ACTIVE">Active</option>
                <option value="LEAD">Lead</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Follow-up Date */}
            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              />
            </div>

            {/* Address */}
            <div className="form-group full-width">
              <label className="form-label">Street / Store Address *</label>
              <input
                type="text"
                className="form-input"
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: '' });
                }}
                placeholder="e.g. Plot 45, Commercial Complex"
              />
              {fieldErrors.address && (
                <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 500 }}>
                  {fieldErrors.address}
                </span>
              )}
            </div>

            {/* City */}
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-input"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Hyderabad"
              />
            </div>

            {/* State */}
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                className="form-input"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Telangana"
              />
            </div>

            {/* Pincode */}
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input
                type="text"
                className="form-input"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="e.g. 500081"
              />
            </div>

            {/* Notes */}
            <div className="form-group full-width">
              <label className="form-label">Notes & Remarks</label>
              <textarea
                className="form-textarea"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Prefers weekly delivery on Mondays..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Customer Profile: ${selectedCustomer.businessName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{selectedCustomer.businessName}</div>
              <div style={{ color: '#475569', fontSize: '0.875rem' }}>Contact: {selectedCustomer.name}</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <span className={`badge badge-${selectedCustomer.status.toLowerCase()}`}>
                  {selectedCustomer.status}
                </span>
                <span className="badge" style={{ background: '#e2e8f0', color: '#1e293b' }}>
                  {selectedCustomer.customerType}
                </span>
              </div>
            </div>

            <div className="form-grid">
              <div>
                <strong>Mobile:</strong> {selectedCustomer.mobile}
              </div>
              <div>
                <strong>Email:</strong> {selectedCustomer.email || 'N/A'}
              </div>
              <div>
                <strong>GSTIN:</strong> {selectedCustomer.gstNumber || 'N/A'}
              </div>
              <div>
                <strong>Next Follow-up:</strong> {selectedCustomer.followUpDate || 'None set'}
              </div>
              <div className="full-width">
                <strong>Address:</strong> {selectedCustomer.address}
              </div>
            </div>

            {/* CRM Notes Log */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MessageSquare size={16} /> CRM Activity & Follow-up Log
              </h4>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '0.85rem',
                  borderRadius: '6px',
                  minHeight: '80px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-line',
                  fontSize: '0.85rem',
                  color: '#334155',
                }}
              >
                {selectedCustomer.notes || 'No CRM follow-up notes recorded yet.'}
              </div>
            </div>

            {/* Add CRM Note */}
            {canAddCustomer && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <label className="form-label">Add CRM Remark</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Spoke to purchasing manager regarding Dairy Milk stock..."
                    value={followUpNoteInput}
                    onChange={(e) => setFollowUpNoteInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddFollowUpNote}
                    disabled={isSaving || !followUpNoteInput.trim()}
                  >
                    Add Remark
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
