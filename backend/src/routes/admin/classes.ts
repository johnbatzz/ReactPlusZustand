import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, AdminAuthRequest } from '../../middleware/adminAuth';

const router = Router();
const prisma = new PrismaClient();

// Apply admin auth to all routes
router.use(authenticateAdmin);

// Get all classes with teacher info
router.get('/', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { teacherId } = req.query;

    const where: { teacherId?: number } = {};
    if (teacherId) {
      where.teacherId = parseInt(teacherId as string);
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, name: true, email: true, isActive: true }
        },
        _count: {
          select: {
            students: true,
            quizzes: true,
            exams: true
          }
        }
      },
      orderBy: [
        { teacher: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    res.json(classes.map(c => ({
      id: c.id,
      name: c.name,
      section: c.section,
      createdAt: c.createdAt,
      teacher: c.teacher,
      studentCount: c._count.students,
      quizCount: c._count.quizzes,
      examCount: c._count.exams
    })));
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Failed to get classes' });
  }
});

// Get a single class with details
router.get('/:id', async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const classData = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: {
        teacher: {
          select: { id: true, name: true, email: true, isActive: true }
        },
        students: {
          select: {
            id: true,
            studentId: true,
            name: true,
            email: true
          },
          orderBy: { name: 'asc' }
        },
        gradeWeights: true,
        _count: {
          select: {
            quizzes: true,
            exams: true
          }
        }
      }
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({
      id: classData.id,
      name: classData.name,
      section: classData.section,
      createdAt: classData.createdAt,
      teacher: classData.teacher,
      students: classData.students,
      gradeWeights: classData.gradeWeights,
      quizCount: classData._count.quizzes,
      examCount: classData._count.exams
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: 'Failed to get class' });
  }
});

export default router;
