import { z } from 'zod';

// ===== Category Schema =====
export const categorySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  icon: z.string().optional(),
  gradient: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type Category = z.infer<typeof categorySchema>;

// ===== Course Schema =====
export const courseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().min(10),
  teacher: z.string().uuid(),
  teacher_name: z.string().optional(),
  category: categorySchema,
  category_id: z.string().uuid().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().min(0),
  duration: z.string().optional(),
  lessons_count: z.number().int().min(0).default(0),
  students_count: z.number().int().min(0).default(0),
  rating: z.number().min(0).max(5).default(0),
  badge: z.string().optional(),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(false),
  thumbnail: z.string().url().optional().nullable(),
  video_url: z.string().url().optional().nullable(),
  attachment_url: z.string().url().optional().nullable(),
  is_enrolled: z.boolean().default(false),
  progress: z.number().min(0).max(100).default(0),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// ===== Chapter Schema =====
export const chapterSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  order: z.number().int().min(0),
  lessons: z.array(lessonSchema),
});

// ===== Lesson Schema =====
export const lessonSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  video_url: z.string().url().optional().nullable(),
  duration: z.string().optional(),
  order: z.number().int().min(0),
  is_free: z.boolean().default(false),
  is_completed: z.boolean().default(false),
});

// ===== Enrollment Schema =====
export const enrollmentSchema = z.object({
  id: z.string().uuid(),
  user: z.string().uuid(),
  course: courseSchema,
  course_id: z.string().uuid(),
  status: z.enum(['active', 'completed', 'dropped']),
  progress: z.number().min(0).max(100).default(0),
  price_paid: z.number().min(0).default(0),
  enrolled_at: z.string().datetime(),
  completed_at: z.string().datetime().optional().nullable(),
});

// ===== Course Filters =====
export const coursesQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ===== Progress Update =====
export const progressUpdateSchema = z.object({
  progress: z.number().min(0).max(100),
});

// ===== Types =====
export type Course = z.infer<typeof courseSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Enrollment = z.infer<typeof enrollmentSchema>;
export type CoursesQuery = z.infer<typeof coursesQuerySchema>;
export type ProgressUpdate = z.infer<typeof progressUpdateSchema>;

// ===== Paginated Response =====
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  total_pages?: number;
  current_page?: number;
}
