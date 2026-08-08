import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🍫 Starting database seed for ChocoDist - Chocolate Wholesale Portal...');

  // Clean existing tables in proper relation order
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('ChocoAdmin#2026!A7', 10);
  const salesPassword = await bcrypt.hash('ChocoSales#2026!B8', 10);
  const warehousePassword = await bcrypt.hash('ChocoWarehouse#2026!C9', 10);
  const accountsPassword = await bcrypt.hash('ChocoAccounts#2026!D4', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Sai Raghavendra',
      email: 'admin@chocodist.com',
      password: adminPassword,
      role: 'ADMIN',
      mobile: '+91 98765 43210',
      employeeId: 'EMP-ADM-001',
      department: 'Executive Management',
      jobTitle: 'Operations Director',
      status: 'ACTIVE',
      lastLogin: new Date(),
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Chandu',
      email: 'sales@chocodist.com',
      password: salesPassword,
      role: 'SALES',
      mobile: '+91 98765 43211',
      employeeId: 'EMP-SAL-002',
      department: 'Sales & Distribution',
      jobTitle: 'Senior Sales Executive',
      status: 'ACTIVE',
      lastLogin: new Date(),
    },
  });

  const warehouseUser = await prisma.user.create({
    data: {
      name: 'Sesha Sai',
      email: 'warehouse@chocodist.com',
      password: warehousePassword,
      role: 'WAREHOUSE',
      mobile: '+91 98765 43212',
      employeeId: 'EMP-WHS-003',
      department: 'Logistics & Inventory',
      jobTitle: 'Warehouse Operations Manager',
      status: 'ACTIVE',
      lastLogin: new Date(),
    },
  });

  const accountsUser = await prisma.user.create({
    data: {
      name: 'Mukesh Raju',
      email: 'accounts@chocodist.com',
      password: accountsPassword,
      role: 'ACCOUNTS',
      mobile: '+91 98765 43213',
      employeeId: 'EMP-ACC-004',
      department: 'Finance & Accounts',
      jobTitle: 'Lead Financial Accountant',
      status: 'ACTIVE',
      lastLogin: new Date(),
    },
  });

  console.log('✅ Created 4 demo role users for ChocoDist.');

  // 2. Create Realistic B2B Chocolate Customers
  const customerList = [
    {
      name: 'Ramesh Gupta',
      mobile: '+91 9876543210',
      email: 'ramesh@abcsupermarket.in',
      businessName: 'ABC Supermarket Pvt Ltd',
      gstNumber: '27AAACA123411Z5',
      customerType: 'WHOLESALE',
      address: 'Plot 45, Commercial Complex, MG Road, Mumbai, Maharashtra 400001',
      status: 'ACTIVE',
      followUpDate: '2026-08-15',
      notes: 'Follow up regarding monthly chocolate order.',
    },
    {
      name: 'Suresh Menon',
      mobile: '+91 9820011223',
      email: 'suresh@srilakshmistores.co.in',
      businessName: 'Sri Lakshmi Stores',
      gstNumber: '33AABCM9876F1Z2',
      customerType: 'RETAIL',
      address: '112 Station Road, T. Nagar, Chennai, Tamil Nadu 600017',
      status: 'ACTIVE',
      followUpDate: '2026-08-20',
      notes: 'Discussed increasing 5 Star quantity for next order.',
    },
    {
      name: 'Vikram Singh',
      mobile: '+91 9414055667',
      email: 'vikram@krishnagrocery.com',
      businessName: 'Krishna Grocery Mart',
      gstNumber: '08BBBPS4321D1Z9',
      customerType: 'RETAIL',
      address: '78 Main Bazaar, Raja Park, Jaipur, Rajasthan 302004',
      status: 'ACTIVE',
      followUpDate: '2026-08-12',
      notes: 'Customer requested weekly stock availability update.',
    },
    {
      name: 'Anita Desai',
      mobile: '+91 9988776655',
      email: 'anita@vijayretail.org',
      businessName: 'Vijay Retail Hub',
      gstNumber: '24AACCD5678E1Z1',
      customerType: 'RETAIL',
      address: 'Ring Road Market, Surat, Gujarat 395002',
      status: 'LEAD',
      followUpDate: '2026-08-10',
      notes: 'Follow up regarding new product requirement.',
    },
    {
      name: 'Deepak Joshi',
      mobile: '+91 9711223344',
      email: 'deepak@saidistributors.in',
      businessName: 'Sai Distributors',
      gstNumber: '07AAACJ8765K1Z4',
      customerType: 'DISTRIBUTOR',
      address: 'A-14 Logistics Hub, Connaught Place, New Delhi 110001',
      status: 'ACTIVE',
      followUpDate: '2026-08-25',
      notes: 'Key regional distributor. Inquired about bulk discount rates on Dairy Milk Silk.',
    },
    {
      name: 'Manish Reddy',
      mobile: '+91 9849012345',
      email: 'manish@cityfresh.com',
      businessName: 'City Fresh Supermarket',
      gstNumber: '36AABCR1234M1Z6',
      customerType: 'WHOLESALE',
      address: 'Banjara Hills Road 12, Hyderabad, Telangana 500034',
      status: 'ACTIVE',
      followUpDate: '2026-08-18',
      notes: 'Weekly recurring purchase of wafer and bar chocolates.',
    },
    {
      name: 'Kavita Nair',
      mobile: '+91 9447011999',
      email: 'kavita@kumarwholesale.in',
      businessName: 'Kumar Wholesale Stores',
      gstNumber: '32AABCN5432P1Z0',
      customerType: 'WHOLESALE',
      address: 'MG Road Wholesale Market, Kochi, Kerala 682016',
      status: 'ACTIVE',
      followUpDate: '2026-08-22',
      notes: 'Prompt paymaster. Requests refrigerated delivery dispatch.',
    },
    {
      name: 'Harpreet Singh',
      mobile: '+91 9814033221',
      email: 'harpreet@greenbasket.com',
      businessName: 'Green Basket Retail',
      gstNumber: '03AABCP1122Q1Z3',
      customerType: 'RETAIL',
      address: 'Focal Point Market, Ludhiana, Punjab 141010',
      status: 'LEAD',
      followUpDate: '2026-08-14',
      notes: 'Initial inquiry received for Festive Chocolate Gift Boxes.',
    },
  ];

  const createdCustomers = [];
  for (const cust of customerList) {
    const c = await prisma.customer.create({
      data: {
        ...cust,
        createdById: salesUser.id,
      },
    });
    createdCustomers.push(c);
  }
  console.log(`✅ Created ${createdCustomers.length} realistic B2B chocolate customers.`);

  // 3. Create Wholesale Chocolate Products (Including Low-Stock items)
  const productList = [
    {
      name: 'Dairy Milk (50g)',
      sku: 'CHO-DM-001',
      category: 'Milk Chocolate',
      unitPrice: 50.0,
      currentStock: 500,
      minStockAlert: 100,
      warehouseLocation: 'Bay 01-A (Temp Control)',
    },
    {
      name: '5 Star (40g)',
      sku: 'CHO-5S-002',
      category: 'Chocolate Bars',
      unitPrice: 20.0,
      currentStock: 350,
      minStockAlert: 80,
      warehouseLocation: 'Rack B-02',
    },
    {
      name: 'Perk (28g)',
      sku: 'CHO-PK-003',
      category: 'Wafer Chocolate',
      unitPrice: 15.0,
      currentStock: 400,
      minStockAlert: 90,
      warehouseLocation: 'Rack B-03',
    },
    {
      name: 'Gems (25g Pouch)',
      sku: 'CHO-GM-004',
      category: 'Chocolate Pouches',
      unitPrice: 30.0,
      currentStock: 250,
      minStockAlert: 50,
      warehouseLocation: 'Bin 102',
    },
    {
      name: 'Dairy Milk Silk (150g)',
      sku: 'CHO-DMS-005',
      category: 'Premium Chocolate',
      unitPrice: 180.0,
      currentStock: 15, // Low Stock Alert!
      minStockAlert: 30,
      warehouseLocation: 'Cold Storage Shed C',
    },
    {
      name: 'Munch (22g)',
      sku: 'CHO-MN-006',
      category: 'Wafer Chocolate',
      unitPrice: 10.0,
      currentStock: 600,
      minStockAlert: 100,
      warehouseLocation: 'Rack B-01',
    },
    {
      name: 'KitKat (38.5g 4-Finger)',
      sku: 'CHO-KK-007',
      category: 'Wafer Chocolate',
      unitPrice: 40.0,
      currentStock: 300,
      minStockAlert: 60,
      warehouseLocation: 'Bay 02-A',
    },
    {
      name: 'Fuse (45g)',
      sku: 'CHO-FS-008',
      category: 'Chocolate Bars',
      unitPrice: 35.0,
      currentStock: 18, // Low Stock Alert!
      minStockAlert: 25,
      warehouseLocation: 'Rack B-04',
    },
    {
      name: 'Bournville Dark Chocolate (80g)',
      sku: 'CHO-BV-009',
      category: 'Dark Chocolate',
      unitPrice: 120.0,
      currentStock: 120,
      minStockAlert: 30,
      warehouseLocation: 'Cold Storage Shed C',
    },
    {
      name: 'Milkybar (25g)',
      sku: 'CHO-MB-010',
      category: 'Milk Chocolate',
      unitPrice: 25.0,
      currentStock: 280,
      minStockAlert: 50,
      warehouseLocation: 'Rack B-05',
    },
  ];

  const createdProducts = [];
  for (const prod of productList) {
    const p = await prisma.product.create({
      data: prod,
    });
    createdProducts.push(p);

    // Initial Stock Movement IN log
    await prisma.stockMovement.create({
      data: {
        productId: p.id,
        quantityChanged: p.currentStock,
        movementType: 'IN',
        reason: 'Supplier delivery',
        createdById: warehouseUser.id,
      },
    });
  }
  console.log(`✅ Created ${createdProducts.length} wholesale chocolate products and inward stock logs.`);

  // 4. Create Sample Chocolate Sales Challans (Draft & Confirmed)
  // Challan 1: CH-2026-001 (ABC Supermarket - Confirmed)
  const c1Item1 = createdProducts[0]; // Dairy Milk
  const c1Item2 = createdProducts[1]; // 5 Star
  const c1Item3 = createdProducts[2]; // Perk
  const c1Qty1 = 50;
  const c1Qty2 = 30;
  const c1Qty3 = 20;
  const c1TotalQty = c1Qty1 + c1Qty2 + c1Qty3;
  const c1TotalAmount = c1Item1.unitPrice * c1Qty1 + c1Item2.unitPrice * c1Qty2 + c1Item3.unitPrice * c1Qty3;

  const challan1 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-2026-001',
      customerId: createdCustomers[0].id, // ABC Supermarket
      totalQuantity: c1TotalQty,
      totalAmount: c1TotalAmount,
      status: 'CONFIRMED',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: c1Item1.id,
            productName: c1Item1.name,
            sku: c1Item1.sku,
            unitPrice: c1Item1.unitPrice,
            quantity: c1Qty1,
            totalPrice: c1Item1.unitPrice * c1Qty1,
          },
          {
            productId: c1Item2.id,
            productName: c1Item2.name,
            sku: c1Item2.sku,
            unitPrice: c1Item2.unitPrice,
            quantity: c1Qty2,
            totalPrice: c1Item2.unitPrice * c1Qty2,
          },
          {
            productId: c1Item3.id,
            productName: c1Item3.name,
            sku: c1Item3.sku,
            unitPrice: c1Item3.unitPrice,
            quantity: c1Qty3,
            totalPrice: c1Item3.unitPrice * c1Qty3,
          },
        ],
      },
    },
  });

  // Outward stock movements for confirmed Challan 1
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: c1Item1.id,
        quantityChanged: c1Qty1,
        movementType: 'OUT',
        reason: 'Sales Challan',
        createdById: salesUser.id,
      },
      {
        productId: c1Item2.id,
        quantityChanged: c1Qty2,
        movementType: 'OUT',
        reason: 'Sales Challan',
        createdById: salesUser.id,
      },
      {
        productId: c1Item3.id,
        quantityChanged: c1Qty3,
        movementType: 'OUT',
        reason: 'Sales Challan',
        createdById: salesUser.id,
      },
    ],
  });

  // Challan 2: CH-2026-002 (Sri Lakshmi Stores - Draft)
  const c2Item1 = createdProducts[6]; // KitKat
  const c2Item2 = createdProducts[5]; // Munch
  const c2Qty1 = 40;
  const c2Qty2 = 50;
  const c2TotalQty = c2Qty1 + c2Qty2;
  const c2TotalAmount = c2Item1.unitPrice * c2Qty1 + c2Item2.unitPrice * c2Qty2;

  await prisma.challan.create({
    data: {
      challanNumber: 'CH-2026-002',
      customerId: createdCustomers[1].id, // Sri Lakshmi Stores
      totalQuantity: c2TotalQty,
      totalAmount: c2TotalAmount,
      status: 'DRAFT',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: c2Item1.id,
            productName: c2Item1.name,
            sku: c2Item1.sku,
            unitPrice: c2Item1.unitPrice,
            quantity: c2Qty1,
            totalPrice: c2Item1.unitPrice * c2Qty1,
          },
          {
            productId: c2Item2.id,
            productName: c2Item2.name,
            sku: c2Item2.sku,
            unitPrice: c2Item2.unitPrice,
            quantity: c2Qty2,
            totalPrice: c2Item2.unitPrice * c2Qty2,
          },
        ],
      },
    },
  });

  // Challan 3: CH-2026-003 (City Fresh Supermarket - Confirmed)
  const c3Item1 = createdProducts[3]; // Gems
  const c3Item2 = createdProducts[8]; // Bournville
  const c3Qty1 = 30;
  const c3Qty2 = 15;
  const c3TotalQty = c3Qty1 + c3Qty2;
  const c3TotalAmount = c3Item1.unitPrice * c3Qty1 + c3Item2.unitPrice * c3Qty2;

  const challan3 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-2026-003',
      customerId: createdCustomers[5].id, // City Fresh Supermarket
      totalQuantity: c3TotalQty,
      totalAmount: c3TotalAmount,
      status: 'CONFIRMED',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: c3Item1.id,
            productName: c3Item1.name,
            sku: c3Item1.sku,
            unitPrice: c3Item1.unitPrice,
            quantity: c3Qty1,
            totalPrice: c3Item1.unitPrice * c3Qty1,
          },
          {
            productId: c3Item2.id,
            productName: c3Item2.name,
            sku: c3Item2.sku,
            unitPrice: c3Item2.unitPrice,
            quantity: c3Qty2,
            totalPrice: c3Item2.unitPrice * c3Qty2,
          },
        ],
      },
    },
  });

  await prisma.stockMovement.createMany({
    data: [
      {
        productId: c3Item1.id,
        quantityChanged: c3Qty1,
        movementType: 'OUT',
        reason: 'Sales Challan',
        createdById: salesUser.id,
      },
      {
        productId: c3Item2.id,
        quantityChanged: c3Qty2,
        movementType: 'OUT',
        reason: 'Sales Challan',
        createdById: salesUser.id,
      },
    ],
  });

  // 5. Seed Initial Role-Scoped Notifications
  await prisma.notification.deleteMany();
  
  await prisma.notification.createMany({
    data: [
      // Admin Notifications
      {
        userId: admin.id,
        title: 'LOW STOCK ALERT',
        message: 'Dairy Milk Silk (150g) has only 15 units remaining.',
        type: 'LOW_STOCK',
        entityType: 'PRODUCT',
        isRead: false,
      },
      {
        userId: admin.id,
        title: 'NEW SALES CHALLAN',
        message: 'Sales Challan CH-2026-003 was confirmed for City Fresh Supermarket.',
        type: 'CHALLAN_CONFIRMED',
        entityType: 'CHALLAN',
        isRead: false,
      },
      {
        userId: admin.id,
        title: 'NEW CUSTOMER REGISTERED',
        message: 'Customer Ramesh Gupta (ABC Supermarket Pvt Ltd) was registered.',
        type: 'NEW_CUSTOMER',
        entityType: 'CUSTOMER',
        isRead: false,
      },
      // Sales Notifications
      {
        userId: salesUser.id,
        title: 'LOW STOCK ALERT',
        message: 'Dairy Milk Silk (150g) is running low on stock (15 units remaining).',
        type: 'LOW_STOCK',
        entityType: 'PRODUCT',
        isRead: false,
      },
      {
        userId: salesUser.id,
        title: 'NEW SALES CHALLAN',
        message: 'Sales Challan CH-2026-003 was created successfully.',
        type: 'NEW_CHALLAN',
        entityType: 'CHALLAN',
        isRead: false,
      },
      {
        userId: salesUser.id,
        title: 'CUSTOMER FOLLOW-UP',
        message: 'Follow-up scheduled with Ramesh Gupta (ABC Supermarket).',
        type: 'NEW_CUSTOMER',
        entityType: 'CUSTOMER',
        isRead: false,
      },
      // Warehouse Notifications
      {
        userId: warehouseUser.id,
        title: 'LOW STOCK ALERT',
        message: 'Dairy Milk Silk (150g) has only 15 units remaining in Cold Storage.',
        type: 'LOW_STOCK',
        entityType: 'PRODUCT',
        isRead: false,
      },
      {
        userId: warehouseUser.id,
        title: 'STOCK RECEIVED',
        message: 'Milkybar (25g): +280 units inward shipment received.',
        type: 'STOCK_RECEIVED',
        entityType: 'PRODUCT',
        isRead: false,
      },
      {
        userId: warehouseUser.id,
        title: 'DISPATCH REQUIRED',
        message: 'Sales Challan CH-2026-001 confirmed for warehouse dispatch.',
        type: 'CHALLAN_CONFIRMED',
        entityType: 'CHALLAN',
        isRead: false,
      },
      // Accounts Notifications
      {
        userId: accountsUser.id,
        title: 'NEW DISPATCH INVOICE',
        message: 'Sales Challan CH-2026-003 confirmed for billing (₹2,700).',
        type: 'CHALLAN_CONFIRMED',
        entityType: 'CHALLAN',
        isRead: false,
      },
      {
        userId: accountsUser.id,
        title: 'NEW B2B ACCOUNT',
        message: 'New B2B Account registered: ABC Supermarket Pvt Ltd.',
        type: 'NEW_CUSTOMER',
        entityType: 'CUSTOMER',
        isRead: false,
      },
    ],
  });

  console.log('✅ Seeded initial role-scoped notifications for all 4 demo users.');
  console.log('🎉 ChocoDist Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Database Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
