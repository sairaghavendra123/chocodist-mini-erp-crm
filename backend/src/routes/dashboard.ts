import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// GET /api/dashboard/stats
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalCustomers, totalProducts, allProducts, totalChallans, recentChallans] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.product.findMany({ select: { id: true, name: true, sku: true, currentStock: true, minStockAlert: true, warehouseLocation: true } }),
      prisma.challan.count(),
      prisma.challan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, businessName: true } },
          createdBy: { select: { name: true } },
        },
      }),
    ]);

    const lowStockProducts = allProducts.filter((p) => p.currentStock <= p.minStockAlert);

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalProducts,
        lowStockCount: lowStockProducts.length,
        totalChallans,
        recentChallans,
        lowStockProducts: lowStockProducts.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
    });
  }
});

export default router;
