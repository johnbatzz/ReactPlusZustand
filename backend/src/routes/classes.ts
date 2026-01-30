import { Router } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Get all classes for the authenticated teacher
router.get('/', async (req: AuthRequest, res) => {
  const classes = await prisma.class.findMany({
    where: { teacherId: req.teacherId },
    include: {
      _count: { select: { students: true } },
      gradeWeights: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(classes);
});

// Create a new class
router.post('/', async (req: AuthRequest, res) => {
  const { name, section } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Class name is required' });
  }

  const newClass = await prisma.class.create({
    data: {
      name,
      section,
      teacherId: req.teacherId!,
      gradeWeights: {
        create: {
          attendanceWeight: 10,
          quizWeight: 30,
          examWeight: 60,
        },
      },
    },
    include: { gradeWeights: true },
  });

  res.status(201).json(newClass);
});

// Get a single class
router.get('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;

  const classData = await prisma.class.findFirst({
    where: { id: parseInt(id), teacherId: req.teacherId },
    include: {
      students: true,
      gradeWeights: true,
      _count: { select: { students: true, quizzes: true, exams: true } },
    },
  });

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  res.json(classData);
});

// Update a class
router.put('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, section } = req.body;

  const existingClass = await prisma.class.findFirst({
    where: { id: parseInt(id), teacherId: req.teacherId },
  });

  if (!existingClass) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const updatedClass = await prisma.class.update({
    where: { id: parseInt(id) },
    data: { name, section },
    include: { gradeWeights: true },
  });

  res.json(updatedClass);
});

// Delete a class
router.delete('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;

  const existingClass = await prisma.class.findFirst({
    where: { id: parseInt(id), teacherId: req.teacherId },
  });

  if (!existingClass) {
    return res.status(404).json({ error: 'Class not found' });
  }

  await prisma.class.delete({ where: { id: parseInt(id) } });
  res.status(204).send();
});

// Update grade weights
router.put('/:id/weights', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { attendanceWeight, quizWeight, examWeight } = req.body;

  const existingClass = await prisma.class.findFirst({
    where: { id: parseInt(id), teacherId: req.teacherId },
  });

  if (!existingClass) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const weights = await prisma.gradeWeight.upsert({
    where: { classId: parseInt(id) },
    update: { attendanceWeight, quizWeight, examWeight },
    create: {
      classId: parseInt(id),
      attendanceWeight: attendanceWeight ?? 10,
      quizWeight: quizWeight ?? 30,
      examWeight: examWeight ?? 60,
    },
  });

  res.json(weights);
});

export default router;
