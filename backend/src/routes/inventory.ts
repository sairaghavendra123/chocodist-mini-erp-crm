import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { dispatchRoleNotifications } from './notifications';
import { z } from 'zod';

const router = Router();

router.use(authenticateToken);

const adjustStockSchema = z.object({
  productId: z.string().min(1, 'Product selection is required'),
  quantityChanged: z.number().int().positive('Quantity must be a positive number greater than 0'),
  movementType: z.enum(['IN', 'OUT'], {
    errorMap: () => ({ message: "Movement type must be 'IN' or 'OUT'" }),
  }),
  reason: z.string().min(2, 'Reason for stock movement is required'),
  notes: z.string().optional().nullable(),
});

// GET /api/inventory/movements - Fetch stock movement log (Accessible to WAREHOUSE, ADMIN, SALES, ACCOUNTS)
router.get('/movements', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.query;

    const whereClause: any = {};
    if (productId && typeof productId === 'string') {
      whereClause.productId = productId;
    }

    const movements = await prisma.stockMovement.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, sku: true, category: true },
        },
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    res.json({
      success: true,
      data: movements,
    });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory movements log',
    });
  }
});

// POST /api/inventory/adjust - Stock Entry / Receive Stock & Adjustment (Enforce WAREHOUSE & ADMIN roles)
router.post('/adjust', authorizeRoles('WAREHOUSE'), async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = adjustStockSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
      return;
    }

    const { productId, quantityChanged, movementType, reason, notes } = parseResult.data;
    const userId = req.user!.id;

    // Combine reason and notes for detailed audit entry
    let fullReason = reason.trim();
    if (notes && notes.trim()) {
      fullReason += ` (${notes.trim()})`;
    }

    // Atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new Error(`Product not found (ID: ${productId})`);
      }

      let newStock = product.currentStock;
      if (movementType === 'IN') {
        newStock += quantityChanged;
      } else {
        if (product.currentStock < quantityChanged) {
          throw new Error(
            `Cannot decrease stock below zero. Current stock for '${product.name}' is ${product.currentStock} units, requested reduction is ${quantityChanged} units.`
          );
        }
        newStock -= quantityChanged;
      }

      // Update product current stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      // Create stock movement audit record
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantityChanged,
          movementType,
          reason: fullReason,
          createdById: userId,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          createdBy: { select: { id: true, name: true, role: true } },
        },
      });

      return { product: updatedProduct, movement, previousStock: product.currentStock, newStock };
    });

    // Dispatch Event Notifications based on movement & low stock status
    if (movementType === 'IN') {
      dispatchRoleNotifications({
        roles: ['WAREHOUSE', 'ADMIN'],
        title: 'STOCK RECEIVED',
        message: `${result.product.name} (${result.product.sku}): +${quantityChanged} units received.`,
        type: 'STOCK_RECEIVED',
        entityId: result.product.id,
        entityType: 'PRODUCT',
      }).catch(console.error);
    } else {
      dispatchRoleNotifications({
        roles: ['WAREHOUSE', 'ADMIN'],
        title: 'STOCK ADJUSTMENT',
        message: `${result.product.name} (${result.product.sku}): -${quantityChanged} units adjusted (${reason}).`,
        type: 'STOCK_ADJUSTMENT',
        entityId: result.product.id,
        entityType: 'PRODUCT',
      }).catch(console.error);
    }

    if (result.newStock <= result.product.minStockAlert) {
      dispatchRoleNotifications({
        roles: ['WAREHOUSE', 'SALES', 'ADMIN'],
        title: result.newStock === 0 ? 'OUT OF STOCK ALERT' : 'LOW STOCK ALERT',
        message: `${result.product.name} (${result.product.sku}) has ${result.newStock} units remaining.`,
        type: result.newStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        entityId: result.product.id,
        entityType: 'PRODUCT',
      }).catch(console.error);
    }

    res.json({
      success: true,
      message: `Stock successfully updated. ${movementType === 'IN' ? 'Increased' : 'Decreased'} by ${quantityChanged} units.`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update stock',
    });
  }
});

export default router;
