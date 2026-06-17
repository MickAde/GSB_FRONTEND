import apiClient from './client';
import type {
  AdminReviewPayload,
  LessonPlanComment,
  LessonPlanDetail,
  LessonPlanListItem,
  LessonPlanPayload,
} from '@/types';

export const getLessonPlans = (filters?: { status?: string }): Promise<LessonPlanListItem[]> =>
  apiClient.get<LessonPlanListItem[]>('/lesson-plans/', { params: filters }).then((r) => r.data);

export const createLessonPlan = (payload: LessonPlanPayload): Promise<LessonPlanDetail> =>
  apiClient.post<LessonPlanDetail>('/lesson-plans/', payload).then((r) => r.data);

export const getLessonPlanDetail = (id: string): Promise<LessonPlanDetail> =>
  apiClient.get<LessonPlanDetail>(`/lesson-plans/${id}/`).then((r) => r.data);

export const updateLessonPlan = (id: string, payload: Partial<LessonPlanPayload>): Promise<LessonPlanDetail> =>
  apiClient.patch<LessonPlanDetail>(`/lesson-plans/${id}/`, payload).then((r) => r.data);

export const deleteLessonPlan = (id: string): Promise<void> =>
  apiClient.delete(`/lesson-plans/${id}/`).then(() => undefined);

export const submitLessonPlan = (id: string): Promise<LessonPlanDetail> =>
  apiClient.post<LessonPlanDetail>(`/lesson-plans/${id}/submit/`).then((r) => r.data);

export const requestAIAssist = (id: string): Promise<{ ai_suggestions: string }> =>
  apiClient.post<{ ai_suggestions: string }>(`/lesson-plans/${id}/ai-assist/`, {}, { timeout: 60_000 }).then((r) => r.data);

export const getLessonPlanComments = (id: string): Promise<LessonPlanComment[]> =>
  apiClient.get<LessonPlanComment[]>(`/lesson-plans/${id}/comments/`).then((r) => r.data);

// Admin
export const getAdminLessonPlans = (filters?: { status?: string }): Promise<LessonPlanListItem[]> =>
  apiClient.get<LessonPlanListItem[]>('/admin/lesson-plans/', { params: filters }).then((r) => r.data);

export const getAdminLessonPlanDetail = (id: string): Promise<LessonPlanDetail> =>
  apiClient.get<LessonPlanDetail>(`/admin/lesson-plans/${id}/review/`).then((r) => r.data);

export const reviewLessonPlan = (id: string, payload: AdminReviewPayload): Promise<LessonPlanDetail> =>
  apiClient.patch<LessonPlanDetail>(`/admin/lesson-plans/${id}/review/`, payload).then((r) => r.data);
