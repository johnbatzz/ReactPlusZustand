import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { authenticateToken, generateToken, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../lib/validations';

const router = Router();

router.post('/register', validate(registerSchema), async (req, res) => {
  const { email, password, name } = req.body;

  const existingTeacher = await prisma.teacher.findUnique({ where: { email } });
  if (existingTeacher) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const teacher = await prisma.teacher.create({
    data: { email, password: hashedPassword, name },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = generateToken(teacher.id);
  res.status(201).json({ teacher, token });
});

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const teacher = await prisma.teacher.findUnique({ where: { email } });
  if (!teacher) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, teacher.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!teacher.isActive) {
    return res.status(403).json({ error: 'Account is disabled. Contact administrator.' });
  }

  const token = generateToken(teacher.id);
  res.json({
    teacher: { id: teacher.id, email: teacher.email, name: teacher.name, createdAt: teacher.createdAt },
    token,
  });
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id: req.teacherId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found' });
  }

  res.json(teacher);
});

export default router;
