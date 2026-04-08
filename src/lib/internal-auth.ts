import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SEC,
} from '@/lib/session-cookie';

/** Credenciais fixas — ferramenta interna. Altere aqui ou migre para env em produção. */
export const INTERNAL_ADMIN = {
  username: 'admin',
  password: 'Gatorade100@',
} as const;

export function credentialsMatch(username: string, password: string): boolean {
  return (
    username === INTERNAL_ADMIN.username && password === INTERNAL_ADMIN.password
  );
}

/** Cookie legível pelo middleware (sessão interna). */
export function setSessionCookie(): void {
  document.cookie = `${SESSION_COOKIE_NAME}=1; Path=/; Max-Age=${SESSION_MAX_AGE_SEC}; SameSite=Lax`;
}

export function clearSessionCookie(): void {
  document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0`;
}
