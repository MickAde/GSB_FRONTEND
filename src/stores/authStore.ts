'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole, JWTPayload } from '@/types';

interface AuthState {
  accessToken:     string | null;
  refreshToken:    string | null;
  userId:          string | null;
  role:            UserRole | null;
  schoolId:        string | null;
  isStaff:         boolean;
  isAuthenticated: boolean;

  setTokens:  (access: string, refresh: string, payload: JWTPayload) => void;
  clearAuth:  () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken:     null,
      refreshToken:    null,
      userId:          null,
      role:            null,
      schoolId:        null,
      isStaff:         false,
      isAuthenticated: false,

      setTokens: (access, refresh, payload) => set({
        accessToken:     access,
        refreshToken:    refresh,
        userId:          payload.user_id,
        role:            payload.role,
        schoolId:        payload.school_id,
        isStaff:         payload.is_staff ?? false,
        isAuthenticated: true,
      }),

      clearAuth: () => set({
        accessToken: null, refreshToken: null,
        userId: null, role: null, schoolId: null,
        isStaff: false, isAuthenticated: false,
      }),
    }),
    {
      name: 'gsb-auth',
      partialize: (state) => ({
        role:            state.role,
        schoolId:        state.schoolId,
        isStaff:         state.isStaff,
        isAuthenticated: state.isAuthenticated,
        userId:          state.userId,
      }),
    }
  )
);
