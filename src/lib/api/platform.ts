import apiClient from './client';
import type { SchoolAdmin, CreateSchoolPayload } from '@/types';

export const getPlatformSchools = (): Promise<SchoolAdmin[]> =>
  apiClient.get<SchoolAdmin[]>('/platform/schools/').then((r) => r.data);

export const createSchool = (payload: CreateSchoolPayload): Promise<SchoolAdmin> =>
  apiClient.post<SchoolAdmin>('/platform/schools/', payload).then((r) => r.data);

export const updateSchool = (
  id: string,
  payload: Partial<CreateSchoolPayload> & { is_active?: boolean }
): Promise<SchoolAdmin> =>
  apiClient.patch<SchoolAdmin>(`/platform/schools/${id}/`, payload).then((r) => r.data);

export const getPlatformSchool = (id: string): Promise<SchoolAdmin> =>
  apiClient.get<SchoolAdmin>(`/platform/schools/${id}/`).then((r) => r.data);

export const deleteSchool = (id: string): Promise<void> =>
  apiClient.delete(`/platform/schools/${id}/`).then(() => undefined);
