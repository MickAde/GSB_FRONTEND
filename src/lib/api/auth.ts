import apiClient from './client';
import type {
  LoginPayload,
  TokenPair,
  VisitorRegisterPayload,
  UserProfile,
  ChangePasswordPayload,
  PasswordResetPayload,
} from '@/types';

export const login = (payload: LoginPayload): Promise<TokenPair> =>
  apiClient.post<TokenPair>('/auth/login/', payload).then((r) => r.data);

export const refreshToken = (refresh: string): Promise<{ access: string }> =>
  apiClient.post<{ access: string }>('/auth/token/refresh/', { refresh }).then((r) => r.data);

export const registerVisitor = (payload: VisitorRegisterPayload): Promise<{ detail: string }> =>
  apiClient.post<{ detail: string }>('/auth/register/visitor/', payload).then((r) => r.data);

export const verifyEmail = (token: string): Promise<TokenPair & { detail: string }> =>
  apiClient.post<TokenPair & { detail: string }>('/auth/verify-email/', { token }).then((r) => r.data);

export const resendVerification = (email: string): Promise<{ detail: string }> =>
  apiClient.post<{ detail: string }>('/auth/resend-verification/', { email }).then((r) => r.data);

export const logout = (refresh: string): Promise<void> =>
  apiClient.post('/auth/logout/', { refresh }).then(() => undefined);

export const getMe = (): Promise<UserProfile> =>
  apiClient.get<UserProfile>('/auth/me/').then((r) => r.data);

export const updateMe = (payload: Partial<Pick<UserProfile, 'first_name' | 'last_name'>>): Promise<UserProfile> =>
  apiClient.patch<UserProfile>('/auth/me/', payload).then((r) => r.data);

export const uploadAvatar = (file: File): Promise<{ avatar_url: string }> => {
  const form = new FormData();
  form.append('avatar', file);
  return apiClient
    .post<{ avatar_url: string }>('/auth/me/avatar/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const deleteAvatar = (): Promise<void> =>
  apiClient.delete('/auth/me/avatar/').then(() => undefined);

export const changePassword = (payload: ChangePasswordPayload): Promise<void> =>
  apiClient.post('/auth/password/change/', payload).then(() => undefined);

export const requestPasswordReset = (email: string): Promise<{ detail: string }> =>
  apiClient.post<{ detail: string }>('/auth/password/reset/', { email }).then((r) => r.data);

export const confirmPasswordReset = (payload: PasswordResetPayload): Promise<void> =>
  apiClient.post('/auth/password/reset/confirm/', payload).then(() => undefined);
