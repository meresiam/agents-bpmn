'use client';

import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/LoginScreen';
import { setSessionCookie } from '@/lib/internal-auth';

function safeFromParam(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  if (raw.startsWith('/login')) return '/';
  return raw;
}

export default function LoginPage() {
  const router = useRouter();

  function onSuccess() {
    setSessionCookie();
    if (typeof window === 'undefined') {
      router.push('/');
      return;
    }
    const from = safeFromParam(
      new URLSearchParams(window.location.search).get('from'),
    );
    router.push(from);
    router.refresh();
  }

  return <LoginScreen onSuccess={onSuccess} />;
}
