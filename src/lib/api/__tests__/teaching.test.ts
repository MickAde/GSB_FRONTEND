import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

import apiClient from '@/lib/api/client'
import {
  getLessonPlans,
  createLessonPlan,
  getLessonPlanDetail,
  updateLessonPlan,
  deleteLessonPlan,
  submitLessonPlan,
  requestAIAssist,
  getLessonPlanComments,
  getAdminLessonPlans,
  getAdminLessonPlanDetail,
  reviewLessonPlan,
} from '@/lib/api/teaching'

const PLAN_ID = 'lp000001-0000-0000-0000-000000000000'

const planListItem = {
  id: PLAN_ID,
  title: 'Introduction to Photosynthesis',
  subject: 'Biology',
  topic: 'Photosynthesis',
  status: 'DRAFT' as const,
  teacher_name: 'Mr. Smith',
  created_at: '2026-06-01T09:00:00Z',
  updated_at: '2026-06-01T09:00:00Z',
}

const planDetail = {
  ...planListItem,
  subtopic: 'Light Reactions',
  duration_minutes: 45,
  objective: 'Students will understand the light-dependent reactions of photosynthesis.',
  materials_needed: 'Textbook chapter 7, diagram cards, green leaf samples',
  introduction: 'Ask students: what do plants eat? Where does their energy come from?',
  main_content: 'Explain chlorophyll and its role in absorbing sunlight...',
  activities: 'Draw the photosynthesis cycle from memory, then compare with the diagram.',
  assessment: 'Exit ticket: name 3 inputs and 2 outputs of photosynthesis.',
  homework: 'Read chapter 7 pages 112-118 and answer review questions 1-5.',
  ai_suggestions: '',
  comments: [],
}

