import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateStudent, StudentAuthRequest } from '../middleware/studentAuth';

const router = Router();
const prisma = new PrismaClient();

// All routes require student authentication
router.use(authenticateStudent);

// Get all published quizzes for student's class
router.get('/quizzes', async (req: StudentAuthRequest, res: Response) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: {
        classId: req.classId,
        isPublished: true
      },
      include: {
        _count: { select: { questions: true } },
        attempts: {
          where: { studentId: req.studentId },
          select: { submittedAt: true, finalScore: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    const quizzesWithStatus = quizzes.map(quiz => ({
      id: quiz.id,
      name: quiz.name,
      date: quiz.date,
      dueDate: quiz.dueDate,
      maxScore: quiz.maxScore,
      questionCount: quiz._count.questions,
      status: quiz.attempts.length > 0
        ? (quiz.attempts[0].submittedAt ? 'completed' : 'in_progress')
        : 'not_started',
      score: quiz.attempts[0]?.finalScore ?? null
    }));

    res.json(quizzesWithStatus);
  } catch (error) {
    console.error('Fetch quizzes error:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get quiz details with questions (hide correct answers)
router.get('/quizzes/:id', async (req: StudentAuthRequest, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        classId: req.classId,
        isPublished: true
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            text: true,
            points: true,
            order: true,
            options: true
            // Note: correctAnswer is NOT included
          }
        },
        attempts: {
          where: { studentId: req.studentId }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const attempt = quiz.attempts[0];

    // Parse options JSON for questions
    const questions = quiz.questions.map(q => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : null
    }));

    res.json({
      id: quiz.id,
      name: quiz.name,
      date: quiz.date,
      dueDate: quiz.dueDate,
      maxScore: quiz.maxScore,
      questions,
      attempt: attempt ? {
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        finalScore: attempt.finalScore
      } : null
    });
  } catch (error) {
    console.error('Fetch quiz error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Start a quiz attempt
router.post('/quizzes/:id/start', async (req: StudentAuthRequest, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);

    // Verify quiz exists and is published
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        classId: req.classId,
        isPublished: true
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if attempt already exists
    const existingAttempt = await prisma.quizAttempt.findUnique({
      where: {
        quizId_studentId: {
          quizId,
          studentId: req.studentId!
        }
      }
    });

    if (existingAttempt) {
      return res.json({
        message: 'Attempt already started',
        attempt: existingAttempt
      });
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: req.studentId!
      }
    });

    res.json({ message: 'Quiz started', attempt });
  } catch (error) {
    console.error('Start quiz error:', error);
    res.status(500).json({ error: 'Failed to start quiz' });
  }
});

// Submit quiz answers
router.post('/quizzes/:id/submit', async (req: StudentAuthRequest, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);
    const { answers } = req.body as { answers: { questionId: number; answer: string }[] };

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    // Verify quiz and attempt
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        classId: req.classId,
        isPublished: true
      },
      include: {
        questions: true
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: {
        quizId_studentId: {
          quizId,
          studentId: req.studentId!
        }
      }
    });

    if (!attempt) {
      return res.status(400).json({ error: 'Quiz not started' });
    }

    if (attempt.submittedAt) {
      return res.status(400).json({ error: 'Quiz already submitted' });
    }

    // Process and save answers
    let autoScore = 0;
    let hasShortAnswer = false;

    for (const ans of answers) {
      const question = quiz.questions.find(q => q.id === ans.questionId);
      if (!question) continue;

      let isCorrect: boolean | null = null;
      let pointsEarned: number | null = null;

      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        isCorrect = ans.answer === question.correctAnswer;
        pointsEarned = isCorrect ? question.points : 0;
        autoScore += pointsEarned;
      } else if (question.type === 'short_answer') {
        hasShortAnswer = true;
        // Short answer needs manual grading
      }

      await prisma.studentAnswer.upsert({
        where: {
          questionId_studentId: {
            questionId: ans.questionId,
            studentId: req.studentId!
          }
        },
        create: {
          questionId: ans.questionId,
          studentId: req.studentId!,
          answer: ans.answer,
          isCorrect,
          pointsEarned
        },
        update: {
          answer: ans.answer,
          isCorrect,
          pointsEarned
        }
      });
    }

    // Calculate final score
    const finalScore = hasShortAnswer ? null : autoScore;

    // Update attempt
    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        submittedAt: new Date(),
        autoScore,
        finalScore
      }
    });

    // If fully graded (no short answers), sync to QuizScore
    if (finalScore !== null) {
      await prisma.quizScore.upsert({
        where: {
          quizId_studentId: {
            quizId,
            studentId: req.studentId!
          }
        },
        create: {
          quizId,
          studentId: req.studentId!,
          score: finalScore
        },
        update: {
          score: finalScore
        }
      });
    }

    res.json({
      message: 'Quiz submitted successfully',
      autoScore,
      finalScore,
      needsManualGrading: hasShortAnswer
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get quiz results
router.get('/quizzes/:id/results', async (req: StudentAuthRequest, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);

    const attempt = await prisma.quizAttempt.findUnique({
      where: {
        quizId_studentId: {
          quizId,
          studentId: req.studentId!
        }
      },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({ error: 'No attempt found' });
    }

    if (!attempt.submittedAt) {
      return res.status(400).json({ error: 'Quiz not submitted yet' });
    }

    const studentAnswers = await prisma.studentAnswer.findMany({
      where: {
        studentId: req.studentId!,
        questionId: { in: attempt.quiz.questions.map(q => q.id) }
      }
    });

    const results = attempt.quiz.questions.map(q => {
      const studentAnswer = studentAnswers.find(a => a.questionId === q.id);
      return {
        question: {
          id: q.id,
          type: q.type,
          text: q.text,
          points: q.points,
          options: q.options ? JSON.parse(q.options) : null,
          correctAnswer: q.correctAnswer
        },
        studentAnswer: studentAnswer?.answer ?? null,
        isCorrect: studentAnswer?.isCorrect ?? null,
        pointsEarned: studentAnswer?.pointsEarned ?? null,
        feedback: studentAnswer?.feedback ?? null
      };
    });

    res.json({
      quizName: attempt.quiz.name,
      submittedAt: attempt.submittedAt,
      autoScore: attempt.autoScore,
      finalScore: attempt.finalScore,
      maxScore: attempt.quiz.maxScore,
      results
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

// ==================== EXAMS ====================

// Get all published exams for student's class
router.get('/exams', async (req: StudentAuthRequest, res: Response) => {
  try {
    const exams = await prisma.exam.findMany({
      where: {
        classId: req.classId,
        isPublished: true
      },
      include: {
        _count: { select: { questions: true } },
        attempts: {
          where: { studentId: req.studentId },
          select: { submittedAt: true, finalScore: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    const examsWithStatus = exams.map(exam => ({
      id: exam.id,
      name: exam.name,
      date: exam.date,
      dueDate: exam.dueDate,
      maxScore: exam.maxScore,
      questionCount: exam._count.questions,
      status: exam.attempts.length > 0
        ? (exam.attempts[0].submittedAt ? 'completed' : 'in_progress')
        : 'not_started',
      score: exam.attempts[0]?.finalScore ?? null
    }));

    res.json(examsWithStatus);
  } catch (error) {
    console.error('Fetch exams error:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// Get exam details with questions
router.get('/exams/:id', async (req: StudentAuthRequest, res: Response) => {
  try {
    const examId = parseInt(req.params.id);

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        classId: req.classId,
        isPublished: true
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            text: true,
            points: true,
            order: true,
            options: true
          }
        },
        attempts: {
          where: { studentId: req.studentId }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const attempt = exam.attempts[0];
    const questions = exam.questions.map(q => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : null
    }));

    res.json({
      id: exam.id,
      name: exam.name,
      date: exam.date,
      dueDate: exam.dueDate,
      maxScore: exam.maxScore,
      questions,
      attempt: attempt ? {
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        finalScore: attempt.finalScore
      } : null
    });
  } catch (error) {
    console.error('Fetch exam error:', error);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

// Start an exam attempt
router.post('/exams/:id/start', async (req: StudentAuthRequest, res: Response) => {
  try {
    const examId = parseInt(req.params.id);

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        classId: req.classId,
        isPublished: true
      }
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const existingAttempt = await prisma.examAttempt.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: req.studentId!
        }
      }
    });

    if (existingAttempt) {
      return res.json({
        message: 'Attempt already started',
        attempt: existingAttempt
      });
    }

    const attempt = await prisma.examAttempt.create({
      data: {
        examId,
        studentId: req.studentId!
      }
    });

    res.json({ message: 'Exam started', attempt });
  } catch (error) {
    console.error('Start exam error:', error);
    res.status(500).json({ error: 'Failed to start exam' });
  }
});

// Submit exam answers
router.post('/exams/:id/submit', async (req: StudentAuthRequest, res: Response) => {
  try {
    const examId = parseInt(req.params.id);
    const { answers } = req.body as { answers: { questionId: number; answer: string }[] };

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        classId: req.classId,
        isPublished: true
      },
      include: {
        questions: true
      }
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const attempt = await prisma.examAttempt.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: req.studentId!
        }
      }
    });

    if (!attempt) {
      return res.status(400).json({ error: 'Exam not started' });
    }

    if (attempt.submittedAt) {
      return res.status(400).json({ error: 'Exam already submitted' });
    }

    let autoScore = 0;
    let hasShortAnswer = false;

    for (const ans of answers) {
      const question = exam.questions.find(q => q.id === ans.questionId);
      if (!question) continue;

      let isCorrect: boolean | null = null;
      let pointsEarned: number | null = null;

      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        isCorrect = ans.answer === question.correctAnswer;
        pointsEarned = isCorrect ? question.points : 0;
        autoScore += pointsEarned;
      } else if (question.type === 'short_answer') {
        hasShortAnswer = true;
      }

      await prisma.studentAnswer.upsert({
        where: {
          questionId_studentId: {
            questionId: ans.questionId,
            studentId: req.studentId!
          }
        },
        create: {
          questionId: ans.questionId,
          studentId: req.studentId!,
          answer: ans.answer,
          isCorrect,
          pointsEarned
        },
        update: {
          answer: ans.answer,
          isCorrect,
          pointsEarned
        }
      });
    }

    const finalScore = hasShortAnswer ? null : autoScore;

    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        submittedAt: new Date(),
        autoScore,
        finalScore
      }
    });

    if (finalScore !== null) {
      await prisma.examScore.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: req.studentId!
          }
        },
        create: {
          examId,
          studentId: req.studentId!,
          score: finalScore
        },
        update: {
          score: finalScore
        }
      });
    }

    res.json({
      message: 'Exam submitted successfully',
      autoScore,
      finalScore,
      needsManualGrading: hasShortAnswer
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ error: 'Failed to submit exam' });
  }
});

