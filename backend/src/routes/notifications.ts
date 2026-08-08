import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Helper function to dispatch role-scoped notifications
export async function dispatchRoleNotifications({
  roles,
  title,
  message,
  type,
  entityId,
  entityType,
}: {
  roles: string[];
  title: string;
  message: string;
  type: string;
  entityId?: string;
  entityType?: string;
}) {
  try {
    // Find all users with matching roles (or ADMIN who gets all notifications)
    const targetUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: { in: roles } },
          { role: 'ADMIN' },
        ],
      },
      select: { id: true },
    });

    if (targetUsers.length === 0) return;

    // Create notifications for each target user
    await prisma.notification.createMany({
      data: targetUsers.map((u) => ({
        userId: u.id,
        title,
        message,
        type,
        entityId: entityId || null,
        entityType: entityType || null,
        isRead: false,
      })),
    });
  } catch (err) {
    console.error('Failed to dispatch notifications:', err);
  }
}

// GET /api/notifications - Get notifications for currently authenticated user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
});

// GET /api/notifications/unread-count - Get unread count for current user
router.get('/unread-count', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread notification count',
    });
  }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: updated,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    });
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read for current user
router.patch('/read-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
    });
  }
});

export default router;
