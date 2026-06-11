import { jwtDecode } from 'jwt-decode';
import type { JWTPayload } from '@/types';

const ACCESS_KEY  = 'gsb_access';
const REFRESH_KEY = 'gsb_refresh';

// Access tokens in sessionStorage (clears on tab close).
// Refresh tokens in localStorage (persists 7 days).
// For higher security, store in httpOnly cookies via BFF proxy.

export const getTokens = () => ({
  access:  (typeof window !== 'undefined' ? sessionStorage.getItem(ACCESS_KEY)  : null) ?? '',
  refresh: (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY)   : null) ?? '',
});

const AUTH_COOKIE = 'gsb_auth';

export const setTokens = (access: string, refresh: string) => {
  sessionStorage.setItem(ACCESS_KEY,  access);
  localStorage.setItem(REFRESH_KEY,   refresh);
  // Presence cookie so Next.js middleware can redirect unauthenticated users
  // at the server level before React renders. Not sensitive — no token value.
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=604800; SameSite=Lax`;
};

export const setAccessToken = (access: string) => {
  sessionStorage.setItem(ACCESS_KEY, access);
};

export const clearTokens = () => {
  sessionStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
};

export const decodeTokenSync = (token: string): JWTPayload | null => {
  try { return jwtDecode<JWTPayload>(token); }
  catch { return null; }
};
