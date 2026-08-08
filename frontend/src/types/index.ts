export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mobile?: string | null;
  employeeId?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  status?: string | null;
  lastLogin?: string | null;
  createdAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  entityId?: string | null;
  entityType?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdById: string;
  createdBy?: { id: string; name: string; role?: string };
  createdAt: string;
  updatedAt: string;
  _count?: { challans: number };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  warehouseLocation: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: { id: string; name: string; sku: string; category: string };
  quantityChanged: number;
  movementType: MovementType;
  reason: string;
  createdById: string;
  createdBy?: { id: string; name: string; role: string };
  createdAt: string;
}

export interface ChallanItem {
  id: string;
  challanId?: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    businessName: string;
    mobile?: string;
    email?: string;
    gstNumber?: string | null;
    address?: string;
  };
  totalQuantity: number;
  totalAmount: number;
  status: ChallanStatus;
  createdById: string;
  createdBy?: { id: string; name: string; role: string };
  items: ChallanItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  totalChallans: number;
  recentChallans: Challan[];
  lowStockProducts: Product[];
}
