import { apiFetch, setToken, clearToken } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: string;
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  setToken(res.accessToken);
  return res.user;
}

export async function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me');
}

export function logout() {
  clearToken();
  window.location.href = '/login';
}
