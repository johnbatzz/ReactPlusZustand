import { Router } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Get all activities for a class
router.get('/class/:classId', async (req: AuthRequest, res) => {
  const { classId } = req.params;

  const classData = await prisma.class.findFirst({
    where: { id: parseInt(classId), teacherId: req.teacherId },
  });

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const activities = await prisma.activity.findMany({
    where: { classId: parseInt(classId) },
    include: {
      _count: { select: { scores: true } },
    },
    orderBy: { date: 'desc' },
  });

  res.json(activities);
});

// Get a single activity with all scores
router.get('/:activityId', async (req: AuthRequest, res) => {
  const { activityId } = req.params;

  const activity = await prisma.activity.findUnique({
    where: { id: parseInt(activityId) },
    include: {
      class: {
        select: { id: true, name: true, section: true, teacherId: true },
      },
      scores: {
        include: {
          student: {
            select: { id: true, studentId: true, name: true },
          },
        },
      },
    },
  });

  if (!activity || activity.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  // Get all students in the class
  const students = await prisma.student.findMany({
    where: { classId: activity.classId },
    select: { id: true, studentId: true, name: true },
    orderBy: { name: 'asc' },
  });

  // Map scores to students
  const scoresMap = new Map(activity.scores.map(s => [s.studentId, s.score]));
  const studentsWithScores = students.map(student => ({
    ...student,
    score: scoresMap.get(student.id) ?? null,
  }));

  res.json({
    id: activity.id,
    name: activity.name,
    maxScore: activity.maxScore,
    date: activity.date,
    class: activity.class,
    students: studentsWithScores,
  });
});

// Create a new activity
router.post('/', async (req: AuthRequest, res) => {
  const { classId, name, maxScore, date } = req.body;

  if (!classId || !name || maxScore === undefined) {
    return res.status(400).json({ error: 'Class ID, name, and max score are required' });
  }

  const classData = await prisma.class.findFirst({
    where: { id: parseInt(classId), teacherId: req.teacherId },
  });

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const activity = await prisma.activity.create({
    data: {
      classId: parseInt(classId),
      name,
      maxScore: parseFloat(maxScore),
      date: date ? new Date(date) : new Date(),
    },
  });

  res.status(201).json(activity);
});

// Update an activity
router.put('/:activityId', async (req: AuthRequest, res) => {
  const { activityId } = req.params;
  const { name, maxScore, date } = req.body;

  const activity = await prisma.activity.findUnique({
    where: { id: parseInt(activityId) },
    include: { class: { select: { teacherId: true } } },
  });

  if (!activity || activity.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  const updated = await prisma.activity.update({
    where: { id: parseInt(activityId) },
    data: {
      ...(name && { name }),
      ...(maxScore !== undefined && { maxScore: parseFloat(maxScore) }),
      ...(date && { date: new Date(date) }),
    },
  });

  res.json(updated);
});

// Delete an activity
router.delete('/:activityId', async (req: AuthRequest, res) => {
  const { activityId } = req.params;

  const activity = await prisma.activity.findUnique({
    where: { id: parseInt(activityId) },
    include: { class: { select: { teacherId: true } } },
  });

  if (!activity || activity.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  await prisma.activity.delete({
    where: { id: parseInt(activityId) },
  });

  res.json({ message: 'Activity deleted' });
});

// Save scores for an activity
router.post('/:activityId/scores', async (req: AuthRequest, res) => {
  const { activityId } = req.params;
  const { scores } = req.body; // Array of { studentId, score }

  if (!Array.isArray(scores)) {
    return res.status(400).json({ error: 'Scores must be an array' });
  }

  const activity = await prisma.activity.findUnique({
    where: { id: parseInt(activityId) },
    include: { class: { select: { teacherId: true } } },
  });

  if (!activity || activity.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  // Upsert each score
  const operations = scores.map(({ studentId, score }) => {
    if (score === null || score === undefined || score === '') {
      // Delete score if null/empty
      return prisma.activityScore.deleteMany({
        where: {
          activityId: parseInt(activityId),
          studentId: parseInt(studentId),
        },
      });
    }
    return prisma.activityScore.upsert({
      where: {
        activityId_studentId: {
          activityId: parseInt(activityId),
          studentId: parseInt(studentId),
        },
      },
      update: { score: parseFloat(score) },
      create: {
        activityId: parseInt(activityId),
        studentId: parseInt(studentId),
        score: parseFloat(score),
      },
    });
  });

  await prisma.$transaction(operations);

  res.json({ message: 'Scores saved successfully' });
});

export default router;
