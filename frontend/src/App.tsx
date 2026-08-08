import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { ChallansPage } from './pages/ChallansPage';

const MainLayout: React.FC = () => {
  const { user, canAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (!user) {
    return <LoginPage />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} />;
      case 'customers':
        return canAccess('customers') ? <CustomersPage /> : <AccessDenied module="Customers CRM" />;
      case 'products':
        return canAccess('products') ? <ProductsPage /> : <AccessDenied module="Products Catalog" />;
      case 'inventory':
        return canAccess('inventory') ? <InventoryPage /> : <AccessDenied module="Stock Movements Log" />;
      case 'challans':
        return canAccess('challans') ? <ChallansPage /> : <AccessDenied module="Sales Challans" />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-wrapper">
        <TopBar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="content-body">{renderActivePage()}</main>
      </div>
    </div>
  );
};

const AccessDenied: React.FC<{ module: string }> = ({ module }) => (
  <div className="empty-state" style={{ marginTop: '3rem' }}>
    <h3 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Access Restricted</h3>
    <p>Your logged-in role does not have permission to view the <strong>{module}</strong> module.</p>
  </div>
);

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
