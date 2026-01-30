import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, AdminAuthRequest } from '../../middleware/adminAuth';

const router = Router();
const prisma = new PrismaClient();

// Apply admin auth to all routes
router.use(authenticateAdmin);

// Get all students with pagination and search
router.get('/', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { search, classId, teacherId, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: {
      OR?: Array<{
        name?: { contains: string };
        studentId?: { contains: string };
        email?: { contains: string };
      }>;
      classId?: number;
      class?: { teacherId: number };
    } = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { studentId: { contains: search as string } },
        { email: { contains: search as string } }
      ];
    }

    if (classId) {
      where.classId = parseInt(classId as string);
    }

    if (teacherId) {
      where.class = { teacherId: parseInt(teacherId as string) };
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          class: {
            include: {
              teacher: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limitNum
      }),
      prisma.student.count({ where })
    ]);

    res.json({
      students: students.map(s => ({
        id: s.id,
        studentId: s.studentId,
        name: s.name,
        email: s.email,
        phone: s.phone,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        parentEmail: s.parentEmail,
        hasPassword: !!s.password,
        lastLoginAt: s.lastLoginAt,
        class: {
          id: s.class.id,
          name: s.class.name,
          section: s.class.section,
          teacher: s.class.teacher
        }
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

// Get a single student with full details
router.get('/:id', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      include: {
        class: {
          include: {
            teacher: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            attendances: true,
            quizScores: true,
            examScores: true
          }
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
      phone: student.phone,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      hasPassword: !!student.password,
      lastLoginAt: student.lastLoginAt,
      class: {
        id: student.class.id,
        name: student.class.name,
        section: student.class.section,
        teacher: student.class.teacher
      },
      stats: student._count
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Failed to get student' });
  }
});

// Update a student
router.put('/:id', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { studentId, name, email, phone, parentName, parentPhone, parentEmail, classId } = req.body;

    const existingStudent = await prisma.student.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // If changing class, verify the new class exists
    if (classId && classId !== existingStudent.classId) {
      const newClass = await prisma.class.findUnique({
        where: { id: classId }
      });
      if (!newClass) {
        return res.status(400).json({ error: 'Class not found' });
      }
    }

    const updateData: {
      studentId?: string;
      name?: string;
      email?: string | null;
      phone?: string | null;
      parentName?: string | null;
      parentPhone?: string | null;
      parentEmail?: string | null;
      classId?: number;
    } = {};

    if (studentId !== undefined) updateData.studentId = studentId;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (parentName !== undefined) updateData.parentName = parentName || null;
    if (parentPhone !== undefined) updateData.parentPhone = parentPhone || null;
    if (parentEmail !== undefined) updateData.parentEmail = parentEmail || null;
    if (classId !== undefined) updateData.classId = classId;

    const student = await prisma.student.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        class: {
          include: {
            teacher: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        adminId: req.adminId!,
        action: 'UPDATE',
        entityType: 'Student',
        entityId: student.id,
        details: JSON.stringify({
          changes: Object.keys(updateData),
          studentId: student.studentId,
          name: student.name
        }),
        ipAddress: req.ip || req.socket.remoteAddress
      }
    });

    res.json({
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      phone: student.phone,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      class: {
        id: student.class.id,
        name: student.class.name,
        section: student.class.section,
        teacher: student.class.teacher
      }
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete a student
router.delete('/:id', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await prisma.student.delete({
      where: { id: parseInt(id) }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        adminId: req.adminId!,
        action: 'DELETE',
        entityType: 'Student',
        entityId: parseInt(id),
        details: JSON.stringify({
          studentId: student.studentId,
          name: student.name
        }),
        ipAddress: req.ip || req.socket.remoteAddress
      }
    });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Reset student password
router.post('/:id/reset-password', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await prisma.student.update({
      where: { id: parseInt(id) },
      data: { password: null }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        adminId: req.adminId!,
        action: 'UPDATE',
        entityType: 'Student',
        entityId: parseInt(id),
        details: JSON.stringify({
          action: 'password_reset',
          studentId: student.studentId,
          name: student.name
        }),
        ipAddress: req.ip || req.socket.remoteAddress
      }
    });

    res.json({ message: 'Student password reset successfully. They can now set a new password.' });
  } catch (error) {
    console.error('Reset student password error:', error);
    res.status(500).json({ error: 'Failed to reset student password' });
  }
});

export default router;
