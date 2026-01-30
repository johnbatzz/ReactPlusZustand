import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, AdminAuthRequest } from '../../middleware/adminAuth';

const router = Router();
const prisma = new PrismaClient();

// Apply admin auth to all routes
router.use(authenticateAdmin);

// Get system-wide statistics
router.get('/stats', async (req: AdminAuthRequest, res: Response) => {
  try {
    const [
      totalTeachers,
      activeTeachers,
      totalStudents,
      totalClasses,
      totalQuizzes,
      totalExams,
      recentLogins
    ] = await Promise.all([
      prisma.teacher.count(),
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.student.count(),
      prisma.class.count(),
      prisma.quiz.count(),
      prisma.exam.count(),
      prisma.student.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    res.json({
      teachers: {
        total: totalTeachers,
        active: activeTeachers,
        inactive: totalTeachers - activeTeachers
      },
      students: {
        total: totalStudents,
        recentLogins
      },
      classes: totalClasses,
      quizzes: totalQuizzes,
      exams: totalExams
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get paginated audit logs
router.get('/audit-logs', async (req: AdminAuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      action,
      entityType,
      adminId
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: {
      action?: string;
      entityType?: string;
      adminId?: number;
    } = {};

    if (action) where.action = action as string;
    if (entityType) where.entityType = entityType as string;
    if (adminId) where.adminId = parseInt(adminId as string);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details ? JSON.parse(log.details) : null,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
        admin: log.admin
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

export default router;