describe('teaching API', () => {
  beforeEach(() => vi.resetAllMocks())

  describe('getLessonPlans()', () => {
    it('GETs /lesson-plans/ and returns list', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [planListItem] })

      const result = await getLessonPlans()

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/lesson-plans/', { params: undefined })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(PLAN_ID)
    })

    it('passes status filter as query param', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] })

      await getLessonPlans({ status: 'SUBMITTED' })

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/lesson-plans/', { params: { status: 'SUBMITTED' } })
    })
  })

  describe('createLessonPlan()', () => {
    it('POSTs to /lesson-plans/ and returns created plan with DRAFT status', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: planDetail })

      const payload = {
        title: 'Introduction to Photosynthesis',
        subject: 'Biology',
        topic: 'Photosynthesis',
      }
      const result = await createLessonPlan(payload)

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/lesson-plans/', payload)
      expect(result.id).toBe(PLAN_ID)
      expect(result.status).toBe('DRAFT')
    })
  })

  describe('getLessonPlanDetail()', () => {
    it('GETs /lesson-plans/:id/ with full detail including comments', async () => {
      const planWithComments = {
        ...planDetail,
        comments: [
          { id: 'c1', author_name: 'Principal Admin', body: 'Please add more assessment criteria.', created_at: '2026-06-02T08:00:00Z' },
        ],
      }
      vi.mocked(apiClient.get).mockResolvedValue({ data: planWithComments })

      const result = await getLessonPlanDetail(PLAN_ID)

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`/lesson-plans/${PLAN_ID}/`)
      expect(result.comments).toHaveLength(1)
      expect(result.comments[0].author_name).toBe('Principal Admin')
      expect(result.objective).toContain('light-dependent')
    })
  })

  describe('updateLessonPlan()', () => {
    it('PATCHes /lesson-plans/:id/ with partial payload', async () => {
      const updatedObjective = 'Students will master both light and dark reactions.'
      vi.mocked(apiClient.patch).mockResolvedValue({ data: { ...planDetail, objective: updatedObjective } })

      const result = await updateLessonPlan(PLAN_ID, { objective: updatedObjective })

      expect(vi.mocked(apiClient.patch)).toHaveBeenCalledWith(`/lesson-plans/${PLAN_ID}/`, { objective: updatedObjective })
      expect(result.objective).toBe(updatedObjective)
    })

    it('can update multiple fields at once', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: planDetail })

      await updateLessonPlan(PLAN_ID, {
        main_content: 'Updated content...',
        activities: 'Updated activities...',
        homework: 'Read chapter 8.',
      })

      expect(vi.mocked(apiClient.patch)).toHaveBeenCalledWith(
        `/lesson-plans/${PLAN_ID}/`,
        expect.objectContaining({ main_content: 'Updated content...', homework: 'Read chapter 8.' }),
      )
    })
  })

  describe('deleteLessonPlan()', () => {
    it('DELETEs /lesson-plans/:id/', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined })

      await deleteLessonPlan(PLAN_ID)

      expect(vi.mocked(apiClient.delete)).toHaveBeenCalledWith(`/lesson-plans/${PLAN_ID}/`)
    })
  })

  describe('submitLessonPlan()', () => {
    it('POSTs to /lesson-plans/:id/submit/ and returns plan with SUBMITTED status', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { ...planDetail, status: 'SUBMITTED' } })

      const result = await submitLessonPlan(PLAN_ID)

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(`/lesson-plans/${PLAN_ID}/submit/`)
      expect(result.status).toBe('SUBMITTED')
    })
  })

  describe('requestAIAssist()', () => {
    it('POSTs to /lesson-plans/:id/ai-assist/ with 60s timeout', async () => {
      const suggestions = 'Consider starting with a Socratic question to activate prior knowledge. Add a hands-on experiment to reinforce the Calvin cycle concepts.'
      vi.mocked(apiClient.post).mockResolvedValue({ data: { ai_suggestions: suggestions } })

      const result = await requestAIAssist(PLAN_ID)

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        `/lesson-plans/${PLAN_ID}/ai-assist/`,
        {},
        { timeout: 60_000 },
      )
      expect(result.ai_suggestions).toContain('Socratic')
    })
  })

  describe('getLessonPlanComments()', () => {
    it('GETs /lesson-plans/:id/comments/', async () => {
      const comments = [
        { id: 'c1', author_name: 'Admin', body: 'Needs more activities.', created_at: '2026-06-02T00:00:00Z' },
      ]
      vi.mocked(apiClient.get).mockResolvedValue({ data: comments })

      const result = await getLessonPlanComments(PLAN_ID)

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`/lesson-plans/${PLAN_ID}/comments/`)
      expect(result).toHaveLength(1)
      expect(result[0].body).toBe('Needs more activities.')
    })
  })

  describe('Admin endpoints', () => {
    describe('getAdminLessonPlans()', () => {
      it('GETs /admin/lesson-plans/ for admin review queue', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({ data: [{ ...planListItem, status: 'SUBMITTED' }] })

        const result = await getAdminLessonPlans()

        expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/admin/lesson-plans/', { params: undefined })
        expect(result[0].status).toBe('SUBMITTED')
      })

      it('filters by status for the review queue', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({ data: [] })

        await getAdminLessonPlans({ status: 'UNDER_REVIEW' })

        expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/admin/lesson-plans/', { params: { status: 'UNDER_REVIEW' } })
      })
    })

    describe('getAdminLessonPlanDetail()', () => {
      it('GETs /admin/lesson-plans/:id/review/', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({ data: planDetail })

        const result = await getAdminLessonPlanDetail(PLAN_ID)

        expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`/admin/lesson-plans/${PLAN_ID}/review/`)
        expect(result.id).toBe(PLAN_ID)
      })
    })

    describe('reviewLessonPlan()', () => {
      it('PATCHes /admin/lesson-plans/:id/review/ with approve + comment', async () => {
        vi.mocked(apiClient.patch).mockResolvedValue({ data: { ...planDetail, status: 'APPROVED', comments: [{ id: 'c2', author_name: 'Admin', body: 'Excellent lesson plan!', created_at: '2026-06-03T08:00:00Z' }] } })

        const result = await reviewLessonPlan(PLAN_ID, { action: 'approve', comment: 'Excellent lesson plan!' })

        expect(vi.mocked(apiClient.patch)).toHaveBeenCalledWith(
          `/admin/lesson-plans/${PLAN_ID}/review/`,
          { action: 'approve', comment: 'Excellent lesson plan!' },
        )
        expect(result.status).toBe('APPROVED')
        expect(result.comments[0].body).toBe('Excellent lesson plan!')
      })

      it('PATCHes with request_revision action to send plan back', async () => {
        vi.mocked(apiClient.patch).mockResolvedValue({ data: { ...planDetail, status: 'REVISION_NEEDED' } })

        const result = await reviewLessonPlan(PLAN_ID, {
          action: 'request_revision',
          comment: 'Please add more formative assessment strategies and expand the activities section.',
        })

        expect(vi.mocked(apiClient.patch)).toHaveBeenCalledWith(
          `/admin/lesson-plans/${PLAN_ID}/review/`,
          { action: 'request_revision', comment: expect.stringContaining('formative assessment') },
        )
        expect(result.status).toBe('REVISION_NEEDED')
      })

      it('can approve without a comment', async () => {
        vi.mocked(apiClient.patch).mockResolvedValue({ data: { ...planDetail, status: 'APPROVED' } })

        await reviewLessonPlan(PLAN_ID, { action: 'approve' })

        expect(vi.mocked(apiClient.patch)).toHaveBeenCalledWith(
          `/admin/lesson-plans/${PLAN_ID}/review/`,
          { action: 'approve' },
        )
      })
    })
  })
})
