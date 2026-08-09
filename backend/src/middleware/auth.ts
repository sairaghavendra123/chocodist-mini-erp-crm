import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayloadUser } from '../types/express';

const JWT_SECRET = process.env.JWT_SECRET || 'mini_erp_crm_super_secret_jwt_key_2026';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. Authorization token missing.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
    return;
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    // ADMIN role has access to all resources
    if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: `Access forbidden for role '${req.user.role}'. Required: ${allowedRoles.join(', ')}`,
    });
    return;
  };
};
