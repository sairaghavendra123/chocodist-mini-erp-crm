import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  FileSpreadsheet,
  LogOut,
  Building2,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, canAccess } = useAuth();

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' as const },
      ],
    },
    {
      title: 'CRM',
      items: [
        { id: 'customers', label: 'Customers', icon: Users, module: 'customers' as const },
      ],
    },
    {
      title: 'INVENTORY',
      items: [
        { id: 'products', label: 'Products', icon: Package, module: 'products' as const },
        { id: 'inventory', label: 'Stock Movements', icon: Boxes, module: 'inventory' as const },
      ],
    },
    {
      title: 'SALES',
      items: [
        { id: 'challans', label: 'Sales Challans', icon: FileSpreadsheet, module: 'challans' as const },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Building2 size={20} />
        </div>
        <div>
          <div className="sidebar-title">ChocoDist</div>
          <div className="sidebar-subtitle">Mini ERP-CRM Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section, idx) => {
          const visibleItems = section.items.filter((item) => canAccess(item.module));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} style={{ marginBottom: '1.25rem' }}>
              <div className="sidebar-section-label">{section.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      className={`sidebar-item ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #5c3a21 0%, #3d2314 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name || 'Authenticated User'}
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: '#d48b45',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Sign Out (Logout)"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};
