import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { dispatchRoleNotifications } from './notifications';
import { z } from 'zod';

const router = Router();

// Protect all customer routes (Allowed: SALES, ACCOUNTS, ADMIN)
router.use(authenticateToken);
router.use(authorizeRoles('SALES', 'ACCOUNTS'));

const customerSchema = z.object({
  name: z.string().min(2, 'Customer Name must be at least 2 characters'),
  mobile: z.string().regex(/^[0-9+\-\s]{10,15}$/, 'Mobile number must be a valid 10-15 digit number'),
  email: z.string().email('Please enter a valid email address').or(z.literal('')).optional().transform((val) => val || ''),
  businessName: z.string().min(2, 'Business Name is required'),
  gstNumber: z.string().optional().nullable(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'], {
    errorMap: () => ({ message: 'Invalid customer type' }),
  }),
  address: z.string().min(3, 'Address is required'),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE'], {
    errorMap: () => ({ message: 'Invalid customer status' }),
  }),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/customers - List with Search & Filter
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, status, customerType } = req.query;

    const whereClause: any = {};

    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    if (customerType && typeof customerType === 'string') {
      whereClause.customerType = customerType;
    }

    if (q && typeof q === 'string') {
      const search = q.trim();
      whereClause.OR = [
        { name: { contains: search } },
        { businessName: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        _count: {
          select: { challans: true },
        },
      },
    });

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers list',
    });
  }
});

// GET /api/customers/:id - View single customer details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        challans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            challanNumber: true,
            totalQuantity: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details',
    });
  }
});

// POST /api/customers - Add Customer (Enforce permissions: Only ADMIN and SALES allowed)
router.post('/', authorizeRoles('SALES'), async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = customerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
      return;
    }

    const data = parseResult.data;
    const userId = req.user!.id;

    // Check duplicate mobile number
    const existingMobile = await prisma.customer.findFirst({
      where: { mobile: data.mobile.trim() },
    });
    if (existingMobile) {
      res.status(400).json({
        success: false,
        message: 'A customer with this mobile number already exists.',
      });
      return;
    }

    // Format address string with City, State, Pincode
    let fullAddress = data.address.trim();
    const addressParts: string[] = [];
    if (data.city && data.city.trim()) addressParts.push(data.city.trim());
    if (data.state && data.state.trim()) addressParts.push(data.state.trim());
    if (addressParts.length > 0) fullAddress += `, ${addressParts.join(', ')}`;
    if (data.pincode && data.pincode.trim()) fullAddress += ` - ${data.pincode.trim()}`;

    const customer = await prisma.customer.create({
      data: {
        name: data.name.trim(),
        mobile: data.mobile.trim(),
        email: data.email ? data.email.toLowerCase().trim() : '',
        businessName: data.businessName.trim(),
        gstNumber: data.gstNumber ? data.gstNumber.trim() : null,
        customerType: data.customerType,
        address: fullAddress,
        status: data.status,
        followUpDate: data.followUpDate || null,
        notes: data.notes || null,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Dispatch NEW_CUSTOMER Notification for relevant roles
    dispatchRoleNotifications({
      roles: ['SALES', 'ACCOUNTS', 'ADMIN'],
      title: 'NEW CUSTOMER ADDED',
      message: `Customer ${customer.businessName} (${customer.name}) was registered.`,
      type: 'NEW_CUSTOMER',
      entityId: customer.id,
      entityType: 'CUSTOMER',
    }).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Customer added successfully',
      data: customer,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
    });
  }
});

// PUT /api/customers/:id - Update Customer / Add follow-up notes (Enforce permissions: Only ADMIN and SALES allowed)
router.put('/:id', authorizeRoles('SALES'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    const parseResult = customerSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
      return;
    }

    const updateData = parseResult.data;

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...updateData,
        ...(updateData.email && { email: updateData.email.toLowerCase() }),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer,
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
    });
  }
});

// DELETE /api/customers/:id - Delete Customer (Enforce permissions: Only ADMIN and SALES allowed)
router.delete('/:id', authorizeRoles('SALES'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const challanCount = await prisma.challan.count({ where: { customerId: id } });
    if (challanCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete customer with ${challanCount} associated sales challan(s).`,
      });
      return;
    }

    await prisma.customer.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
    });
  }
});

export default router;
