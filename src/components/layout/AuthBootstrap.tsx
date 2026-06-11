'use client';
import { useEffect, useRef } from 'react';
import axios from 'axios';
import { getTokens, setAccessToken, clearTokens } from '@/lib/token';
import { useAuthStore } from '@/stores/authStore';

const REFRESH_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000') +
  '/api/v1/auth/token/refresh/';

/**
 * Silently restores the access token on app load when sessionStorage is empty
 * but a refresh token exists in localStorage (e.g. after opening a new tab).
 * Does NOT block rendering — the apiClient retry queue handles any 401s that
 * fire in the gap, and this runs in parallel to eliminate future 401s.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const { access, refresh } = getTokens();
    if (access || !refresh) return; // already have a token, or nothing to restore

    axios
      .post(REFRESH_URL, { refresh })
      .then(({ data }: { data: { access: string } }) => setAccessToken(data.access))
      .catch(() => {
        clearTokens();
        clearAuth();
      });
  }, [clearAuth]);

  return <>{children}</>;
}
