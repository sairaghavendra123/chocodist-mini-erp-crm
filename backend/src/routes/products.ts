import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

router.use(authenticateToken);

const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(2, 'SKU must be at least 2 characters'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  currentStock: z.number().int().min(0, 'Current stock cannot be negative'),
  minStockAlert: z.number().int().min(0, 'Min stock alert quantity cannot be negative'),
  warehouseLocation: z.string().min(2, 'Warehouse location is required'),
});

// GET /api/products - List products with Search, Category & Low Stock Filter
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, category, lowStock } = req.query;

    const whereClause: any = {};

    if (category && typeof category === 'string') {
      whereClause.category = category;
    }

    if (q && typeof q === 'string') {
      const search = q.trim();
      whereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { contains: search } },
        { warehouseLocation: { contains: search } },
      ];
    }

    let products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    if (lowStock === 'true') {
      products = products.filter((p) => p.currentStock <= p.minStockAlert);
    }

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products list',
    });
  }
});

// GET /api/products/:id - Single product details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { createdBy: { select: { name: true, role: true } } },
        },
      },
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product details' });
  }
});

// POST /api/products - Create Product (Admin & Warehouse)
router.post('/', authorizeRoles('WAREHOUSE'), async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = productSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
      return;
    }

    const data = parseResult.data;

    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku.toUpperCase() },
    });

    if (existingSku) {
      res.status(400).json({
        success: false,
        message: `Product SKU '${data.sku}' already exists.`,
      });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku.toUpperCase(),
        category: data.category,
        unitPrice: data.unitPrice,
        currentStock: data.currentStock,
        minStockAlert: data.minStockAlert,
        warehouseLocation: data.warehouseLocation,
      },
    });

    // Log initial stock movement if initial stock > 0
    if (data.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantityChanged: data.currentStock,
          movementType: 'IN',
          reason: 'Initial Product Setup Stock',
          createdById: req.user!.id,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
    });
  }
});

// PUT /api/products/:id - Update Product (Admin & Warehouse)
router.put('/:id', authorizeRoles('WAREHOUSE'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    const parseResult = productSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
      return;
    }

    const updateData = parseResult.data;

    if (updateData.sku && updateData.sku.toUpperCase() !== existingProduct.sku) {
      const skuCheck = await prisma.product.findUnique({
        where: { sku: updateData.sku.toUpperCase() },
      });
      if (skuCheck) {
        res.status(400).json({
          success: false,
          message: `Product SKU '${updateData.sku}' already exists.`,
        });
        return;
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        ...(updateData.sku && { sku: updateData.sku.toUpperCase() }),
      },
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
    });
  }
});

export default router;
