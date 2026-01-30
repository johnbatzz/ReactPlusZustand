import { Router } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Get all quizzes for a class
router.get('/class/:classId', async (req: AuthRequest, res) => {
  const { classId } = req.params;

  const classData = await prisma.class.findFirst({
    where: { id: parseInt(classId), teacherId: req.teacherId },
  });

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const quizzes = await prisma.quiz.findMany({
    where: { classId: parseInt(classId) },
    include: {
      _count: { select: { scores: true, questions: true } },
    },
    orderBy: { date: 'desc' },
  });

  res.json(quizzes);
});

// Create a new quiz
router.post('/class/:classId', async (req: AuthRequest, res) => {
  const { classId } = req.params;
  const { name, maxScore, date, dueDate } = req.body;

  const classData = await prisma.class.findFirst({
    where: { id: parseInt(classId), teacherId: req.teacherId },
  });

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const quiz = await prisma.quiz.create({
    data: {
      name,
      maxScore: maxScore ? parseFloat(maxScore) : 0,
      date: date ? new Date(date) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      classId: parseInt(classId),
    },
  });

  res.status(201).json(quiz);
});

// Get a single quiz with scores and questions
router.get('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: parseInt(id) },
    include: {
      class: { select: { id: true, name: true, teacherId: true } },
      scores: { include: { student: { select: { id: true, name: true, studentId: true } } } },
      questions: { orderBy: { order: 'asc' } },
    },
  });

  if (!quiz || quiz.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  // Get all students in the class to show who hasn't been scored
  const allStudents = await prisma.student.findMany({
    where: { classId: quiz.classId },
    select: { id: true, name: true, studentId: true },
    orderBy: { name: 'asc' },
  });

  const studentsWithScores = allStudents.map((student) => ({
    ...student,
    score: quiz.scores.find((s) => s.studentId === student.id)?.score ?? null,
  }));

  // Parse options JSON for questions
  const questions = quiz.questions.map(q => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : null
  }));

  res.json({ ...quiz, questions, studentsWithScores });
});

// Update a quiz
router.put('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, maxScore, date, dueDate, isPublished } = req.body;

  const quiz = await prisma.quiz.findUnique({
    where: { id: parseInt(id) },
    include: { class: { select: { teacherId: true } } },
  });

  if (!quiz || quiz.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const updated = await prisma.quiz.update({
    where: { id: parseInt(id) },
    data: {
      ...(name !== undefined && { name }),
      ...(maxScore !== undefined && { maxScore: parseFloat(maxScore) }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(isPublished !== undefined && { isPublished }),
    },
  });

  res.json(updated);
});

// Delete a quiz
router.delete('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: parseInt(id) },
    include: { class: { select: { teacherId: true } } },
  });

  if (!quiz || quiz.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  await prisma.quiz.delete({ where: { id: parseInt(id) } });
  res.status(204).send();
});

// Record quiz scores (bulk)
router.post('/:id/scores', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { scores } = req.body;

  const quiz = await prisma.quiz.findUnique({
    where: { id: parseInt(id) },
    include: { class: { select: { teacherId: true } } },
  });

  if (!quiz || quiz.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  if (!scores || !Array.isArray(scores)) {
    return res.status(400).json({ error: 'Scores array is required' });
  }

  const results = await Promise.all(
    scores.map(async (record: { studentId: number; score: number }) => {
      return prisma.quizScore.upsert({
        where: {
          quizId_studentId: {
            quizId: parseInt(id),
            studentId: record.studentId,
          },
        },
        update: { score: record.score },
        create: {
          quizId: parseInt(id),
          studentId: record.studentId,
          score: record.score,
        },
      });
    })
  );

  res.json(results);
});

// ==================== QUESTION MANAGEMENT ====================

