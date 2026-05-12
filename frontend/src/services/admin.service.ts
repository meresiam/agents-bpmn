import { apiFetch } from '@/lib/api';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTenant {
  id: string;
  slug: string;
  name: string;
  userCount: number;
  processCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------- Users ----------

export async function listUsers(filters?: {
  tenantId?: string;
  role?: AdminRole;
  q?: string;
}): Promise<AdminUser[]> {
  const params = new URLSearchParams();
  if (filters?.tenantId) params.set('tenantId', filters.tenantId);
  if (filters?.role) params.set('role', filters.role);
  if (filters?.q) params.set('q', filters.q);
  const qs = params.toString();
  return apiFetch<AdminUser[]>(`/admin/users${qs ? `?${qs}` : ''}`);
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  tenantId: string;
  role: AdminRole;
}): Promise<AdminUser> {
  return apiFetch<AdminUser>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  id: string,
  data: { name?: string; tenantId?: string; role?: AdminRole },
): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function resetUserPassword(
  id: string,
  password: string,
): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/admin/users/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}

export async function deleteUser(id: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/admin/users/${id}`, { method: 'DELETE' });
}

// ---------- Tenants ----------

export async function listTenants(): Promise<AdminTenant[]> {
  return apiFetch<AdminTenant[]>('/admin/tenants');
}

export async function createTenant(data: {
  slug: string;
  name: string;
}): Promise<AdminTenant> {
  return apiFetch<AdminTenant>('/admin/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTenant(
  id: string,
  data: { name?: string },
): Promise<AdminTenant> {
  return apiFetch<AdminTenant>(`/admin/tenants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTenant(id: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/admin/tenants/${id}`, { method: 'DELETE' });
}
