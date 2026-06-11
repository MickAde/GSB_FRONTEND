'use client';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { role, schoolId, userId, isStaff, isAuthenticated, clearAuth } = useAuthStore();
  return { role, schoolId, userId, isStaff, isAuthenticated, clearAuth };
}