// Add a question to a quiz
router.post('/:id/questions', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { type, text, points, options, correctAnswer } = req.body;

  const quiz = await prisma.quiz.findUnique({
    where: { id: parseInt(id) },
    include: {
      class: { select: { teacherId: true } },
      questions: { select: { order: true }, orderBy: { order: 'desc' }, take: 1 }
    },
  });

  if (!quiz || quiz.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  if (!type || !text) {
    return res.status(400).json({ error: 'Type and text are required' });
  }

  if (!['multiple_choice', 'true_false', 'short_answer'].includes(type)) {
    return res.status(400).json({ error: 'Invalid question type' });
  }

  const nextOrder = quiz.questions.length > 0 ? quiz.questions[0].order + 1 : 0;

  const question = await prisma.question.create({
    data: {
      quizId: parseInt(id),
      type,
      text,
      points: points ? parseFloat(points) : 1,
      order: nextOrder,
      options: options ? JSON.stringify(options) : null,
      correctAnswer: correctAnswer ?? null,
    },
  });

  // Update quiz maxScore based on total question points
  const totalPoints = await prisma.question.aggregate({
    where: { quizId: parseInt(id) },
    _sum: { points: true },
  });

  await prisma.quiz.update({
    where: { id: parseInt(id) },
    data: { maxScore: totalPoints._sum.points || 0 },
  });

  res.status(201).json({
    ...question,
    options: question.options ? JSON.parse(question.options) : null
  });
});

// Update a question
router.put('/:id/questions/:questionId', async (req: AuthRequest, res) => {
  const { id, questionId } = req.params;
  const { type, text, points, options, correctAnswer, order } = req.body;

  const quiz = await prisma.quiz.findUnique({
    where: { id: parseInt(id) },
    include: { class: { select: { teacherId: true } } },
  });

  if (!quiz || quiz.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const question = await prisma.question.findFirst({
    where: { id: parseInt(questionId), quizId: parseInt(id) },
  });

  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const updated = await prisma.question.update({
    where: { id: parseInt(questionId) },
    data: {
      ...(type !== undefined && { type }),
      ...(text !== undefined && { text }),
      ...(points !== undefined && { points: parseFloat(points) }),
      ...(options !== undefined && { options: options ? JSON.stringify(options) : null }),
      ...(correctAnswer !== undefined && { correctAnswer }),
      ...(order !== undefined && { order }),
    },
  });

  // Update quiz maxScore
  const totalPoints = await prisma.question.aggregate({
    where: { quizId: parseInt(id) },
    _sum: { points: true },
  });

  await prisma.quiz.update({
    where: { id: parseInt(id) },
    data: { maxScore: totalPoints._sum.points || 0 },
  });

  res.json({
    ...updated,
    options: updated.options ? JSON.parse(updated.options) : null
  });
});

// Delete a question
router.delete('/:id/questions/:questionId', async (req: AuthRequest, res) => {
  const { id, questionId } = req.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: parseInt(id) },
    include: { class: { select: { teacherId: true } } },
  });

  if (!quiz || quiz.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const question = await prisma.question.findFirst({
    where: { id: parseInt(questionId), quizId: parseInt(id) },
  });

  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  await prisma.question.delete({ where: { id: parseInt(questionId) } });

  // Update quiz maxScore
  const totalPoints = await prisma.question.aggregate({
    where: { quizId: parseInt(id) },
    _sum: { points: true },
  });

  await prisma.quiz.update({
    where: { id: parseInt(id) },
    data: { maxScore: totalPoints._sum.points || 0 },
  });

  res.status(204).send();
});

// Publish/unpublish a quiz
router.post('/:id/publish', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { publish } = req.body;

  const quiz = await prisma.quiz.findUnique({
    where: { id: parseInt(id) },
    include: {
      class: { select: { teacherId: true } },
      _count: { select: { questions: true } }
    },
  });

  if (!quiz || quiz.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  if (publish && quiz._count.questions === 0) {
    return res.status(400).json({ error: 'Cannot publish a quiz without questions' });
  }

  const updated = await prisma.quiz.update({
    where: { id: parseInt(id) },
    data: { isPublished: publish !== false },
  });

  res.json(updated);
});

