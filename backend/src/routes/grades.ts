import { Router } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Get grades for all students in a class
router.get('/class/:classId', async (req: AuthRequest, res) => {
  const { classId } = req.params;

  const classData = await prisma.class.findFirst({
    where: { id: parseInt(classId), teacherId: req.teacherId },
    include: { gradeWeights: true },
  });

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const weights = classData.gradeWeights || {
    attendanceWeight: 10,
    quizWeight: 30,
    examWeight: 40,
    activityWeight: 20,
  };

  const students = await prisma.student.findMany({
    where: { classId: parseInt(classId) },
    include: {
      attendances: true,
      quizScores: { include: { quiz: true } },
      examScores: { include: { exam: true } },
      activityScores: { include: { activity: true } },
    },
    orderBy: { name: 'asc' },
  });

  const grades = students.map((student) => {
    // Calculate attendance grade
    const totalAttendance = student.attendances.length;
    const presentCount = student.attendances.filter((a) => a.status === 'present').length;
    const lateCount = student.attendances.filter((a) => a.status === 'late').length;
    const attendanceGrade =
      totalAttendance > 0 ? ((presentCount + lateCount * 0.5) / totalAttendance) * 100 : 0;

    // Calculate quiz grade
    const quizScores = student.quizScores;
    let quizGrade = 0;
    if (quizScores.length > 0) {
      const totalQuizPercentage = quizScores.reduce((sum, qs) => {
        return sum + (qs.score / qs.quiz.maxScore) * 100;
      }, 0);
      quizGrade = totalQuizPercentage / quizScores.length;
    }

    // Calculate exam grade
    const examScores = student.examScores;
    let examGrade = 0;
    if (examScores.length > 0) {
      const totalExamPercentage = examScores.reduce((sum, es) => {
        return sum + (es.score / es.exam.maxScore) * 100;
      }, 0);
      examGrade = totalExamPercentage / examScores.length;
    }

    // Calculate activity grade
    const activityScores = student.activityScores;
    let activityGrade = 0;
    if (activityScores.length > 0) {
      const totalActivityPercentage = activityScores.reduce((sum, as) => {
        return sum + (as.score / as.activity.maxScore) * 100;
      }, 0);
      activityGrade = totalActivityPercentage / activityScores.length;
    }

    // Calculate weighted final grade
    const finalGrade =
      (attendanceGrade * weights.attendanceWeight +
        quizGrade * weights.quizWeight +
        examGrade * weights.examWeight +
        activityGrade * (weights.activityWeight || 0)) /
      100;

    return {
      studentId: student.id,
      studentName: student.name,
      studentNumber: student.studentId,
      attendanceGrade: Math.round(attendanceGrade * 100) / 100,
      quizGrade: Math.round(quizGrade * 100) / 100,
      examGrade: Math.round(examGrade * 100) / 100,
      activityGrade: Math.round(activityGrade * 100) / 100,
      finalGrade: Math.round(finalGrade * 100) / 100,
      letterGrade: getLetterGrade(finalGrade),
      details: {
        attendanceRecords: totalAttendance,
        quizzesCompleted: quizScores.length,
        examsCompleted: examScores.length,
        activitiesCompleted: activityScores.length,
      },
    };
  });

  res.json({
    className: classData.name,
    section: classData.section,
    weights,
    grades,
  });
});

