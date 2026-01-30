import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateStudentToken, authenticateStudent, StudentAuthRequest } from '../middleware/studentAuth';

const router = Router();
const prisma = new PrismaClient();

// Student login
router.post('/login', async (req, res: Response) => {
  try {
    const { studentId, password, classId } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({ error: 'Student ID and password are required' });
    }

    // Find student by studentId (and optionally classId if provided)
    const whereClause: { studentId: string; classId?: number } = { studentId };
    if (classId) {
      whereClause.classId = parseInt(classId);
    }

    const student = await prisma.student.findFirst({
      where: whereClause,
      include: {
        class: {
          select: { id: true, name: true, section: true }
        }
      }
    });

    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!student.password) {
      return res.status(401).json({ error: 'Password not set. Please set your password first.' });
    }

    const validPassword = await bcrypt.compare(password, student.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login time
    await prisma.student.update({
      where: { id: student.id },
      data: { lastLoginAt: new Date() }
    });

    const token = generateStudentToken(student.id, student.classId);

    res.json({
      token,
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        class: student.class
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Set password for first-time setup
router.post('/set-password', async (req, res: Response) => {
  try {
    const { studentId, classId, password } = req.body;

    if (!studentId || !classId || !password) {
      return res.status(400).json({ error: 'Student ID, class ID, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const student = await prisma.student.findFirst({
      where: {
        studentId,
        classId: parseInt(classId)
      },
      include: {
        class: {
          select: { id: true, name: true, section: true }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.password) {
      return res.status(400).json({ error: 'Password already set. Use reset password instead.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.student.update({
      where: { id: student.id },
      data: { password: hashedPassword }
    });

    const token = generateStudentToken(student.id, student.classId);

    res.json({
      message: 'Password set successfully',
      token,
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        class: student.class
      }
    });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ error: 'Failed to set password' });
  }
});

// Get current student info
router.get('/me', authenticateStudent, async (req: StudentAuthRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.studentId },
      include: {
        class: {
          select: { id: true, name: true, section: true }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      class: student.class
    });
  } catch (error) {
    console.error('Get student info error:', error);
    res.status(500).json({ error: 'Failed to get student info' });
  }
});

export default router;
