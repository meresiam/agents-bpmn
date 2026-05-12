import { apiFetch } from '@/lib/api';
import type { ProcessGraphJson } from '@/types/process.types';

export type ProcessCategory =
  | 'COMERCIAL'
  | 'MARKETING'
  | 'FINANCEIRO'
  | 'OPERACOES'
  | 'RH'
  | 'ATENDIMENTO'
  | 'ONBOARDING'
  | 'LOGISTICA'
  | 'JURIDICO'
  | 'TI'
  | 'OUTRO';

export interface ProcessSummary {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  description: string | null;
  category: ProcessCategory;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessDetail extends ProcessSummary {
  graph: ProcessGraphJson;
  layoutOverrides: Record<string, { x: number; y: number }> | null;
}

export interface TenantSummary {
  tenantId: string;
  processCount: number;
}

export async function listProcesses(tenantId?: string): Promise<ProcessSummary[]> {
  const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
  return apiFetch<ProcessSummary[]>(`/processes${query}`);
}

export async function listTenants(): Promise<TenantSummary[]> {
  return apiFetch<TenantSummary[]>('/processes/tenants');
}

export async function getProcess(id: string): Promise<ProcessDetail> {
  return apiFetch<ProcessDetail>(`/processes/${id}`);
}

export async function getSharedProcess(id: string): Promise<ProcessDetail> {
  return apiFetch<ProcessDetail>(`/share/${id}`, { skipAuth: true });
}

export async function createProcess(data: {
  slug: string;
  title: string;
  description?: string;
  category?: ProcessCategory;
  graph: ProcessGraphJson;
  /** Opcional. Apenas SUPER_ADMIN; demais roles ignoram. */
  tenantId?: string;
}): Promise<ProcessDetail> {
  return apiFetch<ProcessDetail>('/processes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProcess(
  id: string,
  data: { title?: string; description?: string; category?: ProcessCategory; graph?: ProcessGraphJson },
): Promise<ProcessDetail> {
  return apiFetch<ProcessDetail>(`/processes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function saveLayoutOverrides(
  id: string,
  overrides: Record<string, { x: number; y: number }>,
): Promise<ProcessDetail> {
  return apiFetch<ProcessDetail>(`/processes/${id}/layout`, {
    method: 'PATCH',
    body: JSON.stringify({ overrides }),
  });
}

export async function resetLayoutOverrides(id: string): Promise<void> {
  await apiFetch(`/processes/${id}/layout`, { method: 'DELETE' });
}
