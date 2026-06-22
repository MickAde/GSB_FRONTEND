import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getTokens, setAccessToken, clearTokens } from '@/lib/token';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://gsbproject.pythonanywhere.com') + '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { access } = getTokens();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  // Let the browser set Content-Type (with boundary) for multipart requests.
  // The global 'application/json' default would break FormData uploads otherwise.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject:  (err: unknown)  => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token!)
  );
  failedQueue = [];
};

function signOut(redirectPath: string) {
  clearTokens();
  useAuthStore.getState().clearAuth();
  if (typeof window !== 'undefined') window.location.href = redirectPath;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refresh } = getTokens();
      if (!refresh) {
        isRefreshing = false;
        signOut('/');
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh });
        setAccessToken(data.access);
        processQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        signOut('/?session=expired');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
