import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';
import User from '../models/User.model';
import { ACCESS_COOKIE } from '../utils/auth-cookies';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
  isAdmin?: boolean;
}

function extractAccessToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.[ACCESS_COOKIE];
  if (cookieToken && typeof cookieToken === 'string') {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return undefined;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = extractAccessToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = extractAccessToken(req);

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.userId = decoded.userId;
    } catch {
      // continue without auth
    }
  }
  next();
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = user;
    req.isAdmin = true;
    next();
  } catch {
    return res.status(500).json({ message: 'Authorization failed' });
  }
};
