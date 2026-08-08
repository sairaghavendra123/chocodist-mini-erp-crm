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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' as const },
    { id: 'customers', label: 'Customers', icon: Users, module: 'customers' as const },
    { id: 'products', label: 'Products', icon: Package, module: 'products' as const },
    { id: 'inventory', label: 'Inventory', icon: Boxes, module: 'inventory' as const },
    { id: 'challans', label: 'Sales Challans', icon: FileSpreadsheet, module: 'challans' as const },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Building2 size={20} />
        </div>
        <div>
          <div className="sidebar-title">ChocoDist</div>
          <div className="sidebar-subtitle">Chocolate Wholesale & Distribution</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          if (!canAccess(item.module)) return null;
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
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#5c3a21',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name}
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: '#a89f91',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              padding: '0.3rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
