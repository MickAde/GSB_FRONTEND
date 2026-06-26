import apiClient from './client';
import type {
  AdminReviewLessonDocPayload,
  AdminReviewPayload,
  CreateLessonDocPayload,
  LessonDocDetail,
  LessonDocListItem,
  LessonDocVersion,
  LessonPlanDetail,
  LessonPlanListItem,
  LessonPlanPayload,
  RegenerateSectionPayload,
  UpdateLessonDocPayload,
} from '@/types';

// ── New AI-first Lesson Documents ─────────────────────────────────────────────

export const getLessonDocs = (params?: {
  doc_type?: string;
  status?: string;
}): Promise<LessonDocListItem[]> =>
  apiClient.get<LessonDocListItem[]>('/lesson-docs/', { params }).then((r) => r.data);

export const getDistributedLessonDocs = (params?: {
  subject?: string;
}): Promise<LessonDocListItem[]> =>
  apiClient.get<LessonDocListItem[]>('/lesson-docs/distributed/', { params }).then((r) => r.data);

export const getLessonDocDetail = (id: string): Promise<LessonDocDetail> =>
  apiClient.get<LessonDocDetail>(`/lesson-docs/${id}/`).then((r) => r.data);

export const createLessonDoc = (payload: CreateLessonDocPayload): Promise<LessonDocDetail> =>
  apiClient.post<LessonDocDetail>('/lesson-docs/', payload).then((r) => r.data);

export const updateLessonDoc = (
  id: string,
  payload: UpdateLessonDocPayload,
): Promise<LessonDocDetail> =>
  apiClient.patch<LessonDocDetail>(`/lesson-docs/${id}/`, payload).then((r) => r.data);

export const deleteLessonDoc = (id: string): Promise<void> =>
  apiClient.delete(`/lesson-docs/${id}/`).then(() => undefined);

export const submitLessonDoc = (id: string): Promise<LessonDocDetail> =>
  apiClient.post<LessonDocDetail>(`/lesson-docs/${id}/submit/`).then((r) => r.data);

export const regenerateSection = (
  id: string,
  payload: RegenerateSectionPayload,
): Promise<{ section_heading: string; new_content: string; content_markdown: string }> =>
  apiClient.post(`/lesson-docs/${id}/regenerate-section/`, payload).then((r) => r.data);

export const getLessonDocVersions = (id: string): Promise<LessonDocVersion[]> =>
  apiClient.get<LessonDocVersion[]>(`/lesson-docs/${id}/versions/`).then((r) => r.data);

export const getAdminLessonDocs = (params?: {
  doc_type?: string;
  status?: string;
}): Promise<LessonDocListItem[]> =>
  apiClient.get<LessonDocListItem[]>('/admin/lesson-docs/', { params }).then((r) => r.data);

export const getAdminLessonDocDetail = (id: string): Promise<LessonDocDetail> =>
  apiClient.get<LessonDocDetail>(`/admin/lesson-docs/${id}/`).then((r) => r.data);

export const reviewLessonDoc = (
  id: string,
  payload: AdminReviewLessonDocPayload,
): Promise<LessonDocDetail> =>
  apiClient.post<LessonDocDetail>(`/admin/lesson-docs/${id}/review/`, payload).then((r) => r.data);

// ── Legacy Lesson Plans ───────────────────────────────────────────────────────

export const getLessonPlans = (params?: object): Promise<LessonPlanListItem[]> =>
  apiClient.get<LessonPlanListItem[]>('/lesson-plans/', { params }).then((r) => r.data);

export const getLessonPlanDetail = (id: string): Promise<LessonPlanDetail> =>
  apiClient.get<LessonPlanDetail>(`/lesson-plans/${id}/`).then((r) => r.data);

export const createLessonPlan = (payload: LessonPlanPayload): Promise<LessonPlanDetail> =>
  apiClient.post<LessonPlanDetail>('/lesson-plans/', payload).then((r) => r.data);

export const updateLessonPlan = (
  id: string,
  payload: Partial<LessonPlanPayload>,
): Promise<LessonPlanDetail> =>
  apiClient.patch<LessonPlanDetail>(`/lesson-plans/${id}/`, payload).then((r) => r.data);

export const deleteLessonPlan = (id: string): Promise<void> =>
  apiClient.delete(`/lesson-plans/${id}/`).then(() => undefined);

export const submitLessonPlan = (id: string): Promise<LessonPlanDetail> =>
  apiClient.post<LessonPlanDetail>(`/lesson-plans/${id}/submit/`).then((r) => r.data);

export const requestAIAssist = (id: string): Promise<{ ai_suggestions: string }> =>
  apiClient.post(`/lesson-plans/${id}/ai-assist/`).then((r) => r.data);

export const getAdminLessonPlans = (params?: object): Promise<LessonPlanListItem[]> =>
  apiClient.get<LessonPlanListItem[]>('/admin/lesson-plans/', { params }).then((r) => r.data);

export const getAdminLessonPlanDetail = (id: string): Promise<LessonPlanDetail> =>
  apiClient.get<LessonPlanDetail>(`/admin/lesson-plans/${id}/review/`).then((r) => r.data);

export const reviewLessonPlan = (
  id: string,
  payload: AdminReviewPayload,
): Promise<LessonPlanDetail> =>
  apiClient.post<LessonPlanDetail>(`/admin/lesson-plans/${id}/review/`, payload).then((r) => r.data);