// Get exam results
router.get('/exams/:id/results', async (req: StudentAuthRequest, res: Response) => {
  try {
    const examId = parseInt(req.params.id);

    const attempt = await prisma.examAttempt.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: req.studentId!
        }
      },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({ error: 'No attempt found' });
    }

    if (!attempt.submittedAt) {
      return res.status(400).json({ error: 'Exam not submitted yet' });
    }

    const studentAnswers = await prisma.studentAnswer.findMany({
      where: {
        studentId: req.studentId!,
        questionId: { in: attempt.exam.questions.map(q => q.id) }
      }
    });

    const results = attempt.exam.questions.map(q => {
      const studentAnswer = studentAnswers.find(a => a.questionId === q.id);
      return {
        question: {
          id: q.id,
          type: q.type,
          text: q.text,
          points: q.points,
          options: q.options ? JSON.parse(q.options) : null,
          correctAnswer: q.correctAnswer
        },
        studentAnswer: studentAnswer?.answer ?? null,
        isCorrect: studentAnswer?.isCorrect ?? null,
        pointsEarned: studentAnswer?.pointsEarned ?? null,
        feedback: studentAnswer?.feedback ?? null
      };
    });

    res.json({
      examName: attempt.exam.name,
      submittedAt: attempt.submittedAt,
      autoScore: attempt.autoScore,
      finalScore: attempt.finalScore,
      maxScore: attempt.exam.maxScore,
      results
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

// Get student's grades summary
router.get('/grades', async (req: StudentAuthRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.studentId },
      include: {
        class: {
          include: {
            gradeWeights: true
          }
        },
        quizScores: {
          include: {
            quiz: { select: { name: true, maxScore: true } }
          }
        },
        examScores: {
          include: {
            exam: { select: { name: true, maxScore: true } }
          }
        },
        attendances: true
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const weights = student.class.gradeWeights || {
      attendanceWeight: 10,
      quizWeight: 30,
      examWeight: 60
    };

    // Calculate attendance grade
    const totalAttendance = student.attendances.length;
    const presentCount = student.attendances.filter(a =>
      a.status === 'present' || a.status === 'late'
    ).length;
    const attendanceGrade = totalAttendance > 0
      ? (presentCount / totalAttendance) * 100
      : 0;

    // Calculate quiz grade
    const quizGrades = student.quizScores.map(qs => ({
      name: qs.quiz.name,
      score: qs.score,
      maxScore: qs.quiz.maxScore,
      percentage: (qs.score / qs.quiz.maxScore) * 100
    }));
    const quizAverage = quizGrades.length > 0
      ? quizGrades.reduce((sum, q) => sum + q.percentage, 0) / quizGrades.length
      : 0;

    // Calculate exam grade
    const examGrades = student.examScores.map(es => ({
      name: es.exam.name,
      score: es.score,
      maxScore: es.exam.maxScore,
      percentage: (es.score / es.exam.maxScore) * 100
    }));
    const examAverage = examGrades.length > 0
      ? examGrades.reduce((sum, e) => sum + e.percentage, 0) / examGrades.length
      : 0;

    // Calculate final grade
    const finalGrade =
      (attendanceGrade * weights.attendanceWeight / 100) +
      (quizAverage * weights.quizWeight / 100) +
      (examAverage * weights.examWeight / 100);

    // Convert to letter grade
    const letterGrade =
      finalGrade >= 97 ? 'A+' :
      finalGrade >= 93 ? 'A' :
      finalGrade >= 90 ? 'A-' :
      finalGrade >= 87 ? 'B+' :
      finalGrade >= 83 ? 'B' :
      finalGrade >= 80 ? 'B-' :
      finalGrade >= 77 ? 'C+' :
      finalGrade >= 73 ? 'C' :
      finalGrade >= 70 ? 'C-' :
      finalGrade >= 67 ? 'D+' :
      finalGrade >= 63 ? 'D' :
      finalGrade >= 60 ? 'D-' : 'F';

    res.json({
      className: student.class.name,
      section: student.class.section,
      weights,
      attendance: {
        grade: attendanceGrade,
        total: totalAttendance,
        present: presentCount
      },
      quizzes: {
        grade: quizAverage,
        details: quizGrades
      },
      exams: {
        grade: examAverage,
        details: examGrades
      },
      finalGrade,
      letterGrade
    });
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ error: 'Failed to get grades' });
  }
});

export default router;
