import apiClient from './client';
import type {
  CreateQuizPayload,
  PerformanceHistoryPoint,
  PerformanceStats,
  QuizAttemptResult,
  QuizDetail,
  QuizListItem,
  QuizStatusPoll,
  StudentPerformanceSummary,
  StudentQuizPreferences,
  StudentPreferencesPayload,
  SubjectLimits,
  SubjectStats,
  SubmitAttemptPayload,
  TeacherSubjectThreshold,
  TeacherThresholdPayload,
  TopicStats,
} from '@/types';

export const createQuiz = (payload: CreateQuizPayload): Promise<{ quiz_id: string; status: string }> =>
  apiClient.post('/quiz/create/', payload).then((r) => r.data);

export const getQuizzes = (): Promise<QuizListItem[]> =>
  apiClient.get<QuizListItem[]>('/quiz/').then((r) => r.data);

export const getQuizDetail = (id: string): Promise<QuizDetail> =>
  apiClient.get<QuizDetail>(`/quiz/${id}/`).then((r) => r.data);

export const getQuizStatus = (id: string): Promise<QuizStatusPoll> =>
  apiClient.get<QuizStatusPoll>(`/quiz/${id}/status/`).then((r) => r.data);

export const submitAttempt = (id: string, payload: SubmitAttemptPayload): Promise<QuizAttemptResult> =>
  apiClient.post<QuizAttemptResult>(`/quiz/${id}/attempt/`, payload).then((r) => r.data);

export const getAttemptResult = (id: string): Promise<QuizAttemptResult> =>
  apiClient.get<QuizAttemptResult>(`/quiz/${id}/attempt/result/`).then((r) => r.data);

export const getPerformanceStats = (): Promise<PerformanceStats> =>
  apiClient.get<PerformanceStats>('/quiz/performance/').then((r) => r.data);

export const getPerformanceHistory = (): Promise<PerformanceHistoryPoint[]> =>
  apiClient.get<PerformanceHistoryPoint[]>('/quiz/performance/history/').then((r) => r.data);

export const getClassPerformanceHistory = (): Promise<PerformanceHistoryPoint[]> =>
  apiClient.get<PerformanceHistoryPoint[]>('/quiz/teacher/class-history/').then((r) => r.data);

export const getTeacherStudentStats = (): Promise<StudentPerformanceSummary[]> =>
  apiClient.get<StudentPerformanceSummary[]>('/quiz/teacher/students/').then((r) => r.data);

// ── Topic / Subject stats ─────────────────────────────────────

export const getTopicStats = (subject: string, topic: string): Promise<TopicStats> =>
  apiClient
    .get<TopicStats>('/quiz/topic-stats/', { params: { subject, topic } })
    .then((r) => r.data);

export const getSubjectStats = (subject: string): Promise<SubjectStats> =>
  apiClient
    .get<SubjectStats>('/quiz/subject-stats/', { params: { subject } })
    .then((r) => r.data);

// ── Quiz settings ─────────────────────────────────────────────

export const getQuizPreferences = (): Promise<StudentQuizPreferences> =>
  apiClient.get<StudentQuizPreferences>('/quiz/preferences/').then((r) => r.data);

export const updateQuizPreferences = (payload: StudentPreferencesPayload): Promise<StudentQuizPreferences> =>
  apiClient.patch<StudentQuizPreferences>('/quiz/preferences/', payload).then((r) => r.data);

export const getSubjectLimits = (subject?: string): Promise<SubjectLimits | SubjectLimits[]> =>
  apiClient
    .get<SubjectLimits | SubjectLimits[]>('/quiz/subject-limits/', { params: subject ? { subject } : undefined })
    .then((r) => r.data);

export const getTeacherThresholds = (): Promise<TeacherSubjectThreshold[]> =>
  apiClient.get<TeacherSubjectThreshold[]>('/quiz/teacher/thresholds/').then((r) => r.data);

export const upsertTeacherThreshold = (payload: TeacherThresholdPayload): Promise<TeacherSubjectThreshold> =>
  apiClient.post<TeacherSubjectThreshold>('/quiz/teacher/thresholds/', payload).then((r) => r.data);

export const updateTeacherThreshold = (id: string, payload: Partial<TeacherThresholdPayload>): Promise<TeacherSubjectThreshold> =>
  apiClient.patch<TeacherSubjectThreshold>(`/quiz/teacher/thresholds/${id}/`, payload).then((r) => r.data);

export const deleteTeacherThreshold = (id: string): Promise<void> =>
  apiClient.delete(`/quiz/teacher/thresholds/${id}/`).then(() => undefined);
