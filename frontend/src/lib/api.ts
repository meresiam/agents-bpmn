const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bravy_token');
}

export function setToken(token: string) {
  localStorage.setItem('bravy_token', token);
}

export function clearToken() {
  localStorage.removeItem('bravy_token');
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { skipAuth, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...rest,
  });

  // 401 em endpoint autenticado = sessao expirada -> redireciona pra /login.
  // 401 em endpoint publico (skipAuth) = credencial errada no proprio login ->
  // deixa cair no fluxo de erro pra mostrar a mensagem do backend ("Credenciais invalidas").
  if (res.status === 401 && !skipAuth) {
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Sessao expirada');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}
