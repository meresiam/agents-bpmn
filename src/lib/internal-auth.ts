/** Credenciais fixas — ferramenta interna. Altere aqui ou migre para env em produção. */
export const INTERNAL_ADMIN = {
  username: 'admin',
  password: 'bravy-interno',
} as const;

export const AUTH_STORAGE_KEY = 'bravy-bpmn-session';

export function credentialsMatch(username: string, password: string): boolean {
  return (
    username === INTERNAL_ADMIN.username && password === INTERNAL_ADMIN.password
  );
}

export function readSession(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === '1';
}

export function writeSession(): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, '1');
}

export function clearSession(): void {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
