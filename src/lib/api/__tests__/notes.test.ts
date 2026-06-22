import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

import apiClient from '@/lib/api/client'
import {
  getNotes,
  getSchoolNotes,
  getNoteDetail,
  getNoteStatus,
  confirmOCR,
  updateNoteMetadata,
  deleteNote,
  getConformityReports,
  createConformityReport,
  getConformityReport,
  getConformityStatus,
} from '@/lib/api/notes'

const NOTE_ID = 'a1b2c3d4-0001-0000-0000-000000000000'
const REPORT_ID = 'a1b2c3d4-0002-0000-0000-000000000000'

const noteListItem = {
  id: NOTE_ID,
  file_name: 'biology_notes.pdf',
  note_type: 'pdf',
  subject: 'Biology',
  topic: 'Photosynthesis',
  subtopic: 'Light Reactions',
  status: 'READY',
  created_at: '2026-06-01T10:00:00Z',
}

const paginatedNotes = {
  count: 1,
  total_pages: 1,
  next: null,
  previous: null,
  results: [noteListItem],
}

const noteDetail = {
  ...noteListItem,
  owner_name: 'Ada Smith',
  file_url: 'https://storage.example.com/notes/bio.pdf',
  file_size_bytes: 204800,
  raw_ocr_text: 'Photosynthesis is the process by which...',
  ai_summary_paragraph: 'A summary of photosynthesis...',
  ai_bullet_points: ['Light is absorbed by chlorophyll', 'ATP is produced'],
  ai_key_points: ['Chloroplasts', 'Calvin cycle'],
  error_message: '',
  updated_at: '2026-06-01T10:05:00Z',
}

describe('notes API', () => {
  beforeEach(() => vi.resetAllMocks())

  describe('getNotes()', () => {
    it('GETs /notes/ and returns paginated response', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: paginatedNotes })

      const result = await getNotes()

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/notes/', { params: undefined })
      expect(result.count).toBe(1)
      expect(result.results).toHaveLength(1)
      expect(result.results[0].id).toBe(NOTE_ID)
    })

    it('passes status filter as query param', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { ...paginatedNotes, results: [] } })

      await getNotes({ status: 'READY' })

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/notes/', { params: { status: 'READY' } })
    })

    it('passes multiple filters together', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: paginatedNotes })

      await getNotes({ status: 'READY', subject: 'Biology', page: 2 })

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/notes/', {
        params: { status: 'READY', subject: 'Biology', page: 2 },
      })
    })
  })

  describe('getSchoolNotes()', () => {
    it('GETs /notes/school/ for teacher view', async () => {
      const schoolNotes = {
        ...paginatedNotes,
        results: [{ ...noteListItem, owner_id: 'u1', owner_name: 'Ada Smith' }],
      }
      vi.mocked(apiClient.get).mockResolvedValue({ data: schoolNotes })

      const result = await getSchoolNotes()

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/notes/school/', { params: undefined })
      expect(result.results[0]).toHaveProperty('owner_name')
    })
  })

  describe('getNoteDetail()', () => {
    it('GETs /notes/:id/ and returns full note detail', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: noteDetail })

      const result = await getNoteDetail(NOTE_ID)

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`/notes/${NOTE_ID}/`)
      expect(result.raw_ocr_text).toContain('Photosynthesis')
      expect(result.ai_bullet_points).toHaveLength(2)
    })
  })

  describe('getNoteStatus()', () => {
    it('GETs /notes/:id/status/ for polling', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { id: NOTE_ID, status: 'PROCESSING_AI', error_message: '', updated_at: '2026-06-01T10:01:00Z' },
      })

      const result = await getNoteStatus(NOTE_ID)

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`/notes/${NOTE_ID}/status/`)
      expect(result.status).toBe('PROCESSING_AI')
    })
  })

  describe('confirmOCR()', () => {
    it('POSTs confirmed_text to /notes/:id/confirm-ocr/ with 5min timeout', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { note_id: NOTE_ID, task_id: 't1', status: 'PROCESSING_AI' },
      })

      const correctedText = 'Corrected photosynthesis text...'
      const result = await confirmOCR(NOTE_ID, correctedText)

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        `/notes/${NOTE_ID}/confirm-ocr/`,
        { confirmed_text: correctedText },
        { timeout: 300_000 },
      )
      expect(result.status).toBe('PROCESSING_AI')
    })
  })

  describe('updateNoteMetadata()', () => {
    it('PATCHes /notes/:id/update/ with subject/topic', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: { ...noteListItem, topic: 'Dark Reactions' } })

      const result = await updateNoteMetadata(NOTE_ID, { topic: 'Dark Reactions' })

      expect(vi.mocked(apiClient.patch)).toHaveBeenCalledWith(
        `/notes/${NOTE_ID}/update/`,
        { topic: 'Dark Reactions' },
      )
      expect(result.topic).toBe('Dark Reactions')
    })
  })

  describe('deleteNote()', () => {
    it('DELETEs /notes/:id/delete/', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined })

      await deleteNote(NOTE_ID)

      expect(vi.mocked(apiClient.delete)).toHaveBeenCalledWith(`/notes/${NOTE_ID}/delete/`)
    })
  })

  describe('getConformityReports()', () => {
    it('GETs /notes/conformity/ and returns paginated list', async () => {
      const paginatedReports = {
        count: 1, total_pages: 1, next: null, previous: null,
        results: [{
          id: REPORT_ID,
          student_note_id: NOTE_ID,
          student_name: 'Ada Smith',
          teacher_note_id: 'tn1',
          subject: 'Biology',
          conformity_percentage: '78.50',
          similarity_analysis: 'Student notes closely align with teacher material.',
          status: 'DONE',
          generated_at: '2026-06-01T00:00:00Z',
        }],
      }
      vi.mocked(apiClient.get).mockResolvedValue({ data: paginatedReports })

      const result = await getConformityReports()

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/notes/conformity/', { params: undefined })
      expect(result.count).toBe(1)
      expect(result.results[0].conformity_percentage).toBe('78.50')
      expect(result.results[0].student_note_id).toBe(NOTE_ID)
    })
  })

  describe('createConformityReport()', () => {
    it('POSTs student/teacher note IDs to /notes/conformity/', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { report_id: REPORT_ID, task_id: 't2', status: 'PENDING' },
      })

      const result = await createConformityReport({ student_note_id: NOTE_ID, teacher_note_id: 'tn1' })

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/notes/conformity/', {
        student_note_id: NOTE_ID, teacher_note_id: 'tn1',
      })
      expect(result.status).toBe('PENDING')
      expect(result.report_id).toBe(REPORT_ID)
    })
  })

  describe('getConformityReport()', () => {
    it('GETs /notes/conformity/:id/', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { id: REPORT_ID, status: 'DONE' } })

      await getConformityReport(REPORT_ID)

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`/notes/conformity/${REPORT_ID}/`)
    })
  })

  describe('getConformityStatus()', () => {
    it('GETs /notes/conformity/:id/status/ for polling', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { id: REPORT_ID, status: 'PROCESSING', conformity_percentage: '', generated_at: '' },
      })

      const result = await getConformityStatus(REPORT_ID)

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`/notes/conformity/${REPORT_ID}/status/`)
      expect(result.status).toBe('PROCESSING')
    })
  })
})
