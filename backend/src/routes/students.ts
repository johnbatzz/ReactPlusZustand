import { Router } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { studentSchema } from '../lib/validations';

const router = Router();

router.use(authenticateToken);

// Get all students in a class
router.get('/class/:classId', async (req: AuthRequest, res) => {
  const { classId } = req.params;

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

  res.json(students);
});

// Create a new student
router.post('/class/:classId', validate(studentSchema), async (req: AuthRequest, res) => {
  const { classId } = req.params;
  const { studentId, name, email, phone, parentName, parentPhone, parentEmail } = req.body;

  const classData = await prisma.class.findFirst({
    where: { id: parseInt(classId), teacherId: req.teacherId },
  });

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const student = await prisma.student.create({
    data: {
      studentId,
      name,
      email: email || null,
      phone: phone || null,
      parentName: parentName || null,
      parentPhone: parentPhone || null,
      parentEmail: parentEmail || null,
      classId: parseInt(classId),
    },
  });

  res.status(201).json(student);
});

// Get a single student
router.get('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;

  const student = await prisma.student.findUnique({
    where: { id: parseInt(id) },
    include: {
      class: { select: { id: true, name: true, teacherId: true } },
      attendances: { orderBy: { date: 'desc' }, take: 10 },
      quizScores: { include: { quiz: true }, orderBy: { quiz: { date: 'desc' } } },
      examScores: { include: { exam: true }, orderBy: { exam: { date: 'desc' } } },
    },
  });

  if (!student || student.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Student not found' });
  }

  res.json(student);
});

// Update a student
router.put('/:id', validate(studentSchema), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { studentId, name, email, phone, parentName, parentPhone, parentEmail } = req.body;

  const student = await prisma.student.findUnique({
    where: { id: parseInt(id) },
    include: { class: { select: { teacherId: true } } },
  });

  if (!student || student.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const updatedStudent = await prisma.student.update({
    where: { id: parseInt(id) },
    data: {
      studentId,
      name,
      email: email || null,
      phone: phone || null,
      parentName: parentName || null,
      parentPhone: parentPhone || null,
      parentEmail: parentEmail || null,
    },
  });

  res.json(updatedStudent);
});

// Delete a student
router.delete('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;

  const student = await prisma.student.findUnique({
    where: { id: parseInt(id) },
    include: { class: { select: { teacherId: true } } },
  });

  if (!student || student.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Student not found' });
  }

  await prisma.student.delete({ where: { id: parseInt(id) } });
  res.status(204).send();
});

export default router;
