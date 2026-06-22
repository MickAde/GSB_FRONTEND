import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

import apiClient from '@/lib/api/client'
import {
  login,
  refreshToken,
  getMe,
  updateMe,
  changePassword,
  requestPasswordReset,
  logout,
} from '@/lib/api/auth'

describe('auth API', () => {
  beforeEach(() => vi.resetAllMocks())

  describe('login()', () => {
    it('POSTs to /auth/login/ with student credentials', async () => {
      const tokens = { access: 'access_tok', refresh: 'refresh_tok' }
      vi.mocked(apiClient.post).mockResolvedValue({ data: tokens })

      const payload = { role: 'STUDENT' as const, identifier: 'STU001', password: 'p@ss' }
      const result = await login(payload)

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/auth/login/', payload)
      expect(result).toEqual(tokens)
    })

    it('POSTs to /auth/login/ with teacher credentials', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { access: 'a', refresh: 'r' } })

      await login({ role: 'TEACHER', identifier: 'teacher@school.com', password: 'pass' })

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/auth/login/',
        expect.objectContaining({ role: 'TEACHER', identifier: 'teacher@school.com' }),
      )
    })

    it('POSTs to /auth/login/ with admin credentials', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { access: 'a', refresh: 'r' } })

      await login({ role: 'MAIN_ADMIN', identifier: 'admin@school.com', password: 'pass', school_id: 'sc1' })

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/auth/login/',
        expect.objectContaining({ role: 'MAIN_ADMIN', school_id: 'sc1' }),
      )
    })
  })

  describe('refreshToken()', () => {
    it('POSTs refresh token and returns new access token', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { access: 'new_access' } })

      const result = await refreshToken('old_refresh')

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/auth/token/refresh/', { refresh: 'old_refresh' })
      expect(result).toEqual({ access: 'new_access' })
    })
  })

  describe('getMe()', () => {
    it('GETs /auth/me/ and returns user profile', async () => {
      const profile = {
        id: 'u1', email: 'teacher@school.com', username: null, role: 'TEACHER',
        first_name: 'Ada', last_name: 'Smith', full_name: 'Ada Smith',
        avatar_url: null, school_name: 'Test School', school: 'sc1',
        is_email_verified: true, trial_expires_at: null, date_joined: '2026-01-01T00:00:00Z',
      }
      vi.mocked(apiClient.get).mockResolvedValue({ data: profile })

      const result = await getMe()

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/auth/me/')
      expect(result.role).toBe('TEACHER')
      expect(result.full_name).toBe('Ada Smith')
    })
  })

  describe('updateMe()', () => {
    it('PATCHes /auth/me/ with profile updates', async () => {
      const updated = { first_name: 'Updated', last_name: 'Smith' }
      vi.mocked(apiClient.patch).mockResolvedValue({ data: updated })

      const result = await updateMe({ first_name: 'Updated' })

      expect(vi.mocked(apiClient.patch)).toHaveBeenCalledWith('/auth/me/', { first_name: 'Updated' })
      expect(result.first_name).toBe('Updated')
    })
  })

  describe('changePassword()', () => {
    it('POSTs to /auth/password/change/', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: undefined })

      await changePassword({ old_password: 'old', new_password: 'new123', confirm_password: 'new123' })

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/auth/password/change/', {
        old_password: 'old', new_password: 'new123', confirm_password: 'new123',
      })
    })
  })

  describe('requestPasswordReset()', () => {
    it('POSTs email to /auth/password/reset/ and returns detail', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { detail: 'Password reset email sent.' } })

      const result = await requestPasswordReset('user@school.com')

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/auth/password/reset/', { email: 'user@school.com' })
      expect(result.detail).toContain('email')
    })
  })

  describe('logout()', () => {
    it('POSTs refresh token to /auth/logout/', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: undefined })

      await logout('refresh_tok')

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/auth/logout/', { refresh: 'refresh_tok' })
    })
  })
})
