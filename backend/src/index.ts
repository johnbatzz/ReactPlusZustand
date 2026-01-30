import express from 'express';
import cors from 'cors';
import path from 'path';
import authRouter from './routes/auth';
import classesRouter from './routes/classes';
import studentsRouter from './routes/students';
import attendanceRouter from './routes/attendance';
import quizzesRouter from './routes/quizzes';
import examsRouter from './routes/exams';
import gradesRouter from './routes/grades';
import activitiesRouter from './routes/activities';
import studentAuthRouter from './routes/studentAuth';
import studentApiRouter from './routes/studentApi';
import adminAuthRouter from './routes/adminAuth';
import adminTeachersRouter from './routes/admin/teachers';
import adminStudentsRouter from './routes/admin/students';
import adminClassesRouter from './routes/admin/classes';
import adminDashboardRouter from './routes/admin/dashboard';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Teacher Routes
app.use('/api/auth', authRouter);
app.use('/api/classes', classesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/exams', examsRouter);
app.use('/api/grades', gradesRouter);
app.use('/api/activities', activitiesRouter);

// Student Routes
app.use('/api/student-auth', studentAuthRouter);
app.use('/api/student', studentApiRouter);

// Admin Routes
app.use('/api/admin-auth', adminAuthRouter);
app.use('/api/admin/teachers', adminTeachersRouter);
app.use('/api/admin/students', adminStudentsRouter);
app.use('/api/admin/classes', adminClassesRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
