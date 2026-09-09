'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { API_ENDPOINTS } from '@/lib/api';
import type {
  CoursesQuery,
  Course,
  Category,
  Lesson,
  PaginatedResponse,
} from '@/lib/validation/courses';

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params: CoursesQuery) => [...courseKeys.lists(), params] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
  lessons: (id: string) => [...courseKeys.details(), id, 'lessons'] as const,
};

// ===== Get all categories =====
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.COURSES.CATEGORIES);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    },
    staleTime: 60 * 1000,
  });
}

// ===== Get all courses =====
export function useCourses(params: CoursesQuery = { page: 1, limit: 20 }) {
  return useQuery<PaginatedResponse<Course>>({
    queryKey: courseKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.append('page', String(params.page || 1));
      searchParams.append('limit', String(params.limit || 20));
      if (params.category) searchParams.append('category', params.category);
      if (params.search) searchParams.append('search', params.search);
      if (params.level) searchParams.append('level', params.level);
      if (params.sort) searchParams.append('sort', params.sort);

      const response = await api.get(`${API_ENDPOINTS.COURSES.LIST}?${searchParams.toString()}`);
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

// ===== Get single course - با کش غیرفعال =====
export function useCourse(id: string) {
  return useQuery<Course>({
    queryKey: courseKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.COURSES.DETAIL(id));
      return response.data;
    },
    staleTime: 0, // ✅ همیشه داده جدید بگیر
    gcTime: 0, // ✅ کش رو کامل حذف کن
    enabled: !!id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

// ===== Get course lessons =====
export function useCourseLessons(courseId: string) {
  return useQuery<Lesson[]>({
    queryKey: courseKeys.lessons(courseId),
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.COURSES.LESSONS(courseId));
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    },
    staleTime: 60 * 1000,
    enabled: !!courseId,
  });
}

// ===== Enroll in course =====
export function useEnrollCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await api.post(API_ENDPOINTS.COURSES.ENROLL(courseId));
      return response.data;
    },
    onSuccess: (data, courseId) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.lessons(courseId) });
    },
  });
}

// ===== Update course progress =====
export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, progress }: { courseId: string; progress: number }) => {
      const response = await api.patch(API_ENDPOINTS.COURSES.PROGRESS(courseId), { progress });
      return response.data;
    },
    onSuccess: (data, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
}

// ===== Mark lesson complete =====
export function useCompleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, lessonId }: { courseId: string; lessonId: string }) => {
      const response = await api.post(API_ENDPOINTS.COURSES.COMPLETE_LESSON(courseId, lessonId));
      return response.data;
    },
    onSuccess: (data, { courseId, lessonId }) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.lessons(courseId) });
    },
  });
}

// ===== Get my courses =====
export function useMyCourses() {
  return useQuery<Course[]>({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.COURSES.MY_COURSES);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    },
    staleTime: 60 * 1000,
  });
}
