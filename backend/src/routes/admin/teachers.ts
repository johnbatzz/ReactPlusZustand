import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticateAdmin, AdminAuthRequest } from '../../middleware/adminAuth';

const router = Router();
const prisma = new PrismaClient();

// Apply admin auth to all routes
router.use(authenticateAdmin);

// Get all teachers with class and student counts
router.get('/', async (req: AdminAuthRequest, res: Response) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        _count: {
          select: {
            classes: true
          }
        },
        classes: {
          include: {
            _count: {
              select: {
                students: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = teachers.map(teacher => ({
      id: teacher.id,
      email: teacher.email,
      name: teacher.name,
      isActive: teacher.isActive,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
      classCount: teacher._count.classes,
      studentCount: teacher.classes.reduce((sum, cls) => sum + cls._count.students, 0)
    }));

    res.json(result);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Failed to get teachers' });
  }
});

// Create a new teacher
router.post('/', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingTeacher = await prisma.teacher.findUnique({
      where: { email }
    });

    if (existingTeacher) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await prisma.teacher.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        adminId: req.adminId!,
        action: 'CREATE',
        entityType: 'Teacher',
        entityId: teacher.id,
        details: JSON.stringify({ email: teacher.email, name: teacher.name }),
        ipAddress: req.ip || req.socket.remoteAddress
      }
    });

    res.status(201).json({
      id: teacher.id,
      email: teacher.email,
      name: teacher.name,
      isActive: teacher.isActive,
      createdAt: teacher.createdAt
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

// Update a teacher
router.put('/:id', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, password, name, isActive } = req.body;

    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTeacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if email is being changed and already in use
    if (email && email !== existingTeacher.email) {
      const emailInUse = await prisma.teacher.findUnique({
        where: { email }
      });
      if (emailInUse) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updateData: {
      email?: string;
      password?: string;
      name?: string;
      isActive?: boolean;
    } = {};

    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const teacher = await prisma.teacher.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        adminId: req.adminId!,
        action: 'UPDATE',
        entityType: 'Teacher',
        entityId: teacher.id,
        details: JSON.stringify({
          changes: Object.keys(updateData).filter(k => k !== 'password'),
          email: teacher.email
        }),
        ipAddress: req.ip || req.socket.remoteAddress
      }
    });

    res.json({
      id: teacher.id,
      email: teacher.email,
      name: teacher.name,
      isActive: teacher.isActive,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});

// Toggle teacher active status
router.patch('/:id/toggle-status', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(id) }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id: parseInt(id) },
      data: { isActive: !teacher.isActive }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        adminId: req.adminId!,
        action: updatedTeacher.isActive ? 'ENABLE' : 'DISABLE',
        entityType: 'Teacher',
        entityId: updatedTeacher.id,
        details: JSON.stringify({
          email: updatedTeacher.email,
          isActive: updatedTeacher.isActive
        }),
        ipAddress: req.ip || req.socket.remoteAddress
      }
    });

    res.json({
      id: updatedTeacher.id,
      email: updatedTeacher.email,
      name: updatedTeacher.name,
      isActive: updatedTeacher.isActive
    });
  } catch (error) {
    console.error('Toggle teacher status error:', error);
    res.status(500).json({ error: 'Failed to toggle teacher status' });
  }
});

// Delete a teacher (only if no classes)
router.delete('/:id', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { classes: true }
        }
      }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    if (teacher._count.classes > 0) {
      return res.status(400).json({
        error: 'Cannot delete teacher with existing classes. Delete or reassign classes first.'
      });
    }

    await prisma.teacher.delete({
      where: { id: parseInt(id) }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        adminId: req.adminId!,
        action: 'DELETE',
        entityType: 'Teacher',
        entityId: parseInt(id),
        details: JSON.stringify({ email: teacher.email, name: teacher.name }),
        ipAddress: req.ip || req.socket.remoteAddress
      }
    });

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

export default router;
