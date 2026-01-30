import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Class schemas
export const classSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100, 'Class name too long'),
  section: z.string().max(50, 'Section name too long').optional(),
});

export const gradeWeightsSchema = z.object({
  attendanceWeight: z.number().min(0).max(100),
  quizWeight: z.number().min(0).max(100),
  examWeight: z.number().min(0).max(100),
}).refine(
  (data) => data.attendanceWeight + data.quizWeight + data.examWeight === 100,
  { message: 'Weights must add up to 100%' }
);

// Student schemas
export const studentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required').max(50, 'Student ID too long'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone number too long').optional().or(z.literal('')),
  parentName: z.string().max(100, 'Parent name too long').optional().or(z.literal('')),
  parentPhone: z.string().max(20, 'Parent phone too long').optional().or(z.literal('')),
  parentEmail: z.string().email('Invalid parent email').optional().or(z.literal('')),
});

// Quiz/Exam schemas
export const assessmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  maxScore: z.number().min(1, 'Max score must be at least 1').max(1000, 'Max score too high'),
  date: z.string().optional(),
});

export const scoreSchema = z.object({
  studentId: z.number().int().positive(),
  score: z.number().min(0, 'Score cannot be negative'),
});

export const scoresArraySchema = z.array(scoreSchema);

// Attendance schemas
export const attendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused']);

export const attendanceRecordSchema = z.object({
  studentId: z.number().int().positive(),
  status: attendanceStatusSchema,
});

export const attendanceSubmitSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  records: z.array(attendanceRecordSchema),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ClassInput = z.infer<typeof classSchema>;
export type GradeWeightsInput = z.infer<typeof gradeWeightsSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type AssessmentInput = z.infer<typeof assessmentSchema>;
export type ScoreInput = z.infer<typeof scoreSchema>;
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
export type AttendanceRecordInput = z.infer<typeof attendanceRecordSchema>;
export type AttendanceSubmitInput = z.infer<typeof attendanceSubmitSchema>;

// Validation helper
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });

  return { success: false, errors };
}
