import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface StudentAuthRequest extends Request {
  studentId?: number;
  classId?: number;
}

export function authenticateStudent(req: StudentAuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    const payload = decoded as { studentId: number; classId: number; type: string };
    if (payload.type !== 'student') {
      return res.status(403).json({ error: 'Invalid token type' });
    }
    req.studentId = payload.studentId;
    req.classId = payload.classId;
    next();
  });
}

export function generateStudentToken(studentId: number, classId: number): string {
  return jwt.sign({ studentId, classId, type: 'student' }, JWT_SECRET, { expiresIn: '7d' });
}