// Get student attempts for a quiz
router.get('/:id/attempts', async (req: AuthRequest, res) => {
  const { id } = req.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: parseInt(id) },
    include: { class: { select: { teacherId: true } } },
  });

  if (!quiz || quiz.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId: parseInt(id) },
    include: {
      student: { select: { id: true, name: true, studentId: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });

  res.json(attempts);
});

// Get a specific student's attempt with answers
router.get('/:id/attempts/:studentId', async (req: AuthRequest, res) => {
  const { id, studentId } = req.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: parseInt(id) },
    include: {
      class: { select: { teacherId: true } },
      questions: { orderBy: { order: 'asc' } },
    },
  });

  if (!quiz || quiz.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const attempt = await prisma.quizAttempt.findUnique({
    where: {
      quizId_studentId: {
        quizId: parseInt(id),
        studentId: parseInt(studentId),
      },
    },
    include: {
      student: { select: { id: true, name: true, studentId: true } },
    },
  });

  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  const answers = await prisma.studentAnswer.findMany({
    where: {
      studentId: parseInt(studentId),
      questionId: { in: quiz.questions.map(q => q.id) },
    },
  });

  const questionsWithAnswers = quiz.questions.map(q => {
    const answer = answers.find(a => a.questionId === q.id);
    return {
      question: {
        ...q,
        options: q.options ? JSON.parse(q.options) : null,
      },
      studentAnswer: answer?.answer ?? null,
      isCorrect: answer?.isCorrect ?? null,
      pointsEarned: answer?.pointsEarned ?? null,
      feedback: answer?.feedback ?? null,
    };
  });

  res.json({
    attempt,
    questionsWithAnswers,
  });
});

// Grade short answer questions
router.post('/:id/grade', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { studentId, grades } = req.body as {
    studentId: number;
    grades: { questionId: number; pointsEarned: number; feedback?: string }[];
  };

  const quiz = await prisma.quiz.findUnique({
    where: { id: parseInt(id) },
    include: { class: { select: { teacherId: true } } },
  });

  if (!quiz || quiz.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  if (!studentId || !grades || !Array.isArray(grades)) {
    return res.status(400).json({ error: 'Student ID and grades array are required' });
  }

  // Update each answer with grade
  for (const grade of grades) {
    await prisma.studentAnswer.update({
      where: {
        questionId_studentId: {
          questionId: grade.questionId,
          studentId,
        },
      },
      data: {
        pointsEarned: grade.pointsEarned,
        feedback: grade.feedback ?? null,
        isCorrect: grade.pointsEarned > 0,
        gradedAt: new Date(),
      },
    });
  }

  // Recalculate total score
  const allAnswers = await prisma.studentAnswer.findMany({
    where: {
      studentId,
      question: { quizId: parseInt(id) },
    },
  });

  const totalScore = allAnswers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);

  // Get current attempt to calculate manual score
  const currentAttempt = await prisma.quizAttempt.findUnique({
    where: { quizId_studentId: { quizId: parseInt(id), studentId } },
    select: { autoScore: true }
  });

  // Update attempt with final score
  await prisma.quizAttempt.update({
    where: {
      quizId_studentId: {
        quizId: parseInt(id),
        studentId,
      },
    },
    data: {
      manualScore: totalScore - (currentAttempt?.autoScore ?? 0),
      finalScore: totalScore,
    },
  });

  // Sync to QuizScore
  await prisma.quizScore.upsert({
    where: {
      quizId_studentId: {
        quizId: parseInt(id),
        studentId,
      },
    },
    create: {
      quizId: parseInt(id),
      studentId,
      score: totalScore,
    },
    update: {
      score: totalScore,
    },
  });

  res.json({ message: 'Grading saved', finalScore: totalScore });
});

export default router;
