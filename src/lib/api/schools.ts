import apiClient from './client';
import type { SchoolPublic, SchoolDetail, SchoolCulture, SubjectListItem } from '@/types';

export const getActiveSchools = (): Promise<SchoolPublic[]> =>
  apiClient.get<SchoolPublic[]>('/schools/active/').then((r) => r.data);

export const getSchoolDetail = (id: string): Promise<SchoolDetail> =>
  apiClient.get<SchoolDetail>(`/schools/${id}/`).then((r) => r.data);

export const getSchoolCulture = (id: string): Promise<SchoolCulture> =>
  apiClient.get<SchoolCulture>(`/schools/${id}/culture/`).then((r) => r.data);

// Returns general subjects + subjects assigned to the given class.
// Omit classId to get all subjects for the school (admin / unclassified users).
export const getSubjectsForClass = (classId?: string | null): Promise<SubjectListItem[]> =>
  apiClient
    .get<SubjectListItem[]>('/schools/subjects/', { params: classId ? { class_id: classId } : undefined })
    .then((r) => r.data);
