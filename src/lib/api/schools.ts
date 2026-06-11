import apiClient from './client';
import type { SchoolPublic, SchoolDetail, SchoolCulture } from '@/types';

export const getActiveSchools = (): Promise<SchoolPublic[]> =>
  apiClient.get<SchoolPublic[]>('/schools/active/').then((r) => r.data);

export const getSchoolDetail = (id: string): Promise<SchoolDetail> =>
  apiClient.get<SchoolDetail>(`/schools/${id}/`).then((r) => r.data);

export const getSchoolCulture = (id: string): Promise<SchoolCulture> =>
  apiClient.get<SchoolCulture>(`/schools/${id}/culture/`).then((r) => r.data);
