import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

import apiClient from '@/lib/api/client'
import {
  createQuiz,
  getQuizzes,
  getQuizDetail,
  getQuizStatus,
  submitAttempt,
  getAttemptResult,
  getPerformanceStats,
  getTeacherStudentStats,
} from '@/lib/api/quiz'

const QUIZ_ID = 'qz000001-0000-0000-0000-000000000000'
const NOTE_ID = 'nt000001-0000-0000-0000-000000000000'

const quizListItem = {
  id: QUIZ_ID,
  title: 'Biology — Photosynthesis Quiz',
  difficulty: 'moderate' as const,
  num_questions: 10,
  status: 'READY' as const,
  subject: 'Biology',
  note_name: 'biology_notes.pdf',
  attempt_count: 0,
  created_at: '2026-06-01T12:00:00Z',
}

const mcqQuestion = {
  id: 'qq01',
  order: 1,
  question_type: 'MCQ' as const,
  question_text: 'What is the primary site of photosynthesis in a plant cell?',
  option_a: 'Mitochondria',
  option_b: 'Nucleus',
  option_c: 'Chloroplast',
  option_d: 'Vacuole',
}

const tfQuestion = {
  id: 'qq02',
  order: 2,
  question_type: 'TF' as const,
  question_text: 'Photosynthesis produces oxygen as a by-product.',
  option_a: 'True',
  option_b: 'False',
  option_c: '',
  option_d: '',
}

describe('quiz API', () => {
  beforeEach(() => vi.resetAllMocks())

  describe('createQuiz()', () => {
    it('POSTs to /quiz/create/ and returns quiz_id + GENERATING status', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { quiz_id: QUIZ_ID, status: 'GENERATING' } })

      const payload = { note_id: NOTE_ID, difficulty: 'moderate' as const, num_questions: 10 }
      const result = await createQuiz(payload)

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/quiz/create/', payload)
      expect(result.quiz_id).toBe(QUIZ_ID)
      expect(result.status).toBe('GENERATING')
    })

    it('accepts easy difficulty with custom question count', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { quiz_id: QUIZ_ID, status: 'GENERATING' } })

      await createQuiz({ note_id: NOTE_ID, difficulty: 'easy', num_questions: 5 })

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/quiz/create/', {
        note_id: NOTE_ID, difficulty: 'easy', num_questions: 5,
      })
    })
  })

  describe('getQuizzes()', () => {
    it('GETs /quiz/ and returns list of quizzes', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [quizListItem] })

      const result = await getQuizzes()

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/quiz/')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(QUIZ_ID)
      expect(result[0].difficulty).toBe('moderate')
    })

    it('returns empty list when no quizzes exist', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] })

      const result = await getQuizzes()

      expect(result).toHaveLength(0)
    })
  })

  describe('getQuizStatus()', () => {
    it('GETs /quiz/:id/status/ while GENERATING', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { id: QUIZ_ID, status: 'GENERATING', error_message: '', question_count: 0 },
      })

      const result = await getQuizStatus(QUIZ_ID)

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`/quiz/${QUIZ_ID}/status/`)
      expect(result.status).toBe('GENERATING')
    })

    it('returns READY with question_count once complete', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { id: QUIZ_ID, status: 'READY', error_message: '', question_count: 10 },
      })

      const result = await getQuizStatus(QUIZ_ID)

      expect(result.status).toBe('READY')
      expect(result.question_count).toBe(10)
    })
  })

  describe('getQuizDetail()', () => {
    it('GETs /quiz/:id/ including questions when READY', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { ...quizListItem, error_message: '', questions: [mcqQuestion, tfQuestion] },
      })

      const result = await getQuizDetail(QUIZ_ID)

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`/quiz/${QUIZ_ID}/`)
      expect(result.questions).toHaveLength(2)
      expect(result.questions[0].question_type).toBe('MCQ')
      expect(result.questions[1].question_type).toBe('TF')
    })

    it('TF question has empty option_c and option_d', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { ...quizListItem, error_message: '', questions: [tfQuestion] },
      })

      const result = await getQuizDetail(QUIZ_ID)

      expect(result.questions[0].option_c).toBe('')
      expect(result.questions[0].option_d).toBe('')
    })
  })

  describe('submitAttempt()', () => {
    it('POSTs answers array to /quiz/:id/attempt/', async () => {
      const attemptResult = {
        id: 'at1',
        quiz_title: 'Biology — Photosynthesis Quiz',
        quiz_difficulty: 'moderate' as const,
        score: 8,
        total: 10,
        percentage: '80.00',
        time_taken_s: 245,
        completed_at: '2026-06-01T12:15:00Z',
        answers: [],
      }
      vi.mocked(apiClient.post).mockResolvedValue({ data: attemptResult })

      const payload = {
        answers: [
          { question_id: 'qq01', chosen: 'C' },
          { question_id: 'qq02', chosen: 'A' },
        ],
        time_taken_s: 245,
      }
      const result = await submitAttempt(QUIZ_ID, payload)

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(`/quiz/${QUIZ_ID}/attempt/`, payload)
      expect(result.score).toBe(8)
      expect(result.total).toBe(10)
      expect(result.percentage).toBe('80.00')
    })
  })

  describe('getAttemptResult()', () => {
    it('GETs /quiz/:id/attempt/result/ for the most recent attempt', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { id: 'at1', score: 8, total: 10, percentage: '80.00', answers: [] },
      })

      const result = await getAttemptResult(QUIZ_ID)

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`/quiz/${QUIZ_ID}/attempt/result/`)
      expect(result.score).toBe(8)
    })
  })

  describe('getPerformanceStats()', () => {
    it('GETs /quiz/performance/ and returns aggregate stats', async () => {
      const stats = {
        total_attempts: 15,
        overall_average: 74.2,
        readiness_score: 70.0,
        study_streak: 4,
        subjects: [
          { subject: 'Biology', attempts: 8, average: 78.0 },
          { subject: 'Chemistry', attempts: 7, average: 70.0 },
        ],
        difficulty_breakdown: {
          easy: { attempts: 5, average: 90.0 },
          moderate: { attempts: 8, average: 72.0 },
          difficult: { attempts: 2, average: 55.0 },
        },
        recent_attempts: [
          { id: 'at1', quiz_title: 'Bio Quiz', difficulty: 'moderate', score: 8, total: 10, percentage: 80.0, completed_at: '2026-06-01T00:00:00Z' },
        ],
      }
      vi.mocked(apiClient.get).mockResolvedValue({ data: stats })

      const result = await getPerformanceStats()

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/quiz/performance/')
      expect(result.total_attempts).toBe(15)
      expect(result.readiness_score).toBe(70.0)
      expect(result.study_streak).toBe(4)
      expect(result.subjects).toHaveLength(2)
      expect(result.difficulty_breakdown.difficult.average).toBe(55.0)
    })
  })

  describe('getTeacherStudentStats()', () => {
    it('GETs /quiz/teacher/students/ for class monitoring', async () => {
      const students = [
        { id: 'u1', full_name: 'Ada Smith', username: 'STU001', total_attempts: 12, average_score: 82.0, last_active: '2026-06-01T00:00:00Z' },
        { id: 'u2', full_name: 'Ben Jones', username: 'STU002', total_attempts: 5, average_score: 55.0, last_active: '2026-05-28T00:00:00Z' },
      ]
      vi.mocked(apiClient.get).mockResolvedValue({ data: students })

      const result = await getTeacherStudentStats()

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/quiz/teacher/students/')
      expect(result).toHaveLength(2)
      expect(result[1].average_score).toBe(55.0)
    })
  })
})
