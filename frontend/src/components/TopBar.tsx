import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../services/api';
import { NotificationItem } from '../types';
import { Modal } from './Modal';
import {
  User as UserIcon,
  LogOut,
  Bell,
  ChevronDown,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Briefcase,
  IdCard,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Users,
  FileSpreadsheet,
  PackageCheck,
  Boxes,
  Check,
} from 'lucide-react';

interface TopBarProps {
  activeTab: string;
  setActiveTab?: (tab: string) => void;
}

const tabMetaData: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of your chocolate distribution operations.',
  },
  customers: {
    title: 'Customers',
    subtitle: 'Manage your retail and wholesale business relationships.',
  },
  products: {
    title: 'Products',
    subtitle: 'Manage chocolate products, pricing and stock levels.',
  },
  inventory: {
    title: 'Inventory & Stock Movements',
    subtitle: 'Track warehouse inventory levels and stock movement audit logs.',
  },
  challans: {
    title: 'Sales Challans',
    subtitle: 'Manage customer dispatch documents and delivery orders.',
  },
};

export const TopBar: React.FC<TopBarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, canAccess } = useAuth();

  // Dropdown & Modal States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Notification System States
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentMeta = tabMetaData[activeTab] || {
    title: 'ChocoDist Operations',
    subtitle: 'Chocolate Wholesale & Distribution Platform',
  };

  // Fetch notifications from backend
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const [listRes, countRes] = await Promise.all([
        fetchApi<NotificationItem[]>('/notifications'),
        fetchApi<{ unreadCount: number }>('/notifications/unread-count'),
      ]);

      if (listRes.success && listRes.data) {
        setNotifications(listRes.data);
      }
      if (countRes.success && countRes.data) {
        setUnreadCount(countRes.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  // Poll for notifications periodically while logged in
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark single notification as read & navigate
  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!notif.isRead) {
        await fetchApi(`/notifications/${notif.id}/read`, { method: 'PATCH' });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }

    setIsNotificationOpen(false);

    // Actionable Navigation based on entityType / type
    if (!setActiveTab) return;

    if (notif.entityType === 'CUSTOMER' || notif.type === 'NEW_CUSTOMER') {
      if (canAccess('customers')) setActiveTab('customers');
    } else if (notif.entityType === 'CHALLAN' || notif.type.includes('CHALLAN')) {
      if (canAccess('challans')) setActiveTab('challans');
    } else if (notif.entityType === 'PRODUCT' || notif.type.includes('STOCK')) {
      if (canAccess('inventory')) {
        setActiveTab('inventory');
      } else if (canAccess('products')) {
        setActiveTab('products');
      }
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await fetchApi('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // Compute initials dynamically (e.g. "Sai Raghavendra" -> "SR")
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const initials = getInitials(user?.name);
  const formattedLastLogin = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Just now';

  const formattedCreatedAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'N/A';

  // Render notification type icon helper
  const renderNotifIcon = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
      case 'OUT_OF_STOCK':
        return (
          <div className="notification-icon-box" style={{ background: '#fffbeb', color: '#d97706' }}>
            <AlertTriangle size={16} />
          </div>
        );
      case 'NEW_CUSTOMER':
        return (
          <div className="notification-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Users size={16} />
          </div>
        );
      case 'NEW_CHALLAN':
      case 'CHALLAN_CONFIRMED':
        return (
          <div className="notification-icon-box" style={{ background: '#faf5ff', color: '#9333ea' }}>
            <FileSpreadsheet size={16} />
          </div>
        );
      case 'STOCK_RECEIVED':
        return (
          <div className="notification-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <PackageCheck size={16} />
          </div>
        );
      case 'STOCK_ADJUSTMENT':
        return (
          <div className="notification-icon-box" style={{ background: '#f7f3f0', color: '#5c3a21' }}>
            <Boxes size={16} />
          </div>
        );
      default:
        return (
          <div className="notification-icon-box" style={{ background: '#f1f5f9', color: '#64748b' }}>
            <Bell size={16} />
          </div>
        );
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{currentMeta.title}</h1>
        <p className="topbar-subtitle">{currentMeta.subtitle}</p>
      </div>

      <div className="topbar-right">
        {/* Functional Notification Bell Popover */}
        <div className="profile-dropdown-container" ref={notifRef}>
          <button
            className="topbar-icon-btn"
            onClick={() => {
              setIsNotificationOpen(!isNotificationOpen);
              if (!isNotificationOpen) loadNotifications();
            }}
            title="System Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-badge-count">{unreadCount}</span>}
          </button>

          {/* Notification Panel Popover */}
          {isNotificationOpen && (
            <div className="notification-popover">
              <div className="notification-popover-header">
                <span className="notification-popover-title">Notifications ({notifications.length})</span>
                {unreadCount > 0 && (
                  <button className="notification-mark-all-btn" onClick={handleMarkAllRead}>
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map((n) => {
                    const timeAgo = new Date(n.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    });
                    return (
                      <div
                        key={n.id}
                        className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        {renderNotifIcon(n.type)}
                        <div style={{ flex: 1 }}>
                          <div className="notification-item-title">
                            <span>{n.title}</span>
                            {!n.isRead && <span className="unread-dot-indicator" title="Unread notification" />}
                          </div>
                          <div className="notification-item-msg">{n.message}</div>
                          <div className="notification-item-time">{timeAgo}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                    <CheckCircle2 size={32} color="#16a34a" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>You're all caught up!</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No new notifications at this time.</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Authenticated User Profile Area */}
        <div className="profile-dropdown-container" ref={popoverRef}>
          <button
            className="profile-trigger-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            title="View User Profile Menu"
          >
            <div className="user-avatar">{initials}</div>
            <div className="user-info" style={{ textAlign: 'left' }}>
              <span className="user-name">{user?.name || 'Authenticated User'}</span>
              <span className="user-role-badge">{user?.role || 'USER'}</span>
            </div>
            <ChevronDown size={14} style={{ color: '#64748b', transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
          </button>

          {/* User Profile Popover Dropdown */}
          {isDropdownOpen && (
            <div className="profile-popover">
              <div className="profile-popover-header">
                <div className="user-avatar" style={{ width: 44, height: 44, fontSize: '1.1rem' }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user?.email}</div>
                  <div style={{ marginTop: '0.2rem' }}>
                    <span className="user-role-badge">{user?.role}</span>
                  </div>
                </div>
              </div>

              <div className="profile-popover-details">
                <div className="popover-detail-row">
                  <span className="popover-detail-label">Employee ID:</span>
                  <span className="popover-detail-val">{user?.employeeId || 'EMP-001'}</span>
                </div>
                <div className="popover-detail-row">
                  <span className="popover-detail-label">Department:</span>
                  <span className="popover-detail-val">{user?.department || 'Operations'}</span>
                </div>
                <div className="popover-detail-row">
                  <span className="popover-detail-label">Mobile:</span>
                  <span className="popover-detail-val">{user?.mobile || '+91 98765 43210'}</span>
                </div>
                <div className="popover-detail-row">
                  <span className="popover-detail-label">Status:</span>
                  <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                    <CheckCircle2 size={11} /> {user?.status || 'ACTIVE'}
                  </span>
                </div>
              </div>

              <div className="profile-popover-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                >
                  <UserIcon size={14} /> View Full Profile
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                >
                  <LogOut size={14} /> Sign Out (Logout)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full User Profile Modal */}
      {user && (
        <Modal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          title={`Authenticated Profile: ${user.name}`}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Top Profile Summary Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #f7f3f0 0%, #faf8f5 100%)',
                padding: '1.25rem',
                borderRadius: '8px',
                border: '1px solid #e7ded7',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div className="user-avatar" style={{ width: 56, height: 56, fontSize: '1.35rem', boxShadow: '0 2px 4px rgba(92, 58, 33, 0.2)' }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3a2212' }}>{user.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{user.jobTitle || 'ChocoDist Operations Team'}</div>
                <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="user-role-badge" style={{ fontSize: '0.7rem' }}>{user.role}</span>
                  <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                    <CheckCircle2 size={11} /> {user.status || 'ACTIVE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Information Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
              {/* Section 1: Personal Information */}
              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5c3a21', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <UserIcon size={14} /> Personal Information
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Full Name</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{user.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Email Address</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Mail size={13} color="#64748b" /> {user.email}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Mobile Number</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={13} color="#64748b" /> {user.mobile || '+91 98765 43210'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Employee Information */}
              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5c3a21', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Briefcase size={14} /> Employee Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employee ID</div>
                    <div style={{ fontWeight: 700, color: '#5c3a21', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <IdCard size={13} color="#5c3a21" /> {user.employeeId || 'EMP-001'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Department</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Building2 size={13} color="#64748b" /> {user.department || 'Operations'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>System Role</div>
                    <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ShieldCheck size={13} color="#64748b" /> {user.role}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Account Security & Audit Timestamps */}
            <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={14} color="#64748b" />
                <span><strong>Last Login:</strong> {formattedLastLogin}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} color="#64748b" />
                <span><strong>Account Created:</strong> {formattedCreatedAt}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsProfileModalOpen(false)}>
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}
    </header>
  );
};
