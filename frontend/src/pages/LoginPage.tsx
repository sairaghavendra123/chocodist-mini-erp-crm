import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
  Boxes,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setIsSubmitting(true);

    try {
      await login(demoEmail, demoPass);
    } catch (err: any) {
      setError(err.message || 'Demo login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* LEFT SIDE: 50% Brand Experience & Capability Grid */}
      <div className="login-brand-panel">
        <div className="login-brand-pattern" />

        <div className="login-brand-header">
          <div className="login-brand-logo">
            <Building2 size={24} />
          </div>
          <div>
            <div className="login-brand-title">ChocoDist</div>
            <div className="login-brand-subtitle">Chocolate Wholesale & Distribution</div>
          </div>
        </div>

        <div className="login-brand-content">
          <div className="enterprise-badge">
            Enterprise B2B Operations Platform
          </div>

          <h1 className="login-brand-headline">
            Powering Smarter
            <br />
            Chocolate Distribution
          </h1>

          <p className="login-brand-description">
            Manage customers, inventory, sales challans and distribution operations from one centralized enterprise platform.
          </p>

          <div className="capabilities-grid">
            <div className="capability-card">
              <div className="capability-icon-wrapper">
                <Users size={18} />
              </div>
              <div className="capability-title">Customer & Retailer CRM</div>
              <div className="capability-text">Centralize customer data and strengthen business relationships.</div>
            </div>

            <div className="capability-card">
              <div className="capability-icon-wrapper">
                <Boxes size={18} />
              </div>
              <div className="capability-title">Inventory & Stock Monitoring</div>
              <div className="capability-text">Monitor stock levels and identify low-stock products.</div>
            </div>

            <div className="capability-card">
              <div className="capability-icon-wrapper">
                <FileSpreadsheet size={18} />
              </div>
              <div className="capability-title">Sales Challan Management</div>
              <div className="capability-text">Create, manage and track sales challans.</div>
            </div>

            <div className="capability-card">
              <div className="capability-icon-wrapper">
                <TrendingUp size={18} />
              </div>
              <div className="capability-title">Role-Based Operations</div>
              <div className="capability-text">Secure access based on operational responsibilities.</div>
            </div>
          </div>
        </div>

        <div className="login-brand-footer">
          <span>Enterprise B2B Wholesale Portal · Built for Scale</span>
        </div>
      </div>

      {/* RIGHT SIDE: 50% Enterprise Authentication Experience */}
      <div className="login-card-panel">
        <div className="login-card-container">
          <div className="login-card-header">
            <h2 className="login-card-welcome">Welcome back</h2>
            <p className="login-card-subheading">Sign in to your ChocoDist workspace</p>
          </div>

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <label className="form-label">Email Address</label>
              <div className="search-input-wrapper" style={{ maxWidth: '100%' }}>
                <Mail className="search-icon" size={18} />
                <input
                  type="email"
                  className="search-input"
                  placeholder="name@chocodist.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Password</label>
              <div className="search-input-wrapper" style={{ maxWidth: '100%', position: 'relative' }}>
                <Lock className="search-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="search-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-options-row">
              <label className="remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <span className="forgot-link" onClick={() => alert('Please contact system administrator to reset credentials.')}>
                Forgot password?
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Redesigned 4 Demo Role Cards - STRICTLY NO EMPLOYEE NAMES */}
          <div className="demo-roles-container">
            <div className="demo-roles-title">Interview Demo Accounts (1-Click Login)</div>
            <div className="demo-roles-grid">
              {/* ADMIN */}
              <div className="role-demo-card role-card-admin" onClick={() => handleQuickDemoLogin('admin@chocodist.com', 'ChocoAdmin#2026!A7')} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="role-card-header">
                    <span className="role-badge-tag tag-admin">ADMIN</span>
                    <ShieldCheck size={15} className="tag-admin" />
                  </div>
                  <div className="role-user-email">admin@chocodist.com</div>
                </div>
                <button
                  className="role-quick-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickDemoLogin('admin@chocodist.com', 'ChocoAdmin#2026!A7');
                  }}
                  disabled={isSubmitting}
                >
                  Quick Login
                </button>
              </div>

              {/* SALES */}
              <div className="role-demo-card role-card-sales" onClick={() => handleQuickDemoLogin('sales@chocodist.com', 'ChocoSales#2026!B8')} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="role-card-header">
                    <span className="role-badge-tag tag-sales">SALES</span>
                    <Users size={15} className="tag-sales" />
                  </div>
                  <div className="role-user-email">sales@chocodist.com</div>
                </div>
                <button
                  className="role-quick-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickDemoLogin('sales@chocodist.com', 'ChocoSales#2026!B8');
                  }}
                  disabled={isSubmitting}
                >
                  Quick Login
                </button>
              </div>

              {/* WAREHOUSE */}
              <div className="role-demo-card role-card-warehouse" onClick={() => handleQuickDemoLogin('warehouse@chocodist.com', 'ChocoWarehouse#2026!C9')} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="role-card-header">
                    <span className="role-badge-tag tag-warehouse">WAREHOUSE</span>
                    <Boxes size={15} className="tag-warehouse" />
                  </div>
                  <div className="role-user-email">warehouse@chocodist.com</div>
                </div>
                <button
                  className="role-quick-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickDemoLogin('warehouse@chocodist.com', 'ChocoWarehouse#2026!C9');
                  }}
                  disabled={isSubmitting}
                >
                  Quick Login
                </button>
              </div>

              {/* ACCOUNTS */}
              <div className="role-demo-card role-card-accounts" onClick={() => handleQuickDemoLogin('accounts@chocodist.com', 'ChocoAccounts#2026!D4')} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="role-card-header">
                    <span className="role-badge-tag tag-accounts">ACCOUNTS</span>
                    <FileSpreadsheet size={15} className="tag-accounts" />
                  </div>
                  <div className="role-user-email">accounts@chocodist.com</div>
                </div>
                <button
                  className="role-quick-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickDemoLogin('accounts@chocodist.com', 'ChocoAccounts#2026!D4');
                  }}
                  disabled={isSubmitting}
                >
                  Quick Login
                </button>
              </div>
            </div>
          </div>

          {/* Security & Trust Notice Footer */}
          <div className="login-trust-notice">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Lock size={12} /> Secure access to ChocoDist Operations
            </span>
            <span>Authorized personnel only</span>
          </div>

          {/* Copyright Footer */}
          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', marginTop: '1.25rem' }}>
            © 2026 ChocoDist · Chocolate Wholesale & Distribution Operations
          </div>
        </div>
      </div>
    </div>
  );
};
