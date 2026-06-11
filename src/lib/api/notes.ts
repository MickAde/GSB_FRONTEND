import apiClient from './client';
import type {
  PaginatedResponse,
  NoteListItem,
  SchoolNoteListItem,
  NoteDetail,
  NoteStatusPoll,
  NoteFilters,
  SchoolNoteFilters,
  NoteMetadataPayload,
  UploadResponse,
  BulkUploadResponse,
  ConfirmOCRResponse,
  ConformityReport,
  ConformityStatusPoll,
  ConformityCreatePayload,
  ConformityCreateResponse,
} from '@/types';

export const uploadNote = (
  formData: FormData,
  onProgress?: (pct: number) => void
): Promise<UploadResponse> =>
  apiClient
    .post<UploadResponse>('/notes/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress) {
          const pct = Math.round((evt.loaded * 100) / (evt.total ?? 1));
          onProgress(pct);
        }
      },
    })
    .then((r) => r.data);

export const bulkUploadNotes = (formData: FormData): Promise<BulkUploadResponse> =>
  apiClient
    .post<BulkUploadResponse>('/notes/upload/bulk/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);

export const getNotes = (filters?: NoteFilters): Promise<PaginatedResponse<NoteListItem>> =>
  apiClient.get<PaginatedResponse<NoteListItem>>('/notes/', { params: filters }).then((r) => r.data);

export const getSchoolNotes = (filters?: SchoolNoteFilters): Promise<PaginatedResponse<SchoolNoteListItem>> =>
  apiClient.get<PaginatedResponse<SchoolNoteListItem>>('/notes/school/', { params: filters }).then((r) => r.data);

export const getNoteDetail = (id: string): Promise<NoteDetail> =>
  apiClient.get<NoteDetail>(`/notes/${id}/`).then((r) => r.data);

export const getNoteStatus = (id: string): Promise<NoteStatusPoll> =>
  apiClient.get<NoteStatusPoll>(`/notes/${id}/status/`).then((r) => r.data);

export const confirmOCR = (id: string, confirmedText: string): Promise<ConfirmOCRResponse> =>
  apiClient
    .post<ConfirmOCRResponse>(`/notes/${id}/confirm-ocr/`, { confirmed_text: confirmedText })
    .then((r) => r.data);

export const replaceNote = (
  id: string,
  formData: FormData,
  onProgress?: (pct: number) => void
): Promise<UploadResponse> =>
  apiClient
    .post<UploadResponse>(`/notes/${id}/replace/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress) {
          const pct = Math.round((evt.loaded * 100) / (evt.total ?? 1));
          onProgress(pct);
        }
      },
    })
    .then((r) => r.data);

export const updateNoteMetadata = (id: string, payload: NoteMetadataPayload): Promise<NoteListItem> =>
  apiClient.patch<NoteListItem>(`/notes/${id}/update/`, payload).then((r) => r.data);

export const deleteNote = (id: string): Promise<void> =>
  apiClient.delete(`/notes/${id}/delete/`).then(() => undefined);

export const getConformityReports = (filters?: object): Promise<ConformityReport[]> =>
  apiClient
    .get<ConformityReport[]>('/notes/conformity/', { params: filters })
    .then((r) => r.data);

export const createConformityReport = (
  payload: ConformityCreatePayload
): Promise<ConformityCreateResponse> =>
  apiClient.post<ConformityCreateResponse>('/notes/conformity/', payload).then((r) => r.data);

export const getConformityReport = (id: string): Promise<ConformityReport> =>
  apiClient.get<ConformityReport>(`/notes/conformity/${id}/`).then((r) => r.data);

export const getConformityStatus = (id: string): Promise<ConformityStatusPoll> =>
  apiClient.get<ConformityStatusPoll>(`/notes/conformity/${id}/status/`).then((r) => r.data);

export const getDailyContentToday = (): Promise<import('@/types').DailyContent | null> =>
  apiClient.get('/daily-content/today/').then((r) => r.data ?? null);
