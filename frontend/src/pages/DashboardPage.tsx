import React, { useEffect, useState } from 'react';
import { fetchApi } from '../services/api';
import { DashboardStats, Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import {
  Users,
  Package,
  AlertTriangle,
  FileSpreadsheet,
  ArrowUpRight,
  Plus,
  Boxes,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Search,
  Eye,
} from 'lucide-react';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const { user, hasRole, canAccess } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Read-Only Product Availability Modal State for Sales & Accounts
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [availabilitySearch, setAvailabilitySearch] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [statsRes, prodRes] = await Promise.all([
          fetchApi<DashboardStats>('/dashboard/stats'),
          fetchApi<Product[]>('/products'),
        ]);

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
        if (prodRes.success && prodRes.data) {
          setAllProducts(prodRes.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  // Compute breakdown stats for visual indicators
  const recentChallans = stats?.recentChallans || [];
  const confirmedChallans = recentChallans.filter((c) => c.status === 'CONFIRMED').length;
  const draftChallans = recentChallans.filter((c) => c.status === 'DRAFT').length;
  const cancelledChallans = recentChallans.filter((c) => c.status === 'CANCELLED').length;

  const totalProducts = stats?.totalProducts || 0;
  const lowStockCount = stats?.lowStockCount || 0;
  const healthyStockCount = Math.max(0, totalProducts - lowStockCount);

  // Filtered products for Read-Only Availability Modal
  const filteredAvailabilityProducts = availabilitySearch
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(availabilitySearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(availabilitySearch.toLowerCase()) ||
          p.category.toLowerCase().includes(availabilitySearch.toLowerCase())
      )
    : allProducts;

  // Role permissions
  const isCatalogManager = canAccess('products'); // Admin and Warehouse
  const canAccessCustomers = canAccess('customers'); // Admin, Sales, Accounts
  const canAccessChallans = canAccess('challans'); // Admin, Sales, Accounts

  return (
    <div>
      {/* Page Greeting & Quick Actions Header */}
      <div className="page-greeting-banner">
        <div>
          <h2 className="greeting-title">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'User'}
          </h2>
          <p className="greeting-subtext">
            Here's what's happening with your distribution operations today.
          </p>
        </div>

        {/* Role-Scoped Quick Actions */}
        <div className="quick-actions-bar">
          {hasRole('SALES') && (
            <button className="quick-action-btn" onClick={() => setActiveTab('customers')}>
              <Plus size={15} /> Add Customer
            </button>
          )}
          {hasRole('SALES') && (
            <button className="quick-action-btn" onClick={() => setActiveTab('challans')}>
              <Plus size={15} /> Create Challan
            </button>
          )}
          {hasRole('SALES') && (
            <button className="quick-action-btn" onClick={() => setIsAvailabilityModalOpen(true)}>
              <Eye size={15} /> View Availability
            </button>
          )}
          {hasRole('WAREHOUSE') && (
            <button className="quick-action-btn" onClick={() => setActiveTab('products')}>
              <Plus size={15} /> Add Product
            </button>
          )}
          {hasRole('WAREHOUSE') && (
            <button className="quick-action-btn" onClick={() => setActiveTab('inventory')}>
              <Boxes size={15} /> Update Stock
            </button>
          )}
          {hasRole('ACCOUNTS') && (
            <button className="quick-action-btn" onClick={() => setActiveTab('challans')}>
              View Challans
            </button>
          )}
          {hasRole('ACCOUNTS') && (
            <button className="quick-action-btn" onClick={() => setActiveTab('customers')}>
              View Customers
            </button>
          )}
        </div>
      </div>

      {/* 4 Primary KPI Metric Cards */}
      <div className="stats-grid">
        {/* Customer Card */}
        <div
          className="stat-card"
          onClick={() => canAccessCustomers && setActiveTab('customers')}
          style={{ cursor: canAccessCustomers ? 'pointer' : 'default' }}
        >
          <div>
            <div className="stat-val">
              {isLoading ? <div className="skeleton-box" style={{ width: 60, height: 28 }} /> : stats?.totalCustomers || 0}
            </div>
            <div className="stat-label">Total Customers</div>
            <div className="stat-trend stat-trend-positive">
              <TrendingUp size={12} /> Active B2B Accounts
            </div>
          </div>
          <div className="stat-icon-wrapper stat-icon-brown">
            <Users size={24} />
          </div>
        </div>

        {/* Total Products Card */}
        <div
          className="stat-card"
          onClick={() => (isCatalogManager ? setActiveTab('products') : setIsAvailabilityModalOpen(true))}
          style={{ cursor: 'pointer' }}
          title={isCatalogManager ? 'Manage Products Catalog' : 'View Product Stock Availability'}
        >
          <div>
            <div className="stat-val">
              {isLoading ? <div className="skeleton-box" style={{ width: 60, height: 28 }} /> : stats?.totalProducts || 0}
            </div>
            <div className="stat-label">Total Products</div>
            <div className="stat-trend stat-trend-neutral">
              {isCatalogManager ? 'Catalog Items' : 'View Stock Availability'}
            </div>
          </div>
          <div className="stat-icon-wrapper stat-icon-green">
            <Package size={24} />
          </div>
        </div>

        {/* Low Stock Card */}
        <div
          className="stat-card"
          onClick={() => (isCatalogManager ? setActiveTab('products') : setIsAvailabilityModalOpen(true))}
          style={{ cursor: 'pointer' }}
          title={isCatalogManager ? 'Manage Low Stock Products' : 'View Low Stock Items'}
        >
          <div>
            <div className="stat-val" style={{ color: lowStockCount > 0 ? '#dc2626' : '#0f172a' }}>
              {isLoading ? <div className="skeleton-box" style={{ width: 60, height: 28 }} /> : stats?.lowStockCount || 0}
            </div>
            <div className="stat-label">Low Stock Products</div>
            <div className={`stat-trend ${lowStockCount > 0 ? 'stat-trend-warning' : 'stat-trend-positive'}`}>
              {lowStockCount > 0 ? 'Requires Attention' : 'Stock Levels Healthy'}
            </div>
          </div>
          <div className="stat-icon-wrapper stat-icon-amber">
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Total Challans Card */}
        <div
          className="stat-card"
          onClick={() => canAccessChallans && setActiveTab('challans')}
          style={{ cursor: canAccessChallans ? 'pointer' : 'default' }}
        >
          <div>
            <div className="stat-val">
              {isLoading ? <div className="skeleton-box" style={{ width: 60, height: 28 }} /> : stats?.totalChallans || 0}
            </div>
            <div className="stat-label">Total Challans</div>
            <div className="stat-trend stat-trend-positive">Sales Dispatches</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-purple">
            <FileSpreadsheet size={24} />
          </div>
        </div>
      </div>

      {/* Operations Visual Summaries Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Sales Challan Status Overview Card */}
        <div className="card-table-wrapper" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem', color: '#0f172a' }}>
            Sales Challan Status Overview
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.65rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={14} /> Confirmed
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#15803d', marginTop: '0.2rem' }}>
                {confirmedChallans}
              </div>
            </div>

            <div style={{ flex: 1, background: '#fffbeb', border: '1px solid #fcd34d', padding: '0.65rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={14} /> Drafts
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#b45309', marginTop: '0.2rem' }}>
                {draftChallans}
              </div>
            </div>

            <div style={{ flex: 1, background: '#fef2f2', border: '1px solid #fca5a5', padding: '0.65rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <XCircle size={14} /> Cancelled
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#b91c1c', marginTop: '0.2rem' }}>
                {cancelledChallans}
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Stock Health Indicator Card */}
        <div className="card-table-wrapper" style={{ padding: '1.25rem', marginBottom: 0 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
            Warehouse Stock Health Ratio
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
            {healthyStockCount} of {totalProducts} items healthy ({totalProducts > 0 ? Math.round((healthyStockCount / totalProducts) * 100) : 0}%)
          </div>

          <div className="stock-progress-container" style={{ height: 10 }}>
            <div
              className="stock-progress-fill stock-progress-green"
              style={{ width: `${totalProducts > 0 ? (healthyStockCount / totalProducts) * 100 : 100}%` }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.85rem', fontSize: '0.75rem' }}>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>● {healthyStockCount} Healthy</span>
            <span style={{ color: '#d97706', fontWeight: 600 }}>● {lowStockCount} Low Alert</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Sales Challans vs Low Stock / Product Availability Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Sales Challans */}
        <div className="card-table-wrapper">
          <div className="card-header">
            <h3 className="card-title">Recent Sales Challans</h3>
            {canAccessChallans && (
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('challans')}>
                View All <ArrowUpRight size={14} />
              </button>
            )}
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Challan No.</th>
                  <th>Customer</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4}>
                        <div className="skeleton-box skeleton-row" />
                      </td>
                    </tr>
                  ))
                ) : stats?.recentChallans && stats.recentChallans.length > 0 ? (
                  stats.recentChallans.map((ch) => (
                    <tr key={ch.id}>
                      <td style={{ fontWeight: 700, color: '#1e293b' }}>{ch.challanNumber}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ch.customer?.businessName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ch.customer?.name}</div>
                      </td>
                      <td>{ch.totalQuantity} units</td>
                      <td>
                        <span className={`badge badge-${ch.status.toLowerCase()}`}>
                          {ch.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                      No recent chocolate sales challans found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts / Product Availability Section */}
        <div className="card-table-wrapper">
          <div className="card-header" style={{ background: lowStockCount > 0 ? '#fffbeb' : '#ffffff' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: lowStockCount > 0 ? '#b45309' : '#0f172a' }}>
              <AlertTriangle size={18} color={lowStockCount > 0 ? '#d97706' : '#64748b'} />
              {isCatalogManager ? `Low Stock Alerts (${lowStockCount})` : 'Product Availability'}
            </h3>
            {isCatalogManager ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('products')}>
                Manage Catalog <ArrowUpRight size={14} />
              </button>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAvailabilityModalOpen(true)}>
                View Availability <ArrowUpRight size={14} />
              </button>
            )}
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Current Stock</th>
                  <th>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4}>
                        <div className="skeleton-box skeleton-row" />
                      </td>
                    </tr>
                  ))
                ) : stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                  stats.lowStockProducts.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.sku}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.category}</div>
                      </td>
                      <td>
                        <span className="badge badge-low-stock">
                          {p.currentStock} units
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-lowstock">LOW STOCK</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#16a34a', padding: '2rem', fontWeight: 500 }}>
                      <CheckCircle2 size={20} style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
                      All chocolate stock levels are healthy!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Read-Only Product Availability Modal for Sales & Accounts */}
      <Modal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        title="Chocolate Product Stock Availability (Read-Only)"
        maxWidth="750px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569' }}>
            Check real-time stock levels before dispatching Sales Challans. <em>Read-Only View.</em>
          </div>

          <div className="search-input-wrapper" style={{ maxWidth: '100%' }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search product availability by name, SKU, category..."
              value={availabilitySearch}
              onChange={(e) => setAvailabilitySearch(e.target.value)}
            />
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', maxHeight: '400px', overflowY: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Unit Price (₹)</th>
                  <th>Current Stock</th>
                  <th>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAvailabilityProducts.length > 0 ? (
                  filteredAvailabilityProducts.map((p) => {
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
                        <td style={{ fontWeight: 700 }}>₹{p.unitPrice.toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 600 }}>{p.currentStock} units</td>
                        <td>
                          {isOutOfStock ? (
                            <span className="badge badge-outstock">OUT OF STOCK</span>
                          ) : isLowStock ? (
                            <span className="badge badge-lowstock">LOW STOCK</span>
                          ) : (
                            <span className="badge badge-instock">IN STOCK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                      No matching products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setIsAvailabilityModalOpen(false)}>
              Close View
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
