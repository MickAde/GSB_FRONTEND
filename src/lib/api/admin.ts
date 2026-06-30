import apiClient from './client';
import type {
  PaginatedResponse,
  SchoolAdmin,
  SchoolClass,
  SchoolCulture,
  SchoolCulturePayload,
  DailyContent,
  DailyContentFilters,
  DailyContentPayload,
  UserListItem,
  UserDetail,
  UserFilters,
  CreateUserPayload,
  BulkCreatePayload,
  BulkCreateResult,
  UpdateUserPayload,
  SetPasswordPayload,
  Subject,
  CreateSubjectPayload,
  UpdateSubjectPayload,
} from '@/types';

// ── Subjects ──────────────────────────────────────────────────

export const getSubjects = (): Promise<Subject[]> =>
  apiClient.get<Subject[]>('/admin/subjects/').then((r) => r.data);

export const createSubject = (payload: CreateSubjectPayload): Promise<Subject> =>
  apiClient.post<Subject>('/admin/subjects/', payload).then((r) => r.data);

export const updateSubject = (id: string, payload: UpdateSubjectPayload): Promise<Subject> =>
  apiClient.patch<Subject>(`/admin/subjects/${id}/`, payload).then((r) => r.data);

export const deleteSubject = (id: string): Promise<void> =>
  apiClient.delete(`/admin/subjects/${id}/`).then(() => undefined);

// ── Classes ───────────────────────────────────────────────────

export const getClasses = (): Promise<SchoolClass[]> =>
  apiClient.get<SchoolClass[]>('/admin/classes/').then((r) => r.data);

export const createClass = (name: string): Promise<SchoolClass> =>
  apiClient.post<SchoolClass>('/admin/classes/', { name }).then((r) => r.data);

export const renameClass = (id: string, name: string): Promise<SchoolClass> =>
  apiClient.patch<SchoolClass>(`/admin/classes/${id}/`, { name }).then((r) => r.data);

export const deleteClass = (id: string): Promise<void> =>
  apiClient.delete(`/admin/classes/${id}/`).then(() => undefined);

// ── School ────────────────────────────────────────────────────

export const getAdminSchool = (): Promise<SchoolAdmin> =>
  apiClient.get<SchoolAdmin>('/admin/school/').then((r) => r.data);

export const updateAdminSchool = (payload: Partial<SchoolAdmin>): Promise<SchoolAdmin> =>
  apiClient.patch<SchoolAdmin>('/admin/school/', payload).then((r) => r.data);

export const getAdminCulture = (): Promise<SchoolCulture> =>
  apiClient.get<SchoolCulture>('/admin/culture/').then((r) => r.data);

export const updateAdminCulture = (payload: SchoolCulturePayload): Promise<SchoolCulture> =>
  apiClient.put<SchoolCulture>('/admin/culture/', payload).then((r) => r.data);

export const getDailyContent = (filters?: DailyContentFilters): Promise<DailyContent[]> =>
  apiClient.get<DailyContent[]>('/admin/daily-content/', { params: filters }).then((r) => r.data);

export const createDailyContent = (payload: DailyContentPayload): Promise<DailyContent> =>
  apiClient.post<DailyContent>('/admin/daily-content/', payload).then((r) => r.data);

export const updateDailyContent = (
  id: string,
  payload: Partial<Pick<DailyContentPayload, 'body' | 'author'>>
): Promise<DailyContent> =>
  apiClient.patch<DailyContent>(`/admin/daily-content/${id}/`, payload).then((r) => r.data);

export const deleteDailyContent = (id: string): Promise<void> =>
  apiClient.delete(`/admin/daily-content/${id}/`).then(() => undefined);

export const getUsers = (filters?: UserFilters): Promise<PaginatedResponse<UserListItem>> =>
  apiClient.get<PaginatedResponse<UserListItem>>('/admin/users/', { params: filters }).then((r) => r.data);

export const createUser = (payload: CreateUserPayload): Promise<UserDetail> =>
  apiClient.post<UserDetail>('/admin/users/', payload).then((r) => r.data);

export const bulkCreateStudents = (payload: BulkCreatePayload): Promise<BulkCreateResult> =>
  apiClient.post<BulkCreateResult>('/admin/users/bulk/', payload).then((r) => r.data);

export const getUserDetail = (id: string): Promise<UserDetail> =>
  apiClient.get<UserDetail>(`/admin/users/${id}/`).then((r) => r.data);

export const updateUser = (id: string, payload: UpdateUserPayload): Promise<UserDetail> =>
  apiClient.patch<UserDetail>(`/admin/users/${id}/`, payload).then((r) => r.data);

export const deactivateUser = (id: string): Promise<void> =>
  apiClient.delete(`/admin/users/${id}/`).then(() => undefined);

export const setUserPassword = (id: string, payload: SetPasswordPayload): Promise<void> =>
  apiClient.post(`/admin/users/${id}/set-password/`, payload).then(() => undefined);
