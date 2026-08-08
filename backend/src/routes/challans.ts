import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { dispatchRoleNotifications } from './notifications';
import { z } from 'zod';

const router = Router();

router.use(authenticateToken);
// Sales, Accounts, Admin have access
router.use(authorizeRoles('SALES', 'ACCOUNTS'));

const challanItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

const createChallanSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
  items: z.array(challanItemSchema).min(1, 'At least one product item is required'),
});

// Helper function to generate unique auto-incrementing Challan Number
const generateChallanNumber = async (): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const count = await prisma.challan.count();
  const sequence = String(count + 1).padStart(4, '0');
  return `CH-${dateStr}-${sequence}`;
};

// GET /api/challans - List all sales challans
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, customerId, q } = req.query;

    const whereClause: any = {};

    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    if (customerId && typeof customerId === 'string') {
      whereClause.customerId = customerId;
    }

    if (q && typeof q === 'string') {
      const search = q.trim();
      whereClause.OR = [
        { challanNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { businessName: { contains: search } } },
      ];
    }

    const challans = await prisma.challan.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, businessName: true, mobile: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });

    res.json({
      success: true,
      data: challans,
    });
  } catch (error) {
    console.error('Error fetching challans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales challans',
    });
  }
});

// GET /api/challans/:id - Get detailed sales challan
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, role: true, email: true } },
        items: true,
      },
    });

    if (!challan) {
      res.status(404).json({ success: false, message: 'Sales challan not found' });
      return;
    }

    res.json({
      success: true,
      data: challan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sales challan details' });
  }
});

// POST /api/challans - Create Sales Challan (as Draft or Confirmed)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = createChallanSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
      return;
    }

    const { customerId, status, items } = parseResult.data;
    const userId = req.user!.id;

    // Verify customer existence
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      res.status(404).json({ success: false, message: 'Selected customer not found' });
      return;
    }

    // Fetch product details for snapshot and stock checks
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      res.status(400).json({ success: false, message: 'One or more selected products are invalid' });
      return;
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calculate totals and prepare snapshot items
    let totalQuantity = 0;
    let totalAmount = 0;
    const preparedItems: {
      productId: string;
      productName: string;
      sku: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const itemTotalPrice = product.unitPrice * item.quantity;
      totalQuantity += item.quantity;
      totalAmount += itemTotalPrice;

      preparedItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitPrice: product.unitPrice,
        quantity: item.quantity,
        totalPrice: itemTotalPrice,
      });
    }

    const challanNumber = await generateChallanNumber();

    // If initial status is DRAFT, save without stock deduction
    if (status === 'DRAFT') {
      const newChallan = await prisma.challan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity,
          totalAmount,
          status: 'DRAFT',
          createdById: userId,
          items: {
            create: preparedItems,
          },
        },
        include: {
          customer: { select: { name: true, businessName: true } },
          createdBy: { select: { name: true } },
          items: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Sales challan saved as Draft',
        data: newChallan,
      });
      return;
    }

    // If status is CONFIRMED, perform inside interactive transaction
    const newChallan = await prisma.$transaction(async (tx) => {
      // 1. Verify stock for all items
      for (const item of items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (!prod) {
          throw new Error(`Product not found (ID: ${item.productId})`);
        }
        if (prod.currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${prod.name} (SKU: ${prod.sku}). Available: ${prod.currentStock}, Requested: ${item.quantity}`
          );
        }
      }

      // 2. Reduce stock & create stock movements
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: 'OUT',
            reason: `Sales Challan Confirmation (${challanNumber})`,
            createdById: userId,
          },
        });
      }

      // 3. Create confirmed challan
      return await tx.challan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity,
          totalAmount,
          status: 'CONFIRMED',
          createdById: userId,
          items: {
            create: preparedItems,
          },
        },
        include: {
          customer: { select: { name: true, businessName: true } },
          createdBy: { select: { name: true } },
          items: true,
        },
      });
    });

    // Dispatch Notification for relevant roles
    dispatchRoleNotifications({
      roles: ['SALES', 'ACCOUNTS', 'WAREHOUSE', 'ADMIN'],
      title: newChallan.status === 'CONFIRMED' ? 'SALES CHALLAN CONFIRMED' : 'NEW SALES CHALLAN',
      message: `Sales Challan ${newChallan.challanNumber} (${newChallan.customer.businessName}) was created.`,
      type: newChallan.status === 'CONFIRMED' ? 'CHALLAN_CONFIRMED' : 'NEW_CHALLAN',
      entityId: newChallan.id,
      entityType: 'CHALLAN',
    }).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Sales challan created and confirmed successfully',
      data: newChallan,
    });
  } catch (error: any) {
    console.error('Error creating sales challan:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create sales challan',
    });
  }
});

// PUT /api/challans/:id/confirm - Confirm an existing Draft Challan
router.put('/:id/confirm', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!challan) {
        throw new Error('Sales challan not found');
      }

      if (challan.status !== 'DRAFT') {
        throw new Error(`Cannot confirm a challan that is already '${challan.status}'`);
      }

      // 1. Check stock for all items
      for (const item of challan.items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (!prod) {
          throw new Error(`Product '${item.productName}' no longer exists`);
        }
        if (prod.currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for '${item.productName}'. Available: ${prod.currentStock}, Requested: ${item.quantity}`
          );
        }
      }

      // 2. Reduce stock & record stock movement OUT
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: 'OUT',
            reason: `Challan ${challan.challanNumber} Confirmed`,
            createdById: userId,
          },
        });
      }

      // 3. Update status to CONFIRMED
      return await tx.challan.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: {
          customer: { select: { name: true, businessName: true } },
          createdBy: { select: { name: true } },
          items: true,
        },
      });
    });

    res.json({
      success: true,
      message: `Challan ${result.challanNumber} confirmed successfully`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error confirming challan:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to confirm sales challan',
    });
  }
});

// PUT /api/challans/:id/cancel - Cancel a Challan
router.put('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({ where: { id } });
    if (!challan) {
      res.status(404).json({ success: false, message: 'Sales challan not found' });
      return;
    }

    if (challan.status === 'CONFIRMED') {
      res.status(400).json({
        success: false,
        message: 'Confirmed challans cannot be cancelled. Stock has already been dispatched.',
      });
      return;
    }

    if (challan.status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        message: 'Challan is already cancelled.',
      });
      return;
    }

    const updatedChallan = await prisma.challan.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.json({
      success: true,
      message: `Challan ${updatedChallan.challanNumber} cancelled successfully`,
      data: updatedChallan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel sales challan' });
  }
});

export default router;
