import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AdminAuthRequest extends Request {
  adminId?: number;
  adminRole?: string;
}

export function authenticateAdmin(req: AdminAuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    const payload = decoded as { adminId: number; role: string; type: string };
    if (payload.type !== 'admin') {
      return res.status(403).json({ error: 'Invalid token type' });
    }
    req.adminId = payload.adminId;
    req.adminRole = payload.role;
    next();
  });
}

export function generateAdminToken(adminId: number, role: string): string {
  return jwt.sign({ adminId, role, type: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
}
