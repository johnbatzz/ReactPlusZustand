import { Router } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Get attendance for a class on a specific date
router.get('/class/:classId', async (req: AuthRequest, res) => {
  const { classId } = req.params;
  const { date } = req.query;

  const classData = await prisma.class.findFirst({
    where: { id: parseInt(classId), teacherId: req.teacherId },
  });

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const students = await prisma.student.findMany({
    where: { classId: parseInt(classId) },
    orderBy: { name: 'asc' },
  });

  let attendanceRecords: any[] = [];
  if (date) {
    const targetDate = new Date(date as string);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        date: { gte: targetDate, lt: nextDay },
      },
    });
  }

  const result = students.map((student) => ({
    ...student,
    attendance: attendanceRecords.find((a) => a.studentId === student.id) || null,
  }));

  res.json(result);
});

// Record attendance (bulk)
router.post('/class/:classId', async (req: AuthRequest, res) => {
  const { classId } = req.params;
  const { date, records } = req.body;

  const classData = await prisma.class.findFirst({
    where: { id: parseInt(classId), teacherId: req.teacherId },
  });

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  if (!date || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Date and records array are required' });
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const results = await Promise.all(
    records.map(async (record: { studentId: number; status: string }) => {
      return prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: record.studentId,
            date: targetDate,
          },
        },
        update: { status: record.status },
        create: {
          studentId: record.studentId,
          date: targetDate,
          status: record.status,
        },
      });
    })
  );

  res.json(results);
});

// Update a single attendance record
router.put('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const attendance = await prisma.attendance.findUnique({
    where: { id: parseInt(id) },
    include: { student: { include: { class: { select: { teacherId: true } } } } },
  });

  if (!attendance || attendance.student.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Attendance record not found' });
  }

  const updated = await prisma.attendance.update({
    where: { id: parseInt(id) },
    data: { status },
  });

  res.json(updated);
});

// Get attendance summary for a class
router.get('/class/:classId/summary', async (req: AuthRequest, res) => {
  const { classId } = req.params;

  const classData = await prisma.class.findFirst({
    where: { id: parseInt(classId), teacherId: req.teacherId },
  });

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const students = await prisma.student.findMany({
    where: { classId: parseInt(classId) },
    include: {
      attendances: true,
    },
    orderBy: { name: 'asc' },
  });

  const summary = students.map((student) => {
    const total = student.attendances.length;
    const present = student.attendances.filter((a) => a.status === 'present').length;
    const absent = student.attendances.filter((a) => a.status === 'absent').length;
    const late = student.attendances.filter((a) => a.status === 'late').length;
    const excused = student.attendances.filter((a) => a.status === 'excused').length;

    return {
      studentId: student.id,
      studentName: student.name,
      total,
      present,
      absent,
      late,
      excused,
      attendanceRate: total > 0 ? ((present + late * 0.5) / total) * 100 : 0,
    };
  });

  res.json(summary);
});

export default router;