// Get detailed grades for a single student
router.get('/student/:studentId', async (req: AuthRequest, res) => {
  const { studentId } = req.params;

  const student = await prisma.student.findUnique({
    where: { id: parseInt(studentId) },
    include: {
      class: {
        include: { gradeWeights: true },
        select: { id: true, name: true, section: true, teacherId: true, gradeWeights: true },
      },
      attendances: { orderBy: { date: 'desc' } },
      quizScores: { include: { quiz: true }, orderBy: { quiz: { date: 'desc' } } },
      examScores: { include: { exam: true }, orderBy: { exam: { date: 'desc' } } },
      activityScores: { include: { activity: true }, orderBy: { activity: { date: 'desc' } } },
    },
  });

  if (!student || student.class.teacherId !== req.teacherId) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const weights = student.class.gradeWeights || {
    attendanceWeight: 10,
    quizWeight: 30,
    examWeight: 40,
    activityWeight: 20,
  };

  // Calculate attendance grade
  const totalAttendance = student.attendances.length;
  const presentCount = student.attendances.filter((a) => a.status === 'present').length;
  const lateCount = student.attendances.filter((a) => a.status === 'late').length;
  const absentCount = student.attendances.filter((a) => a.status === 'absent').length;
  const excusedCount = student.attendances.filter((a) => a.status === 'excused').length;
  const attendanceGrade =
    totalAttendance > 0 ? ((presentCount + lateCount * 0.5) / totalAttendance) * 100 : 0;

  // Calculate quiz grade
  let quizGrade = 0;
  const quizDetails = student.quizScores.map((qs) => ({
    name: qs.quiz.name,
    score: qs.score,
    maxScore: qs.quiz.maxScore,
    percentage: (qs.score / qs.quiz.maxScore) * 100,
    date: qs.quiz.date,
  }));
  if (quizDetails.length > 0) {
    quizGrade = quizDetails.reduce((sum, q) => sum + q.percentage, 0) / quizDetails.length;
  }

  // Calculate exam grade
  let examGrade = 0;
  const examDetails = student.examScores.map((es) => ({
    name: es.exam.name,
    score: es.score,
    maxScore: es.exam.maxScore,
    percentage: (es.score / es.exam.maxScore) * 100,
    date: es.exam.date,
  }));
  if (examDetails.length > 0) {
    examGrade = examDetails.reduce((sum, e) => sum + e.percentage, 0) / examDetails.length;
  }

  // Calculate activity grade
  let activityGrade = 0;
  const activityDetails = student.activityScores.map((as) => ({
    name: as.activity.name,
    score: as.score,
    maxScore: as.activity.maxScore,
    percentage: (as.score / as.activity.maxScore) * 100,
    date: as.activity.date,
  }));
  if (activityDetails.length > 0) {
    activityGrade = activityDetails.reduce((sum, a) => sum + a.percentage, 0) / activityDetails.length;
  }

  // Calculate weighted final grade
  const finalGrade =
    (attendanceGrade * weights.attendanceWeight +
      quizGrade * weights.quizWeight +
      examGrade * weights.examWeight +
      activityGrade * (weights.activityWeight || 0)) /
    100;

  res.json({
    student: {
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      email: student.email,
    },
    class: {
      id: student.class.id,
      name: student.class.name,
      section: student.class.section,
    },
    weights,
    attendance: {
      grade: Math.round(attendanceGrade * 100) / 100,
      total: totalAttendance,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      excused: excusedCount,
    },
    quizzes: {
      grade: Math.round(quizGrade * 100) / 100,
      details: quizDetails,
    },
    exams: {
      grade: Math.round(examGrade * 100) / 100,
      details: examDetails,
    },
    activities: {
      grade: Math.round(activityGrade * 100) / 100,
      details: activityDetails,
    },
    finalGrade: Math.round(finalGrade * 100) / 100,
    letterGrade: getLetterGrade(finalGrade),
  });
});

// Get grade weights for a class
router.get('/class/:classId/weights', async (req: AuthRequest, res) => {
  const { classId } = req.params;

  const classData = await prisma.class.findFirst({
    where: { id: parseInt(classId), teacherId: req.teacherId },
    include: { gradeWeights: true },
  });

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const weights = classData.gradeWeights || {
    attendanceWeight: 10,
    quizWeight: 30,
    examWeight: 40,
    activityWeight: 20,
  };

  res.json({
    classId: classData.id,
    className: classData.name,
    section: classData.section,
    weights: {
      attendanceWeight: weights.attendanceWeight,
      quizWeight: weights.quizWeight,
      examWeight: weights.examWeight,
      activityWeight: weights.activityWeight,
    },
  });
});

// Update grade weights for a class
router.put('/class/:classId/weights', async (req: AuthRequest, res) => {
  const { classId } = req.params;
  const { attendanceWeight, quizWeight, examWeight, activityWeight } = req.body;

  // Validate weights
  if (
    typeof attendanceWeight !== 'number' ||
    typeof quizWeight !== 'number' ||
    typeof examWeight !== 'number' ||
    typeof activityWeight !== 'number'
  ) {
    return res.status(400).json({ error: 'All weights must be numbers' });
  }

  if (attendanceWeight < 0 || quizWeight < 0 || examWeight < 0 || activityWeight < 0) {
    return res.status(400).json({ error: 'Weights cannot be negative' });
  }

  const total = attendanceWeight + quizWeight + examWeight + activityWeight;
  if (Math.abs(total - 100) > 0.01) {
    return res.status(400).json({ error: 'Weights must sum to 100%' });
  }

  const classData = await prisma.class.findFirst({
    where: { id: parseInt(classId), teacherId: req.teacherId },
  });

  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const weights = await prisma.gradeWeight.upsert({
    where: { classId: parseInt(classId) },
    update: {
      attendanceWeight,
      quizWeight,
      examWeight,
      activityWeight,
    },
    create: {
      classId: parseInt(classId),
      attendanceWeight,
      quizWeight,
      examWeight,
      activityWeight,
    },
  });

  res.json({
    message: 'Grade weights updated successfully',
    weights: {
      attendanceWeight: weights.attendanceWeight,
      quizWeight: weights.quizWeight,
      examWeight: weights.examWeight,
      activityWeight: weights.activityWeight,
    },
  });
});

function getLetterGrade(score: number): string {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}

export default router;
