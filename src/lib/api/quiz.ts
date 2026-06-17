import apiClient from './client';
import type {
  CreateQuizPayload,
  PerformanceStats,
  QuizAttemptResult,
  QuizDetail,
  QuizListItem,
  QuizStatusPoll,
  StudentPerformanceSummary,
  SubmitAttemptPayload,
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

export const getTeacherStudentStats = (): Promise<StudentPerformanceSummary[]> =>
  apiClient.get<StudentPerformanceSummary[]>('/quiz/teacher/students/').then((r) => r.data);
